'use client'
import { cn } from '@/lib/utils'
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  error?: string
  hint?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefix, suffix, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-[#6b6b80] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[#9898b0] pointer-events-none">{prefix}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-10 rounded-xl border border-[#e2e2ec] bg-white px-3.5 text-sm text-[#0d0d14] placeholder:text-[#9898b0]',
              'focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400',
              'transition-all duration-150',
              'disabled:bg-[#f4f4f8] disabled:text-[#9898b0] disabled:cursor-not-allowed',
              error && 'border-red-400 focus:ring-red-400/20 focus:border-red-400',
              prefix && 'pl-10',
              suffix && 'pr-10',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-[#9898b0]">{suffix}</div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9898b0]">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-[#6b6b80] uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-xl border border-[#e2e2ec] bg-white px-3.5 py-3 text-sm text-[#0d0d14] placeholder:text-[#9898b0]',
            'focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400',
            'transition-all duration-150 resize-none',
            'disabled:bg-[#f4f4f8] disabled:text-[#9898b0]',
            error && 'border-red-400 focus:ring-red-400/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-[#9898b0]">{hint}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'
