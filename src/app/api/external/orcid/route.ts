import { NextRequest, NextResponse } from 'next/server'
import { getProfile, searchOrcid } from '@/lib/apis/orcid'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orcidId = searchParams.get('orcid')
  const query = searchParams.get('q')

  try {
    if (orcidId) {
      const profile = await getProfile(orcidId)
      return NextResponse.json({ profile })
    }
    if (query) {
      const results = await searchOrcid(query, 10)
      return NextResponse.json({ results })
    }
    return NextResponse.json({ error: 'Missing parameter' }, { status: 400 })
  } catch (err) {
    console.error('ORCID error:', err)
    return NextResponse.json({ error: 'API error' }, { status: 500 })
  }
}
