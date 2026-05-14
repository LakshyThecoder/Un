import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  glass?: boolean
  gradient?: boolean
}

export function Card({ children, className, hover, onClick, glass, gradient }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border',
        glass
          ? 'bg-white/70 backdrop-blur-xl border-white/80 shadow-sm'
          : gradient
          ? 'border-transparent bg-gradient-to-br from-indigo-50 to-purple-50'
          : 'bg-white border-[#e2e2ec] shadow-sm',
        hover && 'cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-[#c8c8d8] hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-display text-lg font-bold text-[#0d0d14] tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>
}
