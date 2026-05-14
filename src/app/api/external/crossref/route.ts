import { NextRequest, NextResponse } from 'next/server'
import { lookupDOI, searchJournals, getJournalMetrics } from '@/lib/apis/crossref'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const doi = searchParams.get('doi')
  const journal = searchParams.get('journal')
  const q = searchParams.get('q')

  try {
    if (doi) {
      const work = await lookupDOI(doi)
      return NextResponse.json({ work })
    }
    if (journal) {
      const metrics = await getJournalMetrics(journal)
      return NextResponse.json({ metrics })
    }
    if (q) {
      const journals = await searchJournals(q, 10)
      return NextResponse.json({ journals })
    }
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 })
  } catch (err) {
    console.error('CrossRef error:', err)
    return NextResponse.json({ error: 'API error' }, { status: 500 })
  }
}
