import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shared/topbar'
import { StatCard } from '@/components/shared/stat-card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Review } from '@/types'
import { statusToLabel, statusToVariant, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { EarningsChart } from './earnings-chart'

export default async function ReviewerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: reviews }, { data: invitations }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('reviews')
      .select('*, manuscript:manuscripts(id, title, field, target_journal, abstract, author:profiles(full_name, institution))')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('reviewer_invitations')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('status', 'sent'),
  ])

  const completed = (reviews || []).filter((r: Review) => r.status === 'completed')
  const active    = (reviews || []).filter((r: Review) => r.status === 'active')
  const totalEarned = completed.reduce((s: number, r: Review) => s + (r.payment_amount || 0), 0)
  const avgRating = profile?.rating || 0
  const pendingInvites = (invitations || []).length

  const expertiseTags = (profile as unknown as { expertise_tags?: string[] })?.expertise_tags || []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={`Welcome back, ${profile?.full_name?.split(' ')[1] || profile?.full_name || 'Reviewer'}`}
        subtitle="Your expert work, tracked and compensated."
        actions={pendingInvites > 0 ? (
          <Link href="/reviewer/jobs">
            <Button variant="gradient" size="sm">
              {pendingInvites} invitation{pendingInvites > 1 ? 's' : ''} waiting →
            </Button>
          </Link>
        ) : undefined}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Reviewer profile card */}
        <div className="bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm mb-6">
          <div className="flex items-start gap-4">
            <Avatar name={profile?.full_name || 'R'} size="lg" ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-display font-bold text-[#0d0d14] text-base">{profile?.full_name}</span>
                {profile?.verified && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                    ✓ Verified
                  </span>
                )}
                {avgRating > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                    ★ {avgRating.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="text-sm text-[#6b6b80]">{profile?.institution || 'No institution set'}</div>
              {profile?.bio && (
                <p className="text-xs text-[#9898b0] mt-2 leading-relaxed line-clamp-2">{profile.bio}</p>
              )}
              {expertiseTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {expertiseTags.slice(0, 6).map((t: string) => (
                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {t}
                    </span>
                  ))}
                  {expertiseTags.length > 6 && (
                    <span className="text-[10px] text-[#9898b0] py-0.5">+{expertiseTags.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
            <Link href="/settings">
              <Button size="sm" variant="outline">Edit profile</Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Earned" value={`$${totalEarned.toLocaleString()}`} sub="Lifetime"
            gradient="#f59e0b"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard label="Completed" value={completed.length} sub="Expert reviews"
            gradient="#06b6d4"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
          <StatCard label="Avg. Rating" value={avgRating ? `${avgRating.toFixed(1)}★` : 'New'} sub="From authors"
            gradient="#8b5cf6"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
          />
          <StatCard label="Active Jobs" value={active.length} sub="In progress"
            gradient="#10b981"
            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Earnings chart */}
          <div className="lg:col-span-1">
            <EarningsChart />
          </div>

          {/* Active jobs */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-sm font-bold text-[#0d0d14] mb-4">
              Review Jobs
              {pendingInvites > 0 && (
                <Link href="/reviewer/jobs" className="ml-3 text-[10px] font-bold text-indigo-600 hover:underline">
                  {pendingInvites} new invite{pendingInvites > 1 ? 's' : ''} →
                </Link>
              )}
            </h2>
            {(!reviews || reviews.length === 0) ? (
              <div className="bg-white rounded-2xl border border-[#e2e2ec] p-10 text-center shadow-sm">
                <div className="text-3xl mb-3">💼</div>
                <p className="font-display font-bold text-[#0d0d14] mb-1">No review jobs yet</p>
                <p className="text-sm text-[#9898b0] mb-4">Complete your profile to get matched with manuscripts.</p>
                <Link href="/settings"><Button size="sm" variant="gradient">Complete profile →</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(reviews as (Review & { manuscript?: { id?: string; title: string; field?: string; abstract?: string; author?: { full_name: string; institution?: string } } })[]).map(r => {
                  const ms = r.manuscript
                  const progressVal = r.status === 'completed' ? 100 : r.status === 'active' ? 55 : 10
                  return (
                    <div key={r.id} className="group bg-white rounded-2xl border border-[#e2e2ec] p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant={statusToVariant(r.status)} dot>{statusToLabel(r.status)}</Badge>
                            {ms?.field && <span className="text-[10px] font-medium text-[#9898b0]">{ms.field}</span>}
                          </div>
                          <div className="font-display text-xs font-bold text-[#0d0d14] leading-snug mb-1.5 line-clamp-2">
                            {ms?.title || 'Untitled Manuscript'}
                          </div>
                          {ms?.author && (
                            <div className="text-[10px] text-[#9898b0] mb-2">
                              by {ms.author.full_name}
                              {r.deadline && <> · Due {formatDate(r.deadline)}</>}
                            </div>
                          )}
                          <Progress value={progressVal} height={3} />
                        </div>
                        <div className="flex-shrink-0 text-right ml-2">
                          <div className="font-display font-bold text-amber-500">${r.payment_amount}</div>
                          <div className="text-[10px] text-[#9898b0] mb-2">
                            {r.status === 'completed' ? '✓ paid' : 'guaranteed'}
                          </div>
                          {r.status === 'active' && r.manuscript_id && (
                            <Link href={`/reviewer/workspace/${r.manuscript_id}`}>
                              <span className="text-[10px] font-bold text-indigo-600 hover:underline">Open →</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
