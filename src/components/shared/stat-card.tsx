import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  gradient?: string
  className?: string
}

export function StatCard({ label, value, sub, trend, icon, gradient, className }: StatCardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl border border-[#e2e2ec] p-5 shadow-sm relative overflow-hidden',
      className
    )}>
      {gradient && (
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10 blur-xl rounded-full"
             style={{ background: gradient }} />
      )}
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="font-display text-3xl font-bold text-[#0d0d14] tracking-tight leading-none">
            {value}
          </div>
          <div className="mt-2 text-xs font-medium text-[#9898b0]">{label}</div>
          {sub && (
            <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold">
              {trend === 'up' && <span className="text-emerald-500">↑</span>}
              {trend === 'down' && <span className="text-red-500">↓</span>}
              <span className={trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-[#6b6b80]'}>
                {sub}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl" style={{ background: gradient ? `${gradient}15` : '#f0f0f5' }}>
            <div style={{ color: gradient ? gradient.match(/#[0-9a-f]+/i)?.[0] : '#9898b0' }}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
