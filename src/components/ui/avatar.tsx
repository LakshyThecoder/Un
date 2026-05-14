import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
  ring?: boolean
}

const sizes = {
  xs:  'w-6 h-6 text-[9px]',
  sm:  'w-8 h-8 text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
}

const gradients = [
  'from-indigo-400 to-violet-500',
  'from-cyan-400 to-blue-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-pink-500',
  'from-purple-400 to-indigo-500',
  'from-teal-400 to-cyan-500',
  'from-orange-400 to-red-500',
]

function getGradient(name: string = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}

export function Avatar({ name = '', src, size = 'md', className, ring }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizes[size],
          ring && 'ring-2 ring-white ring-offset-1',
          className
        )}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white',
        `bg-gradient-to-br ${getGradient(name)}`,
        sizes[size],
        ring && 'ring-2 ring-white ring-offset-1',
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
