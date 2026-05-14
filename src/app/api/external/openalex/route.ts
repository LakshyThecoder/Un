import { NextRequest, NextResponse } from 'next/server'
import { extractConceptsFromText } from '@/lib/apis/openalex'
import { extractConceptsWithMistral } from '@/lib/apis/mistral'
import { SemanticConcept } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { text, field, title, abstract } = await req.json()
    if (!text && !title) return NextResponse.json({ concepts: [] })

    // Try Mistral first (higher quality), fall back to OpenAlex
    let mistralConcepts: SemanticConcept[] = []
    if (process.env.MISTRAL_API_KEY) {
      mistralConcepts = await extractConceptsWithMistral(title || '', abstract || text || '', field)
    }

    if (mistralConcepts.length >= 8) {
      return NextResponse.json({ concepts: mistralConcepts })
    }

    // Fall back to OpenAlex
    const rawConcepts = await extractConceptsFromText(text || `${title} ${abstract}`)
    const fieldConcepts = getFieldConcepts(field)
    const mapped: SemanticConcept[] = rawConcepts.map(c => ({
      tag: c.display_name,
      confidence: c.score,
      category: c.level <= 1 ? 'core' : c.level === 2 ? 'method' : 'domain',
      openalex_id: c.id,
    }))
    const all: SemanticConcept[] = [...mistralConcepts, ...mapped, ...fieldConcepts]

    // Deduplicate and limit
    const seen = new Set<string>()
    const unique: SemanticConcept[] = []
    for (const c of all) {
      const key = c.tag.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(c)
      }
    }

    return NextResponse.json({ concepts: unique.slice(0, 14) })
  } catch (err) {
    console.error('OpenAlex API error:', err)
    return NextResponse.json({ concepts: [] })
  }
}

function getFieldConcepts(field?: string): SemanticConcept[] {
  const fieldMap: Record<string, SemanticConcept[]> = {
    Scientometrics: [
      { tag: 'peer review', confidence: 0.96, category: 'core' },
      { tag: 'bibliometrics', confidence: 0.90, category: 'method' },
      { tag: 'open access', confidence: 0.88, category: 'domain' },
    ],
    Biology: [
      { tag: 'cell biology', confidence: 0.91, category: 'core' },
      { tag: 'molecular biology', confidence: 0.88, category: 'domain' },
    ],
    Medicine: [
      { tag: 'clinical trial', confidence: 0.94, category: 'core' },
      { tag: 'randomized controlled trial', confidence: 0.91, category: 'method' },
    ],
    'Computer Science': [
      { tag: 'machine learning', confidence: 0.93, category: 'core' },
      { tag: 'deep learning', confidence: 0.89, category: 'method' },
    ],
  }
  return field ? (fieldMap[field] || []) : []
}
