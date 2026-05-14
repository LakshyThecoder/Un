import { SemanticConcept } from '@/types'

const BASE = 'https://api.mistral.ai/v1'
const API_KEY = process.env.MISTRAL_API_KEY

export async function extractConceptsWithMistral(
  title: string,
  abstract: string,
  field?: string
): Promise<SemanticConcept[]> {
  if (!API_KEY) return []

  const prompt = `You are a scientific metadata expert. Extract the most important academic concepts from this manuscript.

Title: ${title}
${abstract ? `Abstract: ${abstract}` : ''}
${field ? `Field: ${field}` : ''}

Return a JSON array of exactly 10-14 concepts in this format:
[
  {"tag": "concept name", "confidence": 0.95, "category": "core"},
  ...
]

Categories must be one of: "core" (main topics), "method" (research methods/design), "data" (data sources/datasets), "variable" (measured variables), "domain" (broader domain).
Confidence must be between 0.70 and 0.99.
Tags should be 1-4 words, lowercase.
Return only valid JSON, no explanation.`

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return []
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || ''

    // Parse the response
    let parsed: SemanticConcept[]
    try {
      const raw = JSON.parse(text)
      parsed = Array.isArray(raw) ? raw : (raw.concepts || raw.data || [])
    } catch {
      // Try extracting JSON array from text
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return []
      parsed = JSON.parse(match[0])
    }

    return parsed
      .filter((c: SemanticConcept) => c.tag && c.confidence && c.category)
      .slice(0, 14)
  } catch (err) {
    console.error('Mistral extraction error:', err)
    return []
  }
}

export async function computeReviewerMatchScoreWithMistral(
  manuscriptSummary: string,
  reviewerBio: string,
  reviewerTags: string[]
): Promise<number> {
  if (!API_KEY) return 0

  const prompt = `Rate the match between this manuscript and reviewer on a scale of 0-100.

Manuscript: ${manuscriptSummary.slice(0, 300)}
Reviewer expertise: ${reviewerBio} | Tags: ${reviewerTags.join(', ')}

Return only a JSON object: {"score": <number 0-100>}`

  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 50,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return 0
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content || '{}'
    const parsed = JSON.parse(text)
    return Math.min(100, Math.max(0, parsed.score || 0))
  } catch {
    return 0
  }
}
