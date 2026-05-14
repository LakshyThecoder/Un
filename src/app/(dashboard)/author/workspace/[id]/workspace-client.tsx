'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Manuscript, Comment, Message, Review, Profile, ManuscriptFile } from '@/types'
import { useAppStore } from '@/lib/store'
import { PdfViewer } from '@/components/workspace/pdf-viewer'
import { CommentPanel } from '@/components/workspace/comment-panel'
import { ReviewChecklist } from '@/components/workspace/review-checklist'
import { Chat } from '@/components/workspace/chat'
import { FilePanel } from '@/components/workspace/file-panel'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { statusToLabel, statusToVariant } from '@/lib/utils'
import toast from 'react-hot-toast'

interface WorkspaceClientProps {
  manuscript: Manuscript & { files?: ManuscriptFile[] }
  initialComments: Comment[]
  initialMessages: Message[]
  review: Review | null
  currentUserId: string
  role: 'author' | 'reviewer'
}

type RightTab = 'comments' | 'checklist' | 'chat' | 'activity'
type MainTab = 'manuscript' | 'figures'

export function WorkspaceClient({ manuscript, initialComments, initialMessages, review, currentUserId, role }: WorkspaceClientProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [rightTab, setRightTab] = useState<RightTab>('comments')
  const [mainTab, setMainTab] = useState<MainTab>('manuscript')
  const [activeFile, setActiveFile] = useState<ManuscriptFile | null>(manuscript.files?.[0] || null)
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)
  const profile = useAppStore(s => s.profile)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`workspace:${manuscript.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `manuscript_id=eq.${manuscript.id}` },
        async payload => {
          const { data } = await supabase.from('comments').select('*, author:profiles(*), replies:comment_replies(*, author:profiles(*))').eq('id', payload.new.id).single()
          if (data) setComments(p => [data, ...p])
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments', filter: `manuscript_id=eq.${manuscript.id}` },
        payload => setComments(p => p.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `manuscript_id=eq.${manuscript.id}` },
        async payload => {
          if (payload.new.sender_id === currentUserId) return
          const { data } = await supabase.from('messages').select('*, sender:profiles(*)').eq('id', payload.new.id).single()
          if (data) setMessages(p => [...p, data])
        })
      .subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [manuscript.id, currentUserId])

  async function addComment(data: {
    quote: string; page: number; x: number; y: number; content: string
    highlight_rects?: import('@/components/workspace/pdf-viewer').HighlightRect[]
  }) {
    const supabase = createClient()
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        manuscript_id: manuscript.id,
        review_id: review?.id || null,
        author_id: currentUserId,
        type: data.quote ? 'inline' : 'general',
        content: data.content,
        quote: data.quote || null,
        page_number: data.page,
        position_x: data.x,
        position_y: data.y,
        highlight_rects: data.highlight_rects ?? null,
        color: role === 'reviewer' ? '#FDE68A' : '#BAE6FD',
      })
      .select('*, author:profiles(*), replies:comment_replies(*)')
      .single()
    if (error) { toast.error('Failed to add comment'); return }
    setComments(p => [comment, ...p])
    toast.success('Comment added')
  }

  async function resolveComment(commentId: string) {
    const supabase = createClient()
    await supabase.from('comments')
      .update({ resolved: true, resolved_by: currentUserId, resolved_at: new Date().toISOString() })
      .eq('id', commentId)
    setComments(p => p.map(c => c.id === commentId ? { ...c, resolved: true } : c))
  }

  async function replyToComment(commentId: string, content: string) {
    const supabase = createClient()
    const { data } = await supabase.from('comment_replies').insert({ comment_id: commentId, author_id: currentUserId, content }).select('*, author:profiles(*)').single()
    if (!data) return
    setComments(p => p.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), data] } : c))
  }

  async function sendMessage(content: string) {
    const supabase = createClient()
    const { data } = await supabase.from('messages').insert({ manuscript_id: manuscript.id, sender_id: currentUserId, content }).select('*, sender:profiles(*)').single()
    if (data) setMessages(p => [...p, data])
  }

  const openComments = comments.filter(c => !c.resolved)
  // For author: otherParty = reviewer. For reviewer: otherParty = manuscript author
  const otherParty: Profile | undefined = role === 'author'
    ? (review?.reviewer as Profile | undefined)
    : ((manuscript as unknown as { author?: Profile }).author ?? undefined)
  const unreadMessages = messages.filter(m => !m.read && m.sender_id !== currentUserId).length

  // Always prefer the original PDF/DOCX — HTML is only a search index, never displayed
  const currentFile = activeFile
    || manuscript.files?.find(f => f.is_primary && f.type !== 'html')
    || manuscript.files?.find(f => f.type !== 'html')
    || {
      id: 'primary', name: manuscript.file_name || 'Manuscript.pdf',
      type: (manuscript.file_type || 'pdf') as import('@/types').FileType,
      url: manuscript.file_url || '',
      size: 0, manuscript_id: manuscript.id, created_at: manuscript.created_at,
    }
  const pdfUrl = currentFile.url || manuscript.file_url || ''

  const rightTabs = [
    { id: 'comments', label: 'Notes', badge: openComments.length || undefined },
    { id: 'checklist', label: 'Checklist' },
    { id: 'chat', label: 'Chat', badge: unreadMessages || undefined },
    { id: 'activity', label: 'Log' },
  ]

  const mainTabs = [
    {
      id: 'manuscript', label: (
        <span className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Manuscript
        </span>
      ),
    },
  ]

  // Build real activity log from comments + messages + review status
  const activityLog = [
    ...comments.slice(0, 5).map(c => ({
      text: c.quote ? `Annotation on "${c.quote.slice(0, 40)}…"` : 'General comment added',
      sub: new Date(c.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      color: c.color === '#FDE68A' ? '#f59e0b' : '#6366f1',
      author: c.author?.full_name,
    })),
    ...messages.slice(-3).map(m => ({
      text: `Message: "${m.content.slice(0, 50)}${m.content.length > 50 ? '…' : ''}"`,
      sub: new Date(m.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      color: '#06b6d4',
      author: m.sender?.full_name,
    })),
    { text: 'Workspace created', sub: new Date(manuscript.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }), color: '#10b981', author: undefined },
  ].sort((a, b) => (b.sub > a.sub ? 1 : -1)).slice(0, 10)

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f4f4f8]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 bg-white border-b border-[#e2e2ec] flex items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Badge variant={statusToVariant(manuscript.status)} dot>{statusToLabel(manuscript.status)}</Badge>
            {manuscript.field && <span className="text-xs font-medium text-[#9898b0]">{manuscript.field}</span>}
          </div>
          <div className="font-display font-bold text-[#0d0d14] text-sm truncate">{manuscript.title}</div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {review?.reviewer && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#e2e2ec] bg-[#f4f4f8]">
              <Avatar name={(review.reviewer as Profile).full_name} size="xs" />
              <div>
                <div className="text-xs font-bold text-[#0d0d14] leading-tight">{(review.reviewer as Profile).full_name}</div>
                <div className="text-[9px] text-[#9898b0]">Reviewer</div>
              </div>
            </div>
          )}
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold text-[#9898b0]">Progress</span>
              <span className="text-[10px] font-bold text-[#0d0d14]">{manuscript.progress || 0}%</span>
            </div>
            <Progress value={manuscript.progress || 0} height={4} />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981', animation: 'pulse-ring 2s ease-out infinite' }} />
            <span className="text-xs font-bold text-emerald-600">Live</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* File sidebar */}
        {manuscript.files && manuscript.files.length > 1 && (
          <FilePanel
            files={manuscript.files}
            activeFileId={currentFile.id}
            onSelect={f => { setActiveFile(f); setMainTab(f.type === 'image' ? 'figures' : 'manuscript') }}
          />
        )}

        {/* Main viewer */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="bg-white border-b border-[#e2e2ec] px-3 flex-shrink-0">
            <Tabs tabs={mainTabs} active={mainTab} onChange={t => setMainTab(t as MainTab)} size="sm" />
          </div>
          <div className="flex-1 overflow-hidden">
            {mainTab === 'manuscript' && pdfUrl ? (
              <PdfViewer
                url={pdfUrl}
                comments={comments}
                onAddComment={addComment}
                onCommentClick={id => { setActiveCommentId(id); setRightTab('comments') }}
                activeCommentId={activeCommentId}
                readOnly={role === 'author'}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-3">📄</div>
                  <p className="font-semibold text-[#0d0d14] mb-1">No file available</p>
                  <p className="text-sm text-[#9898b0]">This manuscript has no attached file.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[300px] flex-shrink-0 flex flex-col overflow-hidden bg-white border-l border-[#e2e2ec]">
          <div className="border-b border-[#e2e2ec] px-2">
            <Tabs tabs={rightTabs} active={rightTab} onChange={t => setRightTab(t as RightTab)} size="sm" />
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'comments' && (
              <CommentPanel
                comments={comments}
                currentUser={profile!}
                onResolve={resolveComment}
                onReply={replyToComment}
                activeCommentId={activeCommentId}
                setActiveCommentId={setActiveCommentId}
              />
            )}
            {rightTab === 'checklist' && (
              <ReviewChecklist
                initialItems={review?.checklist_data || undefined}
                initialScore={review?.overall_score || 0}
                readOnly={role === 'author'}
                onSave={async (items, score, recommendation) => {
                  const supabase = createClient()
                  if (!review?.id) return
                  await supabase.from('reviews').update({ checklist_data: items, overall_score: score, recommendation }).eq('id', review.id)
                  toast.success('Review saved')
                }}
              />
            )}
            {rightTab === 'chat' && (
              <Chat messages={messages} currentUser={profile!} onSend={sendMessage} otherParty={otherParty} />
            )}
            {rightTab === 'activity' && (
              <div className="p-4 overflow-y-auto h-full">
                <p className="text-[10px] font-bold text-[#9898b0] uppercase tracking-wider mb-4">Activity Log</p>
                {activityLog.length === 0 ? (
                  <p className="text-xs text-[#9898b0] text-center py-8">No activity yet</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e2e2ec]" />
                    <div className="space-y-4">
                      {activityLog.map((a, i) => (
                        <div key={i} className="flex gap-3 items-start pl-1">
                          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 border-2 border-white z-10"
                               style={{ background: a.color, boxShadow: `0 0 0 2px ${a.color}33` }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0d0d14] leading-snug">{a.text}</div>
                            {a.author && <div className="text-[10px] text-[#6b6b80] mt-0.5">{a.author}</div>}
                            <div className="text-[10px] text-[#9898b0] mt-0.5">{a.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
