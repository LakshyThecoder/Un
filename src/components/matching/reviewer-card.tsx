'use client'
import { ReviewerMatch } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ExternalReviewer } from '@/lib/apis/matching'

interface ReviewerCardProps {
  match: ReviewerMatch & { reviewer: ExternalReviewer }
  rank?: number
  onInvite: (reviewerId: string) => void
  invited?: boolean
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}

function ProfileLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'white'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.15)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.08)' }}
    >
      {icon}
      {label}
      <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

function ProfileLinkLight({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border border-[#e2e2ec] bg-white text-[#6b6b80] hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
    >
      {icon}
      {label}
      <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  )
}

const SSIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
  </svg>
)
const OAIcon = () => <span style={{ fontWeight: 900, fontSize: 9 }}>OA</span>
const GSchIcon = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 24a7 7 0 110-14 7 7 0 010 14zm0-24L0 9.5l4.838 3.94A8 8 0 0112 10a8 8 0 017.162 3.44L24 9.5z"/>
  </svg>
)
const OrcidIcon = () => <span style={{ fontWeight: 900, fontSize: 9, color: '#A6CE39' }}>iD</span>

export function ReviewerCard({ match, rank, onInvite, invited, selected, onSelect, compact }: ReviewerCardProps) {
  const { reviewer: r, match_score, concept_overlap } = match
  const ext = r as ExternalReviewer

  const sourceLabel = ext.source === 'semantic_scholar'
    ? 'Semantic Scholar'
    : ext.source === 'openalex'
    ? 'OpenAlex'
    : 'Platform'

  const sourceBadgeColor = ext.source === 'semantic_scholar'
    ? 'bg-blue-500/20 text-blue-300'
    : ext.source === 'openalex'
    ? 'bg-emerald-500/20 text-emerald-300'
    : 'bg-indigo-500/20 text-indigo-300'

  if (compact) {
    return (
      <div
        onClick={onSelect}
        className={cn(
          'flex items-center gap-3 p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-150',
          selected ? 'border-indigo-400 bg-indigo-50' : 'border-[#e2e2ec] hover:border-[#c8c8d8]'
        )}
      >
        <Avatar name={r.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[#0d0d14] text-sm truncate">{r.full_name}</div>
          <div className="text-xs text-[#9898b0] truncate">{r.institution || 'Independent Researcher'}</div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {concept_overlap.slice(0,3).map(t => (
              <span key={t} className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded-full font-semibold">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-display text-xl font-bold text-[#0d0d14] tabular-nums">{match_score}</div>
          <div className="text-[9px] text-[#9898b0] font-semibold">/100</div>
          <div className="mt-1 w-14">
            <Progress value={match_score} height={3} />
          </div>
        </div>
        {/* External link buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {ext.semantic_scholar_url && (
            <ProfileLinkLight href={ext.semantic_scholar_url} label="SS" icon={<SSIcon />} />
          )}
          {ext.openalex_url && (
            <ProfileLinkLight href={ext.openalex_url} label="OA" icon={<OAIcon />} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-2xl p-7 text-white relative overflow-hidden',
      rank === 1 ? 'ring-2 ring-amber-400/30' : ''
    )} style={{ background: '#0d0d14' }}>
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-5 border-[50px] border-white pointer-events-none" />
      <div className="absolute top-0 right-0 w-48 h-48 opacity-5 blur-3xl rounded-full pointer-events-none"
           style={{ background: rank === 1 ? '#f59e0b' : '#6366f1' }} />

      {/* Header badges */}
      <div className="flex items-center gap-2 mb-5">
        {rank === 1 && (
          <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Top Recommendation
          </span>
        )}
        <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', sourceBadgeColor)}>
          via {sourceLabel}
        </span>
      </div>

      <div className="flex items-start gap-6">
        {/* Left column: avatar + score */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <Avatar name={r.full_name} size="xl" ring />
          <div className="text-center">
            <div className="font-display text-3xl font-bold tabular-nums leading-none"
                 style={{ color: match_score >= 80 ? '#34d399' : match_score >= 60 ? '#fbbf24' : '#9898b0' }}>
              {match_score}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>/100 match</div>
          </div>
          {/* Profile links */}
          <div className="flex flex-col gap-1.5 w-full">
            {ext.semantic_scholar_url && (
              <ProfileLink href={ext.semantic_scholar_url} label="Semantic Scholar" icon={<SSIcon />} />
            )}
            {ext.openalex_url && (
              <ProfileLink href={ext.openalex_url} label="OpenAlex" icon={<OAIcon />} />
            )}
            {ext.orcid_url && (
              <ProfileLink href={ext.orcid_url} label="ORCID" icon={<OrcidIcon />} />
            )}
            {ext.google_scholar_url && (
              <ProfileLink href={ext.google_scholar_url} label="Google Scholar" icon={<GSchIcon />} />
            )}
          </div>
        </div>

        {/* Right column: info */}
        <div className="flex-1 min-w-0">
          <div className="font-display text-xl font-bold text-white leading-tight">{r.full_name}</div>
          {r.institution && (
            <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {r.institution}
            </div>
          )}
          {r.field && (
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.field}</div>
          )}

          {/* Match bar */}
          <div className="mt-4 mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>Research Compatibility</span>
              <span className="text-xs font-bold" style={{ color: match_score >= 80 ? '#34d399' : '#fbbf24' }}>{match_score}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${match_score}%`,
                  background: match_score >= 80
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                }}
              />
            </div>
          </div>

          {/* Concept overlap tags */}
          {concept_overlap.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {concept_overlap.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Publications', value: r.publication_count ? r.publication_count.toLocaleString() : '—' },
              { label: 'h-index', value: r.h_index || '—' },
              { label: 'Delivery', value: `≤${r.avg_turnaround_days || 5}d` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/8">
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</div>
                <div className="text-sm font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Recent papers */}
          {ext.recent_papers && ext.recent_papers.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Relevant Papers
              </div>
              <div className="space-y-2">
                {ext.recent_papers.slice(0, 2).map((p, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs font-medium text-white/80 leading-snug line-clamp-2">{p.title}</div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {p.year && <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.year}</span>}
                      {p.venue && <span className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{p.venue}</span>}
                      {p.citations != null && (
                        <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {p.citations} citations
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Uknow review fee</div>
              <div className="font-display text-2xl font-bold text-amber-400">$349</div>
            </div>
            <Button
              variant={invited ? 'secondary' : 'gradient'}
              onClick={() => !invited && onInvite(r.id)}
              className={invited ? 'opacity-60' : ''}
            >
              {invited ? '✓ Invited' : 'Invite Reviewer →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
