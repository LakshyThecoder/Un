import { SemanticConcept, ReviewerProfile, ReviewerMatch } from '@/types'
import { searchPapers, searchAuthors as ssSearchAuthors, batchGetAuthors, SSAuthor, SSPaper } from './semantic-scholar'
import { searchAuthors as oaSearch, OAAuthor } from './openalex'

export interface ExternalReviewer extends ReviewerProfile {
  ss_author_id?: string
  oa_author_id?: string
  semantic_scholar_url?: string
  openalex_url?: string
  google_scholar_url?: string
  orcid_url?: string
  recent_papers?: { title: string; year?: number; venue?: string; citations?: number }[]
  source: 'semantic_scholar' | 'openalex' | 'platform'
}

export interface EnrichedMatch extends ReviewerMatch {
  reviewer: ExternalReviewer
}

interface MatchingInput {
  concepts: SemanticConcept[]
  field?: string
  title?: string
  abstract?: string
  keywords?: string[]
  methodology?: string
}

export async function computeReviewerMatches(
  input: MatchingInput,
  existingReviewers?: ReviewerProfile[]
): Promise<EnrichedMatch[]> {
  const { concepts, field, title, abstract, keywords = [], methodology } = input

  const topConceptTags = concepts.slice(0, 6).map(c => c.tag)
  const allKeywords = [...new Set([...keywords, ...topConceptTags])].filter(Boolean)

  // Build three complementary search strategies for maximum recall
  const coreTerms   = allKeywords.slice(0, 5).join(' ')
  const titleQuery  = [title?.slice(0, 80), coreTerms.slice(0, 60)].filter(Boolean).join(' ').slice(0, 120)
  const authorQuery = [field, coreTerms.slice(0, 80)].filter(Boolean).join(' ').slice(0, 120)
  const fieldQuery  = [field, methodology, keywords[0]].filter(Boolean).join(' ').slice(0, 80)

  console.log('[Matching] Strategies:', { titleQuery: titleQuery.slice(0, 70), authorQuery: authorQuery.slice(0, 70), fieldQuery })

  // Run all searches in parallel — individual failures don't block others
  const [
    papersByTitle,
    papersByField,
    ssByTopic,
    ssByTitle,
    oaByTopic,
    oaByField,
  ] = await Promise.all([
    searchPapers(titleQuery, 25).catch(e => { console.warn('[Match] SS papers/title:', e); return [] as SSPaper[] }),
    searchPapers(fieldQuery,  20).catch(e => { console.warn('[Match] SS papers/field:', e); return [] as SSPaper[] }),
    ssSearchAuthors(authorQuery, 25).catch(e => { console.warn('[Match] SS authors/topic:', e); return [] as SSAuthor[] }),
    ssSearchAuthors(titleQuery,  20).catch(e => { console.warn('[Match] SS authors/title:', e); return [] as SSAuthor[] }),
    oaSearch(authorQuery, 25).catch(e => { console.warn('[Match] OA authors/topic:', e); return [] as OAAuthor[] }),
    oaSearch(fieldQuery,  15).catch(e => { console.warn('[Match] OA authors/field:', e); return [] as OAAuthor[] }),
  ])

  const allPapers    = dedup([...papersByTitle, ...papersByField], p => p.paperId)
  const allSSAuthors = dedup([...ssByTopic, ...ssByTitle], a => a.authorId)
  const allOAAuthors = dedup([...oaByTopic, ...oaByField], a => a.id || a.display_name)

  console.log(`[Matching] Raw: ${allPapers.length} papers, ${allSSAuthors.length} SS, ${allOAAuthors.length} OA`)

  // ── Build preliminary author map from papers ─────────────────────────────
  const authorMap = new Map<string, { author: SSAuthor; papers: SSPaper[] }>()

  for (const paper of allPapers) {
    for (const pa of (paper.authors || [])) {
      if (!pa.authorId) continue
      const existing = authorMap.get(pa.authorId)
      if (existing) {
        if (!existing.papers.some(p => p.paperId === paper.paperId)) existing.papers.push(paper)
      } else {
        authorMap.set(pa.authorId, {
          author: {
            authorId: pa.authorId,
            name: pa.name,
            affiliations: [],
            paperCount: 0,
            citationCount: 0,
            hIndex: 0,
          },
          papers: [paper],
        })
      }
    }
  }

  // Merge direct SS author search results
  for (const a of allSSAuthors) {
    if (!a.authorId) continue
    const existing = authorMap.get(a.authorId)
    if (existing) existing.author = { ...existing.author, ...a }
    else authorMap.set(a.authorId, { author: a, papers: [] })
  }

  // ── Enrich paper-derived authors that lack h-index / publication counts ──
  // These come only with name+authorId from paper listings — we batch-fetch full profiles.
  const needEnrichment = [...authorMap.values()]
    .filter(e => e.papers.length > 0 && e.author.hIndex === 0 && e.author.paperCount === 0)
    .map(e => e.author.authorId)
    .filter(Boolean)
    .slice(0, 60) // cap to avoid too many API calls

  if (needEnrichment.length > 0) {
    console.log(`[Matching] Enriching ${needEnrichment.length} paper authors…`)
    const enriched = await batchGetAuthors(needEnrichment)
    for (const a of enriched) {
      const existing = authorMap.get(a.authorId)
      if (existing) {
        existing.author = { ...existing.author, ...a }
        // Merge papers from the author's own profile if we got them
        if (a.papers?.length) {
          const newPapers = a.papers.filter(
            (np: SSPaper) => !existing.papers.some(ep => ep.paperId === np.paperId)
          )
          existing.papers = [...existing.papers, ...newPapers].slice(0, 10)
        }
      }
    }
    console.log(`[Matching] Enrichment complete — got full profiles for ${enriched.length} authors`)
  }

  // ── Build candidate pool ─────────────────────────────────────────────────
  const pool = buildCandidatePool(Array.from(authorMap.values()), allOAAuthors, existingReviewers || [])
  console.log(`[Matching] Pool size: ${pool.length}`)

  const scored = pool.map(r => scoreReviewer(r, concepts, field, authorMap, keywords, abstract, methodology))

  const results = scored
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 20) // return top 20

  console.log(`[Matching] Top ${results.length}, best score: ${results[0]?.match_score ?? 0}`)
  return results
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function dedup<T>(arr: T[], key: (x: T) => string | undefined): T[] {
  const seen = new Set<string>()
  return arr.filter(x => {
    const k = key(x)
    if (!k || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function buildCandidatePool(
  ssEntries: { author: SSAuthor; papers: SSPaper[] }[],
  oaAuthors: OAAuthor[],
  existing: ReviewerProfile[]
): ExternalReviewer[] {
  const pool: ExternalReviewer[] = existing.map(r => ({ ...r, source: 'platform' as const }))
  const seenNames = new Set(existing.map(r => r.full_name?.toLowerCase()))

  for (const { author: a, papers } of ssEntries) {
    if (!a.name || a.name.trim().length < 3) continue
    if (seenNames.has(a.name.toLowerCase())) continue
    seenNames.add(a.name.toLowerCase())

    const ssId    = a.authorId
    const allFields = [...new Set(papers.flatMap(p => p.fieldsOfStudy || []))]

    // Prefer papers with the most citations for "relevant papers" display
    const sortedPapers = [...papers].sort((x, y) => (y.citationCount || 0) - (x.citationCount || 0))

    pool.push({
      id: `ss_${ssId}`,
      email: '',
      full_name: a.name,
      role: 'reviewer',
      institution: a.affiliations?.[0] || '',
      field: papers[0]?.fieldsOfStudy?.[0] || allFields[0] || '',
      expertise_tags: allFields.slice(0, 8),
      semantic_scholar_id: ssId,
      verified: false,
      rating: 0,
      review_count: 0,
      acceptance_rate: 0,
      avg_turnaround_days: 5,
      total_earned: 0,
      h_index: a.hIndex || 0,
      publication_count: a.paperCount || 0,
      created_at: new Date().toISOString(),
      ss_author_id: ssId,
      semantic_scholar_url: `https://www.semanticscholar.org/author/${encodeURIComponent(a.name)}/${ssId}`,
      google_scholar_url: `https://scholar.google.com/scholar?q=author:${encodeURIComponent(a.name)}`,
      recent_papers: sortedPapers.slice(0, 5).map(p => ({
        title: p.title,
        year: p.year,
        venue: p.publicationVenue?.name,
        citations: p.citationCount,
      })),
      source: 'semantic_scholar',
    } as ExternalReviewer)
  }

  for (const a of oaAuthors) {
    if (!a.display_name) continue
    if (seenNames.has(a.display_name.toLowerCase())) continue
    seenNames.add(a.display_name.toLowerCase())

    const oaId      = a.id?.replace('https://openalex.org/', '')
    const topicNames = (a.topics || []).slice(0, 8).map((t: { display_name: string }) => t.display_name)
    const orcidClean = a.orcid ? a.orcid.replace('https://orcid.org/', '') : undefined

    pool.push({
      id: `oa_${oaId}`,
      email: '',
      full_name: a.display_name,
      role: 'reviewer',
      institution: a.affiliations?.[0]?.institution?.display_name || '',
      field: a.topics?.[0]?.display_name || '',
      expertise_tags: topicNames,
      verified: false,
      rating: 0,
      review_count: 0,
      acceptance_rate: 0,
      avg_turnaround_days: 5,
      total_earned: 0,
      h_index: a.summary_stats?.h_index || 0,
      publication_count: a.works_count || 0,
      cited_by_count: a.cited_by_count || 0,
      created_at: new Date().toISOString(),
      oa_author_id: oaId,
      openalex_url: `https://openalex.org/authors/${oaId}`,
      orcid_url: orcidClean ? `https://orcid.org/${orcidClean}` : undefined,
      google_scholar_url: `https://scholar.google.com/scholar?q=author:${encodeURIComponent(a.display_name)}`,
      source: 'openalex',
    } as ExternalReviewer)
  }

  return pool
}

function scoreReviewer(
  reviewer: ExternalReviewer,
  concepts: SemanticConcept[],
  field?: string,
  authorMap?: Map<string, { author: SSAuthor; papers: SSPaper[] }>,
  keywords: string[] = [],
  abstract?: string,
  methodology?: string
): EnrichedMatch {
  let score = 0
  const overlap: string[] = []

  // Academic standing — h-index (up to 28 pts, log scale so junior researchers still appear)
  const hIndex = reviewer.h_index || 0
  if (hIndex > 0) score += Math.min(28, Math.log2(hIndex + 1) * 7)

  // Publication breadth (up to 10 pts)
  score += Math.min(10, (reviewer.publication_count || 0) * 0.04)

  // Citation impact bonus (OA authors only — up to 8 pts)
  if ((reviewer as ExternalReviewer & { cited_by_count?: number }).cited_by_count) {
    const cbc = (reviewer as ExternalReviewer & { cited_by_count?: number }).cited_by_count || 0
    score += Math.min(8, Math.log2(cbc + 1) * 1.2)
  }

  // Expertise / topic overlap (up to 40 pts)
  const reviewerTags = [
    ...(reviewer.expertise_tags || []),
    reviewer.field || '',
  ].map(t => t.toLowerCase().trim()).filter(Boolean)

  const searchTerms = [
    ...concepts.map(c => c.tag),
    ...keywords,
    field || '',
    methodology || '',
  ].filter(Boolean)

  for (const term of searchTerms) {
    if (!term) continue
    const tl = term.toLowerCase()
    const hit = reviewerTags.some(t => t.includes(tl) || tl.includes(t) || fuzzyMatch(t, tl))
    if (hit && !overlap.includes(term)) {
      score += 5
      overlap.push(term)
    }
  }

  // Paper title relevance — strongest signal (published ON these topics)
  if (reviewer.recent_papers?.length) {
    const paperText = reviewer.recent_papers.map(p => p.title).join(' ').toLowerCase()
    const abstrText = abstract?.toLowerCase() || ''
    let paperHits = 0
    for (const term of searchTerms) {
      if (!term) continue
      const tl = term.toLowerCase()
      if ((paperText.includes(tl) || abstrText.includes(tl)) && !overlap.includes(term)) {
        score += 8
        overlap.push(term)
        paperHits++
      }
    }
    if (paperHits > 2) score += 6

    // Citation quality of matched papers
    const totalCitations = reviewer.recent_papers.reduce((s, p) => s + (p.citations || 0), 0)
    score += Math.min(12, Math.log2(totalCitations + 1) * 2)
  }

  // Platform reviewer bonus (trusted, rated user on the platform)
  if (reviewer.source === 'platform') {
    score += (reviewer.rating || 0) * 3
    score += (reviewer.review_count || 0) * 2
    score += 15
  }

  const normalized = Math.min(99, Math.max(5, Math.round(score)))

  return {
    reviewer,
    match_score: normalized,
    concept_overlap: [...new Set(overlap)].slice(0, 8),
    publications_relevant: reviewer.recent_papers?.length || 0,
    estimated_turnaround: reviewer.avg_turnaround_days || 5,
  }
}

// Fuzzy prefix match — catches singular/plural, truncated forms
function fuzzyMatch(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4) return false
  const prefix = Math.min(6, Math.min(a.length, b.length))
  return a.slice(0, prefix) === b.slice(0, prefix)
}
