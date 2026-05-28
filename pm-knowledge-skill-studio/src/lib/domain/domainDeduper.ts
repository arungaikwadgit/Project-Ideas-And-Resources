import type { CandidateDomain } from '../../types/domain'

// ---------------------------------------------------------------------------
// String similarity
// ---------------------------------------------------------------------------

/**
 * Very lightweight normalized edit-distance-free similarity based on token
 * overlap. Returns a score between 0 and 1.
 */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const tokensB = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))

  if (tokensA.size === 0 && tokensB.size === 0) return 1
  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let overlap = 0
  tokensA.forEach((token) => {
    if (tokensB.has(token)) overlap++
  })

  const union = tokensA.size + tokensB.size - overlap
  return overlap / union // Jaccard similarity
}

/**
 * Normalizes a domain name for comparison: lowercase, strip common noise words
 * (platform, software, solution, etc.), collapse whitespace.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /\b(platform|software|solution|system|tool|app|application|service|management|crm|erp)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Source priority
// ---------------------------------------------------------------------------

const SOURCE_PRIORITY: Record<CandidateDomain['source'], number> = {
  curated: 3,
  web_discovered: 2,
  custom: 1,
}

function sourcePriority(domain: CandidateDomain): number {
  return SOURCE_PRIORITY[domain.source] ?? 0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const SIMILARITY_THRESHOLD = 0.55 // Jaccard score above which two names are considered duplicates

/**
 * Deduplicates a list of CandidateDomains by name similarity.
 *
 * When two domains are considered duplicates:
 * - The one with the higher source priority (curated > web_discovered > custom) wins.
 * - On equal source priority, the one with the higher relevanceScore wins.
 */
export function dedupeDomains(domains: CandidateDomain[]): CandidateDomain[] {
  if (domains.length <= 1) return [...domains]

  // Build clusters: each cluster contains indices of similar domains
  const merged = new Set<number>()
  const representatives: CandidateDomain[] = []

  for (let i = 0; i < domains.length; i++) {
    if (merged.has(i)) continue

    const cluster: number[] = [i]

    for (let j = i + 1; j < domains.length; j++) {
      if (merged.has(j)) continue

      const nameA = normalizeName(domains[i].name)
      const nameB = normalizeName(domains[j].name)

      // Exact match after normalization
      if (nameA === nameB) {
        cluster.push(j)
        merged.add(j)
        continue
      }

      // Fuzzy similarity
      const sim = tokenSimilarity(nameA, nameB)
      if (sim >= SIMILARITY_THRESHOLD) {
        cluster.push(j)
        merged.add(j)
      }
    }

    merged.add(i)

    // Pick the best representative from the cluster
    const best = cluster
      .map((idx) => domains[idx])
      .sort((a, b) => {
        const priorityDiff = sourcePriority(b) - sourcePriority(a)
        if (priorityDiff !== 0) return priorityDiff
        return b.relevanceScore - a.relevanceScore
      })[0]

    representatives.push(best)
  }

  return representatives
}
