'use client'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'purple' | 'gradient'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
  dot?: boolean
}

const variants: Record<Variant, string> = {
  default:  'bg-[#f0f0f5] text-[#6b6b80] border border-[#e2e2ec]',
  success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:  'bg-amber-50 text-amber-700 border border-amber-200',
  error:    'bg-red-50 text-red-600 border border-red-200',
  info:     'bg-cyan-50 text-cyan-700 border border-cyan-200',
  outline:  'bg-transparent border border-[#e2e2ec] text-[#6b6b80]',
  purple:   'bg-violet-50 text-violet-700 border border-violet-200',
  gradient: 'text-white border-0',
}

const dots: Record<Variant, string> = {
  default: 'bg-[#9898b0]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-cyan-500',
  outline: 'bg-[#9898b0]',
  purple:  'bg-violet-500',
  gradient: 'bg-white',
}

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        variants[variant],
        variant === 'gradient' && 'bg-gradient-to-r from-indigo-500 to-violet-500',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant])} />
      )}
      {children}
    </span>
  )
}
