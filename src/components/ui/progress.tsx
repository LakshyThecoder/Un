import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  color?: string
  height?: number
  className?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, height = 4, className, showLabel }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: '#f0f0f5' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 80
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : pct >= 50
              ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
              : 'linear-gradient(90deg, #06b6d4, #6366f1)',
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color: '#9898b0' }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  )
}
