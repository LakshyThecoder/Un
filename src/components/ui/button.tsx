'use client'
import { cn } from '@/lib/utils'
import { forwardRef, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient' | 'warm'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-[#0d0d14] text-white hover:bg-[#1a1a2e] active:scale-[0.98] shadow-sm',
  secondary: 'bg-[#f0f0f5] text-[#0d0d14] hover:bg-[#e4e4ec] active:scale-[0.98]',
  ghost: 'bg-transparent text-[#6b6b80] hover:bg-[#f0f0f5] hover:text-[#0d0d14]',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] shadow-sm',
  outline: 'bg-white text-[#0d0d14] border border-[#e2e2ec] hover:border-[#c8c8d8] hover:bg-[#fafafa] active:scale-[0.98] shadow-sm',
  gradient: 'text-white shadow-lg shadow-indigo-200 active:scale-[0.98]',
  warm: 'text-white shadow-lg shadow-amber-200 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2.5 text-[11px] rounded-lg gap-1',
  sm: 'h-8 px-3.5 text-xs rounded-xl gap-1.5',
  md: 'h-9 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-6 text-sm rounded-2xl gap-2',
  xl: 'h-13 px-8 text-base rounded-2xl gap-2.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, style, ...props }, ref) => {
    const isGradient = variant === 'gradient'
    const isWarm = variant === 'warm'

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={
          isGradient
            ? { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', ...style }
            : isWarm
            ? { background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)', ...style }
            : style
        }
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none whitespace-nowrap',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin shrink-0" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
