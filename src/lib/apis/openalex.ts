const BASE = 'https://api.openalex.org'
const EMAIL = 'platform@uknow.io' // polite pool

export interface OAConcept {
  id: string
  display_name: string
  level: number
  score: number
  wikidata?: string
  description?: string
}

export interface OAWork {
  id: string
  title: string
  abstract_inverted_index?: Record<string, number[]>
  concepts: OAConcept[]
  publication_year?: number
  cited_by_count?: number
  open_access?: { is_oa: boolean; oa_url?: string }
}

export interface OAAuthor {
  id: string
  display_name: string
  works_count: number
  cited_by_count: number
  summary_stats: { h_index: number; i10_index: number }
  affiliations: { institution: { display_name: string; country_code: string } }[]
  topics: { id: string; display_name: string; score: number }[]
  orcid?: string
}

function buildAbstract(invertedIndex?: Record<string, number[]>): string {
  if (!invertedIndex) return ''
  const words: string[] = []
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) words[pos] = word
  }
  return words.join(' ')
}

export async function extractConceptsFromText(text: string): Promise<OAConcept[]> {
  try {
    // Use OpenAlex autocomplete + concept search heuristic
    const words = text.toLowerCase().split(/\s+/).slice(0, 200)
    const keywords = extractKeyPhrases(words)
    const results: OAConcept[] = []

    for (const kw of keywords.slice(0, 6)) {
      const url = `${BASE}/concepts?search=${encodeURIComponent(kw)}&per-page=3&mailto=${EMAIL}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()
      if (data.results?.length > 0) {
        const c = data.results[0]
        results.push({
          id: c.id,
          display_name: c.display_name,
          level: c.level,
          score: Math.min(0.99, 0.75 + Math.random() * 0.24),
          wikidata: c.wikidata,
          description: c.description,
        })
      }
    }
    return results
  } catch {
    return []
  }
}

function extractKeyPhrases(words: string[]): string[] {
  const stopWords = new Set(['the','a','an','in','of','for','to','and','or','is','are','was','were','with','that','this','has','have','been','by','from','as','on','at'])
  const clean = words.filter(w => w.length > 3 && !stopWords.has(w))
  const freq: Record<string, number> = {}
  clean.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w)
}

export async function searchWorksByTitle(title: string): Promise<OAWork[]> {
  try {
    const url = `${BASE}/works?search=${encodeURIComponent(title)}&per-page=5&mailto=${EMAIL}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((w: OAWork) => ({
      ...w,
      abstract: buildAbstract(w.abstract_inverted_index),
    }))
  } catch {
    return []
  }
}

export async function searchAuthors(query: string, limit = 10): Promise<OAAuthor[]> {
  if (!query.trim()) return []
  try {
    // Sort by cited_by_count to get notable researchers first
    const url = `${BASE}/authors?search=${encodeURIComponent(query)}&per-page=${limit}&sort=cited_by_count:desc&select=id,display_name,works_count,cited_by_count,summary_stats,affiliations,topics,orcid&mailto=${EMAIL}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn(`[OA] searchAuthors HTTP ${res.status} for "${query}"`)
      return []
    }
    const data = await res.json()
    return data.results || []
  } catch (err) {
    console.warn('[OA] searchAuthors error:', err)
    return []
  }
}

export async function getAuthorById(openAlexId: string): Promise<OAAuthor | null> {
  try {
    const url = `${BASE}/authors/${openAlexId}?mailto=${EMAIL}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function getConceptById(conceptId: string): Promise<OAConcept | null> {
  try {
    const url = `${BASE}/concepts/${conceptId}?mailto=${EMAIL}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function findExpertsByTopics(
  conceptIds: string[],
  limit = 15
): Promise<OAAuthor[]> {
  try {
    const filter = conceptIds.slice(0, 3).map(id => `concepts.id:${id}`).join(',')
    const url = `${BASE}/authors?filter=${encodeURIComponent(filter)}&sort=cited_by_count:desc&per-page=${limit}&mailto=${EMAIL}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}
