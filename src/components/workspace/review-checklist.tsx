'use client'
import { useState } from 'react'
import { ChecklistItem } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Originality & Significance
  { id: 1, label: 'Research question is clearly stated and novel', status: null, category: 'Originality' },
  { id: 2, label: 'Contribution advances the field meaningfully', status: null, category: 'Originality' },
  { id: 3, label: 'Prior literature is adequately cited and synthesized', status: null, category: 'Originality' },
  // Methodology
  { id: 4, label: 'Study design is appropriate for the stated aims', status: null, category: 'Methodology' },
  { id: 5, label: 'Sample size is justified (power analysis / n stated)', status: null, category: 'Methodology' },
  { id: 6, label: 'Inclusion/exclusion criteria are transparent', status: null, category: 'Methodology' },
  { id: 7, label: 'Statistical methods are appropriate and clearly described', status: null, category: 'Methodology' },
  { id: 8, label: 'Potential sources of bias are addressed', status: null, category: 'Methodology' },
  // Results
  { id: 9, label: 'Primary outcomes match the pre-stated aims', status: null, category: 'Results' },
  { id: 10, label: 'Effect sizes and confidence intervals are reported', status: null, category: 'Results' },
  { id: 11, label: 'Figures and tables are accurate, labelled, and necessary', status: null, category: 'Results' },
  // Discussion & Conclusions
  { id: 12, label: 'Conclusions are supported by the results', status: null, category: 'Discussion' },
  { id: 13, label: 'Limitations are honestly and thoroughly discussed', status: null, category: 'Discussion' },
  { id: 14, label: 'Clinical/practical implications are appropriate', status: null, category: 'Discussion' },
  // Presentation
  { id: 15, label: 'Abstract accurately reflects the full study', status: null, category: 'Presentation' },
  { id: 16, label: 'Writing is clear, concise, and free from jargon', status: null, category: 'Presentation' },
  { id: 17, label: 'References are complete, relevant, and properly formatted', status: null, category: 'Presentation' },
]

interface ReviewChecklistProps {
  initialItems?: ChecklistItem[]
  initialScore?: number
  onSave?: (items: ChecklistItem[], score: number, recommendation: string) => void
  readOnly?: boolean
}

