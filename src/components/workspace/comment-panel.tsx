'use client'
import { useState } from 'react'
import { Comment, CommentReply, Profile, HighlightRect } from '@/types'
import { cn, formatRelative, truncate } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface CommentPanelProps {
  comments: Comment[]
  currentUser: Profile
  onResolve: (commentId: string) => void
  onReply: (commentId: string, content: string) => void
  activeCommentId?: string | null
  setActiveCommentId?: (id: string | null) => void
}

const HIGHLIGHT_BORDER: Record<string, string> = {
  '#FDE68A': '#f59e0b',
  '#BAE6FD': '#0ea5e9',
}

export function CommentPanel({ comments, currentUser, onResolve, onReply, activeCommentId, setActiveCommentId }: CommentPanelProps) {
  const open = comments.filter(c => !c.resolved)
  const resolved = comments.filter(c => c.resolved)

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {open.length === 0 && resolved.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
          <div className="w-12 h-12 rounded-2xl bg-[#f4f4f8] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#9898b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#0d0d14] mb-1">No annotations yet</p>
          <p className="text-xs text-[#9898b0] leading-relaxed">Select any text in the manuscript — a comment box will appear</p>
        </div>
      )}

      {open.length > 0 && (
        <div>
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0]">Open</span>
            <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {open.length}
            </span>
          </div>
          <div className="flex flex-col gap-2 px-3 pb-3">
            {open.map(c => (
              <CommentCard
                key={c.id}
                comment={c}
                currentUser={currentUser}
                active={activeCommentId === c.id}
                onClick={() => setActiveCommentId?.(activeCommentId === c.id ? null : c.id)}
                onResolve={() => onResolve(c.id)}
                onReply={text => onReply(c.id, text)}
              />
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-2 border-t border-[#e2e2ec] pt-3">
          <div className="px-4 pb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0]">Resolved</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">{resolved.length}</span>
          </div>
          <div className="flex flex-col gap-2 px-3 pb-3 opacity-60">
            {resolved.map(c => <CommentCard key={c.id} comment={c} currentUser={currentUser} resolved />)}
          </div>
        </div>
      )}
    </div>
  )
}

interface CommentCardProps {
  comment: Comment
  currentUser: Profile
  active?: boolean
  resolved?: boolean
  onClick?: () => void
  onResolve?: () => void
  onReply?: (text: string) => void
}

function CommentCard({ comment: c, currentUser: _cu, active, resolved, onClick, onResolve, onReply }: CommentCardProps) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState(active || false)

  const accentColor = HIGHLIGHT_BORDER[c.color || ''] ?? '#6366f1'
  const hasHighlight = !!(c.highlight_rects as HighlightRect[] | null)?.length

  function submitReply() {
    if (!replyText.trim() || !onReply) return
    onReply(replyText.trim())
    setReplyText('')
    setShowReply(false)
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border transition-all duration-150',
        active ? 'shadow-md' : 'hover:border-[#d0d0e8]',
        resolved ? 'border-[#f0f0f8] bg-[#fafafa]' : 'border-[#e2e2ec] bg-white',
        onClick && 'cursor-pointer'
      )}
      style={active ? { borderColor: accentColor, boxShadow: `0 0 0 2px ${accentColor}22` } : {}}
    >
      {/* Highlight chip */}
      {hasHighlight && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
               style={{ background: `${accentColor}44`, border: `1.5px solid ${accentColor}` }} />
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>
            Highlighted text
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={c.author?.full_name || 'User'} size="xs" />
          <span className="text-xs font-bold text-[#0d0d14] flex-1 leading-tight">{c.author?.full_name}</span>
          <span className="text-[10px] text-[#9898b0]">{formatRelative(c.created_at)}</span>
        </div>

        {/* Quoted text */}
        {c.quote && (
          <div className="mb-2.5 pl-2.5 py-1 rounded-r-lg" style={{ borderLeft: `2.5px solid ${accentColor}` }}>
            <p className="text-[11px] text-[#6b6b80] italic leading-relaxed line-clamp-2">
              "{truncate(c.quote, 90)}"
            </p>
          </div>
        )}

        {/* Comment body */}
        <p className="text-xs text-[#0d0d14] leading-relaxed">{c.content}</p>

        {/* Page indicator */}
        {c.page_number && (
          <div className="flex items-center gap-1 mt-2">
            <svg className="w-3 h-3 text-[#9898b0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] text-[#9898b0]">Page {c.page_number}</span>
          </div>
        )}

        {/* Actions */}
        {!resolved && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#f0f0f8]">
            {onResolve && (
              <button
                onClick={e => { e.stopPropagation(); onResolve() }}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Resolve
              </button>
            )}
            {onReply && (
              <button
                onClick={e => { e.stopPropagation(); setShowReply(s => !s) }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#9898b0] hover:text-[#6b6b80] transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
            )}
            {(c.replies?.length || 0) > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setShowReplies(s => !s) }}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#9898b0] hover:text-[#6b6b80] transition-colors ml-auto"
              >
                {c.replies!.length} {c.replies!.length === 1 ? 'reply' : 'replies'}
                <svg className={cn('w-3 h-3 transition-transform', showReplies && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Replies thread */}
        {showReplies && c.replies?.map((r: CommentReply) => (
          <div key={r.id} className="mt-3 pl-3 border-l-2 border-[#e2e2ec]">
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar name={r.author?.full_name || 'User'} size="xs" />
              <span className="text-[11px] font-bold text-[#0d0d14]">{r.author?.full_name}</span>
              <span className="text-[10px] text-[#9898b0] ml-auto">{formatRelative(r.created_at)}</span>
            </div>
            <p className="text-xs text-[#6b6b80] leading-relaxed">{r.content}</p>
          </div>
        ))}

        {/* Reply input */}
        {showReply && (
          <div className="mt-3 pl-3 border-l-2 border-[#e2e2ec]" onClick={e => e.stopPropagation()}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              autoFocus
              placeholder="Write a reply…"
              rows={2}
              className="w-full text-xs border border-[#e2e2ec] rounded-xl px-2.5 py-2 resize-none outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-[#0d0d14]"
            />
            <div className="flex gap-2 mt-1.5 justify-end">
              <button onClick={() => setShowReply(false)} className="text-[11px] text-[#9898b0] hover:text-[#6b6b80]">Cancel</button>
              <Button size="xs" variant="gradient" onClick={submitReply} disabled={!replyText.trim()}>Reply</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
