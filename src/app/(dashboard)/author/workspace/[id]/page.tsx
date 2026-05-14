import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceClient } from './workspace-client'

export default async function AuthorWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: manuscript }, { data: comments }, { data: messages }, { data: review }] = await Promise.all([
    supabase
      .from('manuscripts')
      .select('*, files:manuscript_files(*)')
      .eq('id', id)
      .eq('author_id', user.id)
      .single(),
    supabase
      .from('comments')
      .select('*, author:profiles(*), replies:comment_replies(*, author:profiles(*))')
      .eq('manuscript_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('manuscript_id', id)
      .order('created_at'),
    supabase
      .from('reviews')
      .select('*, reviewer:profiles(*)')
      .eq('manuscript_id', id)
      .single(),
  ])

  if (!manuscript) redirect('/author/dashboard')

  return (
    <WorkspaceClient
      manuscript={manuscript}
      initialComments={comments || []}
      initialMessages={messages || []}
      review={review}
      currentUserId={user.id}
      role="author"
    />
  )
}
