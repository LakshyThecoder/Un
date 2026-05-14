'use client'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: React.ReactNode
  badge?: number | string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
  size?: 'sm' | 'md'
  variant?: 'underline' | 'pill'
}

export function Tabs({ tabs, active, onChange, className, size = 'md', variant = 'underline' }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('flex gap-1 p-1 bg-[#f0f0f5] rounded-xl', className)}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 font-semibold rounded-lg transition-all duration-150',
              'focus:outline-none',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
              active === tab.id
                ? 'bg-white text-[#0d0d14] shadow-sm'
                : 'text-[#6b6b80] hover:text-[#0d0d14]'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                active === tab.id
                  ? 'bg-[#6366f1] text-white'
                  : 'bg-[#e2e2ec] text-[#6b6b80]'
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex border-b border-[#e2e2ec]', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 font-semibold transition-colors duration-150',
            'focus:outline-none',
            size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
            active === tab.id
              ? 'text-[#0d0d14]'
              : 'text-[#9898b0] hover:text-[#6b6b80]'
          )}
        >
          {tab.label}
          {tab.badge !== undefined && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              active === tab.id
                ? 'bg-[#6366f1] text-white'
                : 'bg-[#f0f0f5] text-[#9898b0]'
            )}>
              {tab.badge}
            </span>
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
          )}
        </button>
      ))}
    </div>
  )
}
