import { createClient } from '@/lib/supabase/server'

export async function EarningsChart() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all completed reviews with dates
  const { data: reviews } = await supabase
    .from('reviews')
    .select('payment_amount, submitted_at, created_at')
    .eq('reviewer_id', user.id)
    .eq('status', 'completed')
    .order('submitted_at', { ascending: true })

  // Build last-6-months buckets
  const now = new Date()
  const months: { label: string; value: number; month: number; year: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleString('en', { month: 'short' }),
      value: 0,
      month: d.getMonth(),
      year: d.getFullYear(),
    })
  }

  for (const r of (reviews || [])) {
    const d = new Date(r.submitted_at || r.created_at)
    const bucket = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear())
    if (bucket) bucket.value += r.payment_amount || 0
  }

  const maxVal = Math.max(...months.map(m => m.value), 100)
  const total = months.reduce((s, m) => s + m.value, 0)
  const lastMonth = months[months.length - 1]
  const prevMonth = months[months.length - 2]
  const pctChange = prevMonth.value > 0
    ? Math.round(((lastMonth.value - prevMonth.value) / prevMonth.value) * 100)
    : null

  return (
    <div className="bg-white rounded-2xl border border-[#e2e2ec] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-display font-bold text-[#0d0d14] text-sm">Earnings</div>
          <div className="text-[10px] text-[#9898b0] mt-0.5">Last 6 months</div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-bold text-amber-500">${total.toLocaleString()}</div>
          <div className="text-[10px] text-[#9898b0]">total earned</div>
        </div>
      </div>

      {total === 0 ? (
        <div className="flex items-end gap-2 h-20">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t-lg h-2 bg-[#f0f0f8]" />
              <span className="text-[9px] text-[#9898b0]">{m.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-2 h-20">
          {months.map((m, i) => {
            const isLast = i === months.length - 1
            const heightPct = maxVal > 0 ? (m.value / maxVal) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full relative group/bar cursor-default">
                  {m.value > 0 && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0d0d14] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                      ${m.value}
                    </div>
                  )}
                  <div
                    className="w-full rounded-t-lg transition-all duration-500"
                    style={{
                      height: `${Math.max(heightPct * 0.72, m.value > 0 ? 6 : 2)}px`,
                      background: isLast
                        ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                        : m.value > 0 ? '#e8e8f4' : '#f4f4f8',
                    }}
                  />
                </div>
                <span className="text-[9px] text-[#9898b0]">{m.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 pt-4 border-t border-[#f0f0f8] flex justify-between text-xs text-[#9898b0]">
          <span>
            {lastMonth.label}: <strong className="text-[#0d0d14]">${lastMonth.value.toLocaleString()}</strong>
          </span>
          {pctChange !== null && (
            <span className={pctChange >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
              {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange)}% vs {prevMonth.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
