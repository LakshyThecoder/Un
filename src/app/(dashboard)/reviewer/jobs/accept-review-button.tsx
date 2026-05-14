'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export function AcceptReviewButton({ reviewId, manuscriptId }: { reviewId: string; manuscriptId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function accept() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('reviews').update({ status: 'active' }).eq('id', reviewId)
    await supabase.from('manuscripts').update({ status: 'in_review', progress: 40 }).eq('id', manuscriptId)
    toast.success('Review accepted!')
    router.push(`/reviewer/workspace/${manuscriptId}`)
    router.refresh()
  }

  return (
    <Button size="sm" variant="gradient" loading={loading} onClick={accept}>
      Accept
    </Button>
  )
}
