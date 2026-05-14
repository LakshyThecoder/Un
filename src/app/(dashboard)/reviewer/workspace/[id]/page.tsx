import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceClient } from '@/app/(dashboard)/author/workspace/[id]/workspace-client'

export default async function ReviewerWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // id is manuscript_id
  const [{ data: manuscript }, { data: review }, { data: comments }, { data: messages }] = await Promise.all([
    supabase.from('manuscripts').select('*, files:manuscript_files(*), author:profiles(*)').eq('id', id).single(),
    supabase.from('reviews').select('*, reviewer:profiles(*)').eq('manuscript_id', id).eq('reviewer_id', user.id).single(),
    supabase.from('comments').select('*, author:profiles(*), replies:comment_replies(*, author:profiles(*))').eq('manuscript_id', id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*, sender:profiles(*)').eq('manuscript_id', id).order('created_at'),
  ])

  if (!manuscript || !review) redirect('/reviewer/dashboard')

  return (
    <WorkspaceClient
      manuscript={manuscript}
      initialComments={comments || []}
      initialMessages={messages || []}
      review={review}
      currentUserId={user.id}
      role="reviewer"
    />
  )
}
