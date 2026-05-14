import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/shared/topbar'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { formatDate, statusToLabel, statusToVariant } from '@/lib/utils'
import Link from 'next/link'
import { InvitationActions } from './invitation-actions'
import { AcceptReviewButton } from './accept-review-button'

interface ManuscriptRow {
  id: string; title: string; field?: string; abstract?: string; target_journal?: string
  author?: { full_name: string; institution?: string; avatar_url?: string }
}
interface ReviewRow {
  id: string; manuscript_id: string; status: string; payment_amount: number
  deadline?: string; overall_score?: number; manuscript: ManuscriptRow | null
}
interface InvitationRow {
  id: string; manuscript_id: string; match_score?: number; manuscript: ManuscriptRow | null
}

export default async function ReviewerJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: reviews }, { data: invitations }] = await Promise.all([
    supabase
      .from('reviews')
      .select('*, manuscript:manuscripts(id, title, field, abstract, target_journal, author:profiles(full_name, institution, avatar_url))')
      .eq('reviewer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('reviewer_invitations')
      .select('*, manuscript:manuscripts(id, title, field, abstract, target_journal, author:profiles(full_name, institution))')
      .eq('reviewer_id', user.id)
      .eq('status', 'sent'),
  ])

  const typedReviews = (reviews || []) as ReviewRow[]
  const typedInvitations = (invitations || []) as InvitationRow[]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Review Jobs"
        subtitle={`${typedReviews.length} job${typedReviews.length !== 1 ? 's' : ''}${typedInvitations.length ? ` · ${typedInvitations.length} new invitation${typedInvitations.length !== 1 ? 's' : ''}` : ''}`}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* ── Pending Invitations ── */}
        {typedInvitations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-display text-sm font-bold text-[#0d0d14]">New Invitations</h2>
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                {typedInvitations.length}
              </span>
            </div>
            <div className="space-y-3">
              {typedInvitations.map(inv => {
                const ms = inv.manuscript
                return (
                  <div key={inv.id} className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm"
                       style={{ boxShadow: '0 0 0 1px rgba(251,191,36,0.2), 0 4px 16px rgba(251,191,36,0.08)' }}>
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="warning" dot>New Invitation</Badge>
                          {ms?.field && <span className="text-xs font-medium text-[#9898b0]">{ms.field}</span>}
                          {inv.match_score && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              {inv.match_score}% match
                            </span>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-[#0d0d14] text-sm leading-snug mb-2 line-clamp-2">
                          {ms?.title || 'Untitled'}
                        </h3>
                        {ms?.abstract && (
                          <p className="text-xs text-[#9898b0] line-clamp-2 mb-3 leading-relaxed">{ms.abstract}</p>
                        )}
                        {ms?.author && (
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar name={ms.author.full_name} size="xs" />
                            <span className="text-xs text-[#6b6b80]">{ms.author.full_name}</span>
                            {ms.author.institution && <span className="text-[10px] text-[#9898b0]">· {ms.author.institution}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-5 text-xs text-[#9898b0]">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            5 days to complete
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-amber-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            $220 guaranteed
                          </span>
                        </div>
                      </div>
                      <InvitationActions
                        invitationId={inv.id}
                        manuscriptId={inv.manuscript_id}
                        reviewerId={user.id}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── All Jobs ── */}
        <div>
          <h2 className="font-display text-sm font-bold text-[#0d0d14] mb-4">All Jobs</h2>
          {typedReviews.length === 0 && typedInvitations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e2ec] p-16 text-center shadow-sm">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="font-display font-bold text-[#0d0d14] text-lg mb-2">No jobs yet</h3>
              <p className="text-sm text-[#9898b0] max-w-sm mx-auto mb-5">
                Complete your reviewer profile with expertise tags to get matched with manuscripts in your field.
              </p>
              <Link href="/settings">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  Complete profile →
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {typedReviews.map(r => {
                const ms = r.manuscript
                const progressVal = r.status === 'completed' ? 100 : r.status === 'active' ? 55 : 10
                return (
                  <div key={r.id} className="group bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant={statusToVariant(r.status)} dot>{statusToLabel(r.status)}</Badge>
                          {ms?.field && <span className="text-xs font-medium text-[#9898b0]">{ms.field}</span>}
                        </div>
                        <h3 className="font-display font-bold text-[#0d0d14] text-sm leading-snug mb-2 line-clamp-2">
                          {ms?.title || 'Untitled'}
                        </h3>
                        {ms?.author && (
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar name={ms.author.full_name} size="xs" />
                            <span className="text-xs text-[#6b6b80]">{ms.author.full_name}</span>
                            {ms.author.institution && <span className="text-[10px] text-[#9898b0]">· {ms.author.institution}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-6 mb-3">
                          <div className="flex-1 max-w-[180px]">
                            <div className="flex justify-between mb-1">
                              <span className="text-[10px] text-[#9898b0]">Progress</span>
                              <span className="text-[10px] font-bold text-[#0d0d14]">{progressVal}%</span>
                            </div>
                            <Progress value={progressVal} height={3} />
                          </div>
                          {r.deadline && (
                            <span className="text-xs text-[#9898b0] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {r.status === 'completed' ? 'Submitted' : `Due ${formatDate(r.deadline)}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <div className="font-display text-2xl font-bold text-amber-500">${r.payment_amount}</div>
                        {r.status === 'completed' && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Paid ✓</span>
                        )}
                        {r.status === 'active' && ms?.id && (
                          <Link href={`/reviewer/workspace/${r.manuscript_id}`}>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                              Open Workspace →
                            </span>
                          </Link>
                        )}
                        {r.status === 'pending' && (
                          <AcceptReviewButton reviewId={r.id} manuscriptId={r.manuscript_id} />
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
  )
}
