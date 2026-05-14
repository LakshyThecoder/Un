import { NextRequest, NextResponse } from 'next/server'
import { searchAuthors, searchPapers, getAuthor } from '@/lib/apis/semantic-scholar'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const query = searchParams.get('q') || ''
  const authorId = searchParams.get('authorId')

  try {
    if (action === 'author' && authorId) {
      const author = await getAuthor(authorId)
      return NextResponse.json({ author })
    }
    if (action === 'authors') {
      const authors = await searchAuthors(query, 10)
      return NextResponse.json({ authors })
    }
    if (action === 'papers') {
      const papers = await searchPapers(query, 5)
      return NextResponse.json({ papers })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('Semantic Scholar error:', err)
    return NextResponse.json({ error: 'API error' }, { status: 500 })
  }
}
