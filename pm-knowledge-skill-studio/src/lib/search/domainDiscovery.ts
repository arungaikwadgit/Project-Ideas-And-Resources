import type { SearchProviderSettings, NormalizedSearchResult } from '../../types'
import type { CandidateDomain } from '../../types/domain'
import type { SearchProvider } from './providers/searchProvider'
import { v4 as uuid } from 'uuid'

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

interface DomainSearchInput {
  businessArea?: string
  productIdea?: string
  targetUsers?: string
  keywords?: string[]
}

/**
 * Builds a list of safe, PII-free search queries from structured input.
 * Each query targets a different angle: market landscape, user workflows,
 * technology stack, and industry standards.
 */
export function buildDomainSearchQueries(input: DomainSearchInput): string[] {
  const queries: string[] = []

  const parts: string[] = []
  if (input.businessArea) parts.push(input.businessArea.trim())
  if (input.productIdea) parts.push(input.productIdea.trim())
  if (input.targetUsers) parts.push(input.targetUsers.trim())
  const keywordStr = input.keywords?.filter(Boolean).join(' ') ?? ''

  if (parts.length === 0 && keywordStr.length === 0) {
    return []
  }

  const basePhrase = parts.join(' ')

  // 1. Domain landscape overview
  if (basePhrase) {
    queries.push(`${basePhrase} industry domain overview business processes`)
  }

  // 2. User workflows
  if (input.targetUsers && (input.businessArea || input.productIdea)) {
    const area = input.businessArea || input.productIdea || ''
    queries.push(`${input.targetUsers} workflows ${area} software product management`)
  }

  // 3. Common integrations / tools in this space
  if (basePhrase) {
    queries.push(`${basePhrase} common software integrations tools platforms`)
  }

  // 4. Compliance and regulations
  if (input.businessArea) {
    queries.push(`${input.businessArea} compliance regulations governance requirements`)
  }

  // 5. Keyword-focused query
  if (keywordStr) {
    const keyQuery = input.businessArea
      ? `${input.businessArea} ${keywordStr} product requirements`
      : `${keywordStr} business domain product management`
    queries.push(keyQuery)
  }

  // Deduplicate
  return [...new Set(queries)].slice(0, 5)
}

// ---------------------------------------------------------------------------
// Domain candidate normalization
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function extractDomainNameFromResult(result: NormalizedSearchResult): string {
  // Use the title, cleaned up
  const title = result.title
    .replace(/\s*[-|:]\s*.+$/, '') // strip " - site name" suffixes
    .replace(/\s*(overview|guide|tutorial|introduction|explained|what is)\s*/gi, ' ')
    .trim()
  return title.length > 3 ? title : result.title
}

function buildWhySuggested(result: NormalizedSearchResult, query: string): string {
  const snippet = result.snippet.slice(0, 120)
  return snippet
    ? `Found via search for "${query}": ${snippet}…`
    : `Discovered via web search for "${query}".`
}

/**
 * Normalizes a set of search results into CandidateDomain objects.
 */
function normalizeResultsToCandidates(
  results: NormalizedSearchResult[],
  query: string,
): CandidateDomain[] {
  return results.map((r): CandidateDomain => {
    const name = extractDomainNameFromResult(r)
    return {
      id: uuid(),
      name,
      category: 'Discovered',
      description: r.snippet || `Domain discovered via web search: ${name}`,
      relevanceScore: r.relevanceScore,
      source: 'web_discovered',
      sourceLinks: r.url ? [r.url] : [],
      suggestedWorkflows: [],
      suggestedMetrics: [],
      suggestedRisks: [],
      suggestedIntegrations: [],
      suggestedCompliance: [],
      suggestedRoles: [],
      whySuggested: buildWhySuggested(r, query),
    }
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Executes a single domain-focused search query using the provided provider
 * and returns a list of CandidateDomain objects.
 */
export async function discoverDomainsFromSearch(
  query: string,
  provider: SearchProvider,
  settings: SearchProviderSettings,
): Promise<CandidateDomain[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const sanitizedQuery = query.trim().slice(0, 500)

  const results = await provider.search(sanitizedQuery, settings)

  if (!results || results.length === 0) {
    return []
  }

  // Only use reasonably relevant results
  const relevant = results.filter((r) => r.relevanceScore >= 0.1)

  return normalizeResultsToCandidates(relevant, sanitizedQuery)
}
