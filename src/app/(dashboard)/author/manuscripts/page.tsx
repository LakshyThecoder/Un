import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shared/topbar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Manuscript } from '@/types'
import { statusToLabel, statusToVariant, formatDate } from '@/lib/utils'
import Link from 'next/link'

function ManuscriptStatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <span className="text-emerald-500">✓</span>
  if (status === 'in_review') return <span className="text-indigo-500">👁</span>
  if (status === 'matched') return <span className="text-violet-500">🎯</span>
  if (status === 'rejected') return <span className="text-red-500">✕</span>
  return <span className="text-amber-500">○</span>
}

export default async function ManuscriptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: manuscripts, error } = await supabase
    .from('manuscripts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const stats = {
    total: manuscripts?.length || 0,
    inReview: manuscripts?.filter(m => m.status === 'in_review').length || 0,
    completed: manuscripts?.filter(m => m.status === 'completed').length || 0,
    matched: manuscripts?.filter(m => m.status === 'matched').length || 0,
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="My Manuscripts"
        subtitle={`${stats.total} submission${stats.total !== 1 ? 's' : ''} total`}
        actions={
          <Link href="/author/submit">
            <Button variant="gradient" size="sm">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Submission
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', bg: '#eef2ff' },
            { label: 'In Review', value: stats.inReview, color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Matched', value: stats.matched, color: '#06b6d4', bg: '#ecfeff' },
            { label: 'Completed', value: stats.completed, color: '#10b981', bg: '#ecfdf5' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0] mb-2">{s.label}</div>
              <div className="font-display text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Manuscripts list */}
        {!manuscripts?.length ? (
          <div className="bg-white rounded-2xl border border-[#e2e2ec] p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📄</div>
            <div className="font-display font-bold text-[#0d0d14] text-xl mb-2">No manuscripts yet</div>
            <p className="text-[#9898b0] mb-6 max-w-sm mx-auto">
              Submit your first manuscript to find matched expert reviewers from Semantic Scholar and OpenAlex.
            </p>
            <Link href="/author/submit">
              <Button variant="gradient" size="lg">Submit your first manuscript</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {manuscripts.map((m: Manuscript) => (
              <ManuscriptRow key={m.id} manuscript={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ManuscriptRow({ manuscript: m }: { manuscript: Manuscript }) {
  const hasFile = !!m.file_url
  const canOpenWorkspace = ['in_review', 'revision_requested', 'completed'].includes(m.status)

  return (
    <div className="group bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-150">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
             style={{ background: 'linear-gradient(135deg, #f0f0f8, #e8e8f0)' }}>
          📄
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-display font-bold text-[#0d0d14] text-sm leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {m.title || 'Untitled Manuscript'}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {m.field && (
                  <span className="text-[10px] font-semibold text-[#9898b0] bg-[#f4f4f8] px-2 py-0.5 rounded-full">{m.field}</span>
                )}
                {m.target_journal && (
                  <span className="text-[10px] text-[#9898b0]">→ {m.target_journal}</span>
                )}
                <span className="text-[10px] text-[#9898b0]">{formatDate(m.created_at)}</span>
              </div>
            </div>
            <Badge variant={statusToVariant(m.status)} dot>{statusToLabel(m.status)}</Badge>
          </div>

          {m.abstract && (
            <p className="text-xs text-[#6b6b80] leading-relaxed line-clamp-2 mb-3">{m.abstract}</p>
          )}

          {/* Progress + semantic concepts */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#9898b0]">Review progress</span>
                <span className="text-[10px] font-bold text-[#0d0d14]">{m.progress || 0}%</span>
              </div>
              <Progress value={m.progress || 0} height={3} />
            </div>

            {m.semantic_concepts && Array.isArray(m.semantic_concepts) && m.semantic_concepts.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {(m.semantic_concepts as { tag: string; category?: string }[]).slice(0, 4).map((c, i) => (
                  <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {c.tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {canOpenWorkspace && (
            <Link href={`/author/workspace/${m.id}`}>
              <Button size="sm" variant="gradient">Open Workspace</Button>
            </Link>
          )}
          {!canOpenWorkspace && (
            <Link href={`/author/workspace/${m.id}`}>
              <Button size="sm" variant="outline">View</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
