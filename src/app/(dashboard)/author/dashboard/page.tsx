import { createClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/shared/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Manuscript } from '@/types'
import { statusToLabel, statusToVariant, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function AuthorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: manuscripts }, { data: stats }] = await Promise.all([
    supabase
      .from('manuscripts')
      .select('*, reviews(id, status, reviewer:profiles(full_name, avatar_url))')
      .eq('author_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('manuscripts')
      .select('status, review_price')
      .eq('author_id', user!.id),
  ])

  const totalSpent = (stats || []).filter(m => m.status === 'completed').reduce((s: number, m: { review_price: number }) => s + (m.review_price || 0), 0)
  const active = (manuscripts || []).filter((m: Manuscript) => !['draft', 'completed', 'rejected'].includes(m.status)).length
  const completed = (manuscripts || []).filter((m: Manuscript) => m.status === 'completed').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Your Manuscripts"
        subtitle="Track submissions, reviews, and revision status."
        actions={
          <Link href="/author/submit">
            <Button size="sm" variant="gradient">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New manuscript
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Manuscripts"
            value={active}
            sub={`${(manuscripts || []).length} total`}
            trend="up"
            gradient="#6366f1"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Avg. Turnaround"
            value="11d"
            sub="vs. 47d industry avg."
            trend="up"
            gradient="#8b5cf6"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Reviews Completed"
            value={completed}
            sub="expert reviews"
            trend="neutral"
            gradient="#10b981"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Invested"
            value={`$${totalSpent.toLocaleString()}`}
            sub="in expert review"
            trend="neutral"
            gradient="#f59e0b"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Submit CTA */}
        <div className="relative rounded-2xl p-6 overflow-hidden flex items-center justify-between" style={{ background: '#0d0d14' }}>
          <div className="absolute inset-0 opacity-30 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)' }} />
          <div className="relative">
            <div className="font-display text-base font-bold text-white mb-1">Ready for your next submission?</div>
            <div className="text-sm text-white/50">Upload and get matched with expert reviewers within 24 hours.</div>
          </div>
          <div className="relative">
            <Link href="/author/submit">
              <Button variant="gradient" size="lg">
                Submit Manuscript
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
          </div>
        </div>

        {/* Manuscript list */}
        {(!manuscripts || manuscripts.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-2xl"
                 style={{ background: 'linear-gradient(135deg, #f0f0f5, #e8e8f0)' }}>📄</div>
            <h3 className="font-display text-lg font-bold text-[#0d0d14] mb-2">No manuscripts yet</h3>
            <p className="text-sm text-[#9898b0] mb-6">Submit your first manuscript to get expert peer review.</p>
            <Link href="/author/submit">
              <Button variant="gradient">Submit your first manuscript →</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-display text-sm font-bold text-[#0d0d14]">Recent Manuscripts</h2>
            {manuscripts.map((m: Manuscript & { reviews?: { id: string; status: string; reviewer?: { full_name: string; avatar_url?: string } }[] }) => (
              <Card key={m.id} hover className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant={statusToVariant(m.status)} dot>{statusToLabel(m.status)}</Badge>
                      {m.field && <span className="text-xs font-medium text-[#9898b0]">{m.field}</span>}
                    </div>
                    <div className="font-display text-base font-bold text-[#0d0d14] mb-1 leading-snug">{m.title}</div>
                    <div className="text-xs text-[#9898b0] font-medium mb-3">
                      {m.target_journal && <>{m.target_journal} · </>}
                      {formatDate(m.created_at)}
                    </div>
                    <Progress value={m.progress} height={4} />
                    {m.reviews?.[0]?.reviewer && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar name={m.reviews[0].reviewer.full_name} size="xs" />
                        <span className="text-xs text-[#6b6b80]">
                          Reviewed by <span className="font-semibold text-[#0d0d14]">{m.reviews[0].reviewer.full_name}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {['in_review', 'matched', 'revision_requested'].includes(m.status) && (
                      <Link href={`/author/workspace/${m.id}`}>
                        <Button size="sm" variant="outline">Open Workspace →</Button>
                      </Link>
                    )}
                    {m.status === 'draft' && (
                      <Link href={`/author/submit?draft=${m.id}`}>
                        <Button size="sm" variant="secondary">Continue →</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
