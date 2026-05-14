import { NextRequest, NextResponse } from 'next/server'
import { computeReviewerMatches } from '@/lib/apis/matching'
import { createClient } from '@/lib/supabase/server'
import { SemanticConcept } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { concepts, field, title, abstract, keywords, methodology, manuscriptId } = await req.json()
    if (!concepts || !Array.isArray(concepts)) {
      return NextResponse.json({ matches: [] })
    }

    // Fetch any registered reviewers on platform too
    const supabase = await createClient()
    const { data: dbReviewers } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'reviewer')
      .eq('verified', true)
      .limit(20)

    const matches = await computeReviewerMatches(
      {
        concepts: concepts as SemanticConcept[],
        field,
        title,
        abstract,
        keywords: keywords || [],
        methodology,
      },
      dbReviewers || []
    )

    // Update manuscript with concepts if provided
    if (manuscriptId && concepts.length > 0) {
      await supabase
        .from('manuscripts')
        .update({ semantic_concepts: concepts, status: 'matching', progress: 20 })
        .eq('id', manuscriptId)
    }

    return NextResponse.json({ matches })
  } catch (err) {
    console.error('Matching error:', err)
    return NextResponse.json({ matches: [], error: 'Matching failed' }, { status: 500 })
  }
}
