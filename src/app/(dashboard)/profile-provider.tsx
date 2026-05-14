'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Profile } from '@/types'

export function ProfileProvider({ children, profile }: { children: React.ReactNode; profile: Profile | null }) {
  const setProfile = useAppStore(s => s.setProfile)
  useEffect(() => { setProfile(profile) }, [profile, setProfile])
  return <>{children}</>
}
