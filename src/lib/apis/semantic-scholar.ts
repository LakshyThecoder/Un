const BASE = 'https://api.semanticscholar.org/graph/v1'
const HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  ...(process.env.SEMANTIC_SCHOLAR_API_KEY
    ? { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY }
    : {}),
}

export interface SSAuthor {
  authorId: string
  name: string
  affiliations: string[]
  homepage?: string
  paperCount: number
  citationCount: number
  hIndex: number
  papers?: SSPaper[]
}

export interface SSPaper {
  paperId: string
  title: string
  abstract?: string
  year?: number
  authors: { authorId: string; name: string }[]
  fieldsOfStudy?: string[]
  citationCount?: number
  publicationVenue?: { name: string }
}

async function ssFetch(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { headers: HEADERS, cache: 'no-store', signal: controller.signal })
    clearTimeout(timer)
    return res
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export async function searchAuthors(query: string, limit = 10): Promise<SSAuthor[]> {
  if (!query.trim()) return []
  try {
    const url = `${BASE}/author/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=name,affiliations,homepage,paperCount,citationCount,hIndex`
    const res = await ssFetch(url)
    if (!res.ok) {
      console.warn(`[SS] searchAuthors HTTP ${res.status} for "${query}"`)
      return []
    }
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.warn('[SS] searchAuthors error:', err)
    return []
  }
}

export async function getAuthor(authorId: string): Promise<SSAuthor | null> {
  try {
    const url = `${BASE}/author/${authorId}?fields=name,affiliations,homepage,paperCount,citationCount,hIndex,papers.title,papers.year,papers.fieldsOfStudy`
    const res = await ssFetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function searchPapers(query: string, limit = 10): Promise<SSPaper[]> {
  if (!query.trim()) return []
  try {
    const url = `${BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,abstract,year,authors,fieldsOfStudy,citationCount,publicationVenue`
    const res = await ssFetch(url)
    if (!res.ok) {
      console.warn(`[SS] searchPapers HTTP ${res.status} for "${query}"`)
      return []
    }
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.warn('[SS] searchPapers error:', err)
    return []
  }
}

export async function findReviewersByField(
  concepts: string[],
  limit = 20
): Promise<SSAuthor[]> {
  const query = concepts.slice(0, 4).join(' ')
  const authors = await searchAuthors(query, limit)
  return authors.filter(a => a.hIndex > 5 && a.paperCount > 10)
}

/**
 * Batch-fetch full author profiles for a list of authorIds.
 * Uses SS /author/batch endpoint to minimise round-trips (max 500 ids per call).
 * Falls back to individual fetches if the batch endpoint fails.
 */
export async function batchGetAuthors(authorIds: string[]): Promise<SSAuthor[]> {
  if (!authorIds.length) return []

  // SS batch endpoint
  const ids = [...new Set(authorIds)].slice(0, 100)
  const fields = 'name,affiliations,homepage,paperCount,citationCount,hIndex,papers.title,papers.year,papers.fieldsOfStudy,papers.citationCount,papers.publicationVenue'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    const res = await fetch(
      `${BASE}/author/batch?fields=${fields}`,
      {
        method: 'POST',
        headers: { ...HEADERS as Record<string, string>, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
        cache: 'no-store',
        signal: controller.signal,
      }
    )
    clearTimeout(timer)
    if (res.ok) {
      const data: (SSAuthor | null)[] = await res.json()
      return data.filter((a): a is SSAuthor => a !== null && !!a.name)
    }
    console.warn('[SS] batchGetAuthors HTTP', res.status)
  } catch (err) {
    console.warn('[SS] batchGetAuthors error:', err)
  }

  // Fallback: individual fetches in parallel (limited to avoid rate-limiting)
  const results = await Promise.allSettled(ids.slice(0, 20).map(id => getAuthor(id)))
  return results
    .filter((r): r is PromiseFulfilledResult<SSAuthor> => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value)
}
