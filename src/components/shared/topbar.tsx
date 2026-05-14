'use client'
import { Avatar } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const profile = useAppStore(s => s.profile)

  return (
    <header
      className="h-14 flex-shrink-0 flex items-center px-6 z-10"
      style={{
        background: 'rgba(244,244,248,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-lg font-bold text-[#0d0d14] tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-[#9898b0] font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        {actions}
        <button
          className="relative p-2 rounded-xl transition-colors"
          style={{ color: '#9898b0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e8e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '#0d0d14' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#9898b0' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        </button>
        {profile && (
          <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid #e2e2ec' }}>
            <Avatar name={profile.full_name} src={profile.avatar_url ?? undefined} size="sm" />
            <div className="hidden md:block">
              <div className="text-xs font-bold text-[#0d0d14] leading-tight">{profile.full_name.split(' ')[0]}</div>
              <div className="text-[10px] text-[#9898b0] capitalize">{profile.role}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
