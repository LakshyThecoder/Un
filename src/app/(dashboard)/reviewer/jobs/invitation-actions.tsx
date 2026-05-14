'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface Props {
  invitationId: string
  manuscriptId: string
  reviewerId: string
}

export function InvitationActions({ invitationId, manuscriptId, reviewerId }: Props) {
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const router = useRouter()

  async function accept() {
    setLoading('accept')
    const supabase = createClient()
    try {
      // Create a review record
      const { data: review, error: revErr } = await supabase
        .from('reviews')
        .insert({
          manuscript_id: manuscriptId,
          reviewer_id: reviewerId,
          status: 'active',
          payment_amount: 220,
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (revErr) throw revErr

      // Mark invitation as accepted
      await supabase
        .from('reviewer_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)

      // Update manuscript status
      await supabase
        .from('manuscripts')
        .update({ status: 'in_review', progress: 40 })
        .eq('id', manuscriptId)

      toast.success('Review accepted! Opening workspace…')
      router.push(`/reviewer/workspace/${manuscriptId}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error('Failed to accept invitation')
      setLoading(null)
    }
  }

  async function decline() {
    setLoading('decline')
    const supabase = createClient()
    await supabase
      .from('reviewer_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId)
    toast.success('Invitation declined')
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      <Button
        size="sm"
        variant="gradient"
        loading={loading === 'accept'}
        disabled={loading !== null}
        onClick={accept}
      >
        Accept & Start
      </Button>
      <button
        onClick={decline}
        disabled={loading !== null}
        className="text-xs text-[#9898b0] hover:text-red-500 font-medium transition-colors text-center py-1"
      >
        {loading === 'decline' ? 'Declining…' : 'Decline'}
      </button>
    </div>
  )
}
