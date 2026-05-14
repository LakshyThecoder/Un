const BASE = 'https://pub.orcid.org/v3.0'

export interface OrcidProfile {
  orcid: string
  name: string
  biography?: string
  employments: {
    organization: string
    role?: string
    start_year?: number
  }[]
  works_count: number
}

export async function getProfile(orcidId: string): Promise<OrcidProfile | null> {
  try {
    const clean = orcidId.replace('https://orcid.org/', '')
    const res = await fetch(`${BASE}/${clean}/record`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const person = data.person
    const name = [
      person?.name?.['given-names']?.value,
      person?.name?.['family-name']?.value,
    ].filter(Boolean).join(' ')

    const employments = (
      data['activities-summary']?.employments?.['affiliation-group'] || []
    ).map((g: Record<string, unknown>) => {
      const s = (g.summaries as Record<string, unknown>[])?.[0]?.['employment-summary'] as Record<string, unknown>
      return {
        organization: (s?.organization as Record<string, unknown>)?.name as string || '',
        role: s?.['role-title'] as string | undefined,
        start_year: ((s?.['start-date'] as Record<string, unknown>)?.year as Record<string, unknown>)?.value as number | undefined,
      }
    })

    const works = data['activities-summary']?.works?.group?.length || 0

    return { orcid: clean, name, biography: person?.biography?.content, employments, works_count: works }
  } catch {
    return null
  }
}

export async function searchOrcid(query: string, limit = 10): Promise<OrcidProfile[]> {
  try {
    const res = await fetch(
      `${BASE}/search/?q=${encodeURIComponent(query)}&rows=${limit}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.result || []).map((r: Record<string, unknown>) => ({
      orcid: (r['orcid-identifier'] as Record<string, string>)?.path || '',
      name: '',
      employments: [],
      works_count: 0,
    }))
  } catch {
    return []
  }
}
