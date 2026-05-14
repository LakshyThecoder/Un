const BASE = 'https://api.crossref.org'
const MAILTO = 'platform@uknow.io'

export interface CrossRefJournal {
  title: string
  publisher: string
  ISSN?: string[]
  'subjects'?: string[]
}

export interface CrossRefWork {
  DOI: string
  title: string[]
  author?: { given: string; family: string }[]
  'container-title'?: string[]
  published?: { 'date-parts': number[][] }
  'is-referenced-by-count'?: number
  subject?: string[]
}

export async function lookupJournal(issn: string): Promise<CrossRefJournal | null> {
  try {
    const url = `${BASE}/journals/${issn}?mailto=${MAILTO}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.message || null
  } catch {
    return null
  }
}

export async function searchJournals(query: string, limit = 10): Promise<CrossRefJournal[]> {
  try {
    const url = `${BASE}/journals?query=${encodeURIComponent(query)}&rows=${limit}&mailto=${MAILTO}`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.message?.items || []
  } catch {
    return []
  }
}

export async function lookupDOI(doi: string): Promise<CrossRefWork | null> {
  try {
    const url = `${BASE}/works/${encodeURIComponent(doi)}?mailto=${MAILTO}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.message || null
  } catch {
    return null
  }
}

export async function getJournalMetrics(journalName: string) {
  const results = await searchJournals(journalName, 3)
  return results[0] || null
}