const RECOMMENDATIONS = [
  { value: 'accept', label: 'Accept', icon: '✓', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
  { value: 'minor_revision', label: 'Minor Revision', icon: '↻', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
  { value: 'major_revision', label: 'Major Revision', icon: '⚠', color: '#f97316', bg: '#fff7ed', border: '#fdba74' },
  { value: 'reject', label: 'Reject', icon: '✕', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
]

export function ReviewChecklist({ initialItems, initialScore = 0, onSave, readOnly }: ReviewChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems?.length ? initialItems : DEFAULT_CHECKLIST)
  const [score, setScore] = useState(initialScore)
  const [recommendation, setRecommendation] = useState('minor_revision')
  const [summary, setSummary] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const categories = [...new Set(items.map(i => i.category))]
  const passed  = items.filter(i => i.status === 'pass').length
  const flagged = items.filter(i => i.status === 'flag').length
  const total   = items.length
  const completion = Math.round(((passed + flagged) / total) * 100)

  function toggleStatus(id: number, status: 'pass' | 'flag') {
    if (readOnly) return
    setItems(p => p.map(it => it.id === id ? { ...it, status: it.status === status ? null : status } : it))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await onSave?.(items, score, recommendation)
    setSaving(false)
    setSaved(true)
  }

  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const rec = RECOMMENDATIONS.find(r => r.value === recommendation)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header: score + completion */}
      <div className="px-4 py-4 border-b border-[#e2e2ec] bg-[#fafafa] flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-center">
            <div className="font-display text-3xl font-bold leading-none" style={{ color: scoreColor }}>{score}</div>
            <div className="text-[9px] text-[#9898b0] uppercase tracking-wider">/ 100</div>
          </div>
          {!readOnly ? (
            <input
              type="range" min={0} max={100} value={score}
              onChange={e => { setScore(+e.target.value); setSaved(false) }}
              className="flex-1"
              style={{ accentColor: scoreColor }}
            />
          ) : (
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#e2e2ec]">
              <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Passed', value: passed, color: '#10b981' },
            { label: 'Flagged', value: flagged, color: '#f59e0b' },
            { label: 'Pending', value: total - passed - flagged, color: '#9898b0' },
          ].map(s => (
            <div key={s.label} className="flex-1 text-center p-2 rounded-xl" style={{ background: `${s.color}11` }}>
              <div className="font-display font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-[#9898b0] uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
          <div className="flex-1 text-center p-2 rounded-xl bg-[#f0f0f8]">
            <div className="font-display font-bold text-sm text-[#6366f1]">{completion}%</div>
            <div className="text-[9px] text-[#9898b0] uppercase tracking-wider">Done</div>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat)
          const catPassed = catItems.filter(i => i.status === 'pass').length
          const catFlagged = catItems.filter(i => i.status === 'flag').length
          const catDone = catPassed + catFlagged
          const isOpen = !collapsed[cat]
          return (
            <div key={cat} className="mb-4">
              <button
                className="flex items-center justify-between w-full mb-2 group"
                onClick={() => setCollapsed(p => ({ ...p, [cat]: !p[cat] }))}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0] group-hover:text-[#6b6b80]">{cat}</span>
                  <span className="text-[9px] font-bold text-[#9898b0]">{catDone}/{catItems.length}</span>
                </div>
                <svg className={cn('w-3 h-3 text-[#9898b0] transition-transform', isOpen && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && catItems.map(item => (
                <div key={item.id} className={cn(
                  'flex items-center gap-2 mb-1.5 rounded-xl border px-3 py-2 transition-colors',
                  item.status === 'pass' ? 'bg-emerald-50 border-emerald-200' :
                  item.status === 'flag' ? 'bg-amber-50 border-amber-200' :
                  'bg-white border-[#e2e2ec] hover:border-[#d0d0e8]'
                )}>
                  <span className="flex-1 text-xs text-[#0d0d14] leading-snug">{item.label}</span>
                  {!readOnly && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(item.id, 'pass')}
                        className={cn(
                          'w-6 h-6 rounded-lg border flex items-center justify-center transition-all',
                          item.status === 'pass' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[#e2e2ec] text-emerald-500 hover:border-emerald-400'
                        )}
                        title="Pass"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleStatus(item.id, 'flag')}
                        className={cn(
                          'w-6 h-6 rounded-lg border flex items-center justify-center transition-all',
                          item.status === 'flag' ? 'border-amber-500 bg-amber-500 text-white' : 'border-[#e2e2ec] text-amber-500 hover:border-amber-400'
                        )}
                        title="Flag concern"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5l9-2 9 2v10l-9 2-9-2" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {readOnly && item.status && (
                    <span className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                      item.status === 'pass' ? 'text-emerald-600 bg-emerald-100' : 'text-amber-600 bg-amber-100'
                    )}>
                      {item.status === 'pass' ? 'Pass' : 'Flagged'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* Recommendation + summary */}
        {!readOnly && (
          <div className="mt-4 pt-4 border-t border-[#e2e2ec] space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0] mb-2">Recommendation</div>
              <div className="grid grid-cols-2 gap-2">
                {RECOMMENDATIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => { setRecommendation(r.value); setSaved(false) }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-xl border transition-all',
                    )}
                    style={recommendation === r.value
                      ? { background: r.bg, borderColor: r.border, color: r.color }
                      : { background: 'white', borderColor: '#e2e2ec', color: '#9898b0' }
                    }
                  >
                    <span>{r.icon}</span> {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0] mb-2">Review Summary</div>
              <textarea
                value={summary}
                onChange={e => { setSummary(e.target.value); setSaved(false) }}
                placeholder="Brief overall summary for the author — key strengths, main concerns, and specific revision requests…"
                rows={4}
                className="w-full text-xs border border-[#e2e2ec] rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-[#0d0d14] placeholder:text-[#9898b0] leading-relaxed"
              />
            </div>

            <Button
              variant="gradient"
              fullWidth
              loading={saving}
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? '✓ Saved' : 'Save Review Progress'}
            </Button>
          </div>
        )}

        {readOnly && rec && (
          <div className="mt-4 pt-4 border-t border-[#e2e2ec]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#9898b0] mb-2">Recommendation</div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border font-bold text-sm"
                 style={{ background: rec.bg, borderColor: rec.border, color: rec.color }}>
              {rec.icon} {rec.label}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
