import type { CandidateDomain } from '../../types/domain'

// ---------------------------------------------------------------------------
// Scoring weights
// ---------------------------------------------------------------------------

const WEIGHT_KEYWORD_NAME = 0.35
const WEIGHT_KEYWORD_DESC = 0.20
const WEIGHT_ROLE_ALIGNMENT = 0.20
const WEIGHT_WORKFLOW_RELEVANCE = 0.10
const WEIGHT_RISK_RELEVANCE = 0.05
const WEIGHT_SOURCE_BOOST = 0.10

const SOURCE_BOOST: Record<CandidateDomain['source'], number> = {
  curated: 1.0,
  web_discovered: 0.7,
  custom: 0.85,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2)
}

function tokenOverlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0
  const targetSet = new Set(targetTokens)
  const matches = queryTokens.filter((t) => targetSet.has(t)).length
  return matches / queryTokens.length
}

/**
 * Scores how well the domain's suggestedRoles align with the selected roles.
 */
function roleAlignmentScore(domain: CandidateDomain, selectedRoleIds: string[]): number {
  if (selectedRoleIds.length === 0 || domain.suggestedRoles.length === 0) return 0

  const domainRolesLower = domain.suggestedRoles.map((r) => r.toLowerCase())
  const selectedLower = selectedRoleIds.map((r) => r.toLowerCase())

  const matches = selectedLower.filter((roleId) =>
    domainRolesLower.some(
      (dr) => dr === roleId || dr.includes(roleId) || roleId.includes(dr),
    ),
  ).length

  return matches / selectedRoleIds.length
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scores and sorts CandidateDomains by relevance to the given query and roles.
 *
 * Scoring factors:
 *   - keyword match in domain name  (35 %)
 *   - keyword match in description  (20 %)
 *   - role alignment                (20 %)
 *   - workflow keyword relevance    (10 %)
 *   - risk keyword relevance        ( 5 %)
 *   - source quality boost          (10 %)
 *
 * Curated domains receive a slight boost over web-discovered ones.
 */
export function rankDomains(
  domains: CandidateDomain[],
  query: string,
  selectedRoleIds: string[],
): CandidateDomain[] {
  if (domains.length === 0) return []

  const queryTokens = tokenize(query)

  const scored = domains.map((domain) => {
    const nameTokens = tokenize(domain.name)
    const descTokens = tokenize(domain.description)
    const workflowTokens = tokenize(domain.suggestedWorkflows.join(' '))
    const riskTokens = tokenize(domain.suggestedRisks.join(' '))

    const keywordNameScore = tokenOverlapScore(queryTokens, nameTokens)
    const keywordDescScore = tokenOverlapScore(queryTokens, descTokens)
    const roleScore = roleAlignmentScore(domain, selectedRoleIds)
    const workflowScore = tokenOverlapScore(queryTokens, workflowTokens)
    const riskScore = tokenOverlapScore(queryTokens, riskTokens)
    const sourceBoost = SOURCE_BOOST[domain.source] ?? 0.5

    const compositeScore =
      WEIGHT_KEYWORD_NAME * keywordNameScore +
      WEIGHT_KEYWORD_DESC * keywordDescScore +
      WEIGHT_ROLE_ALIGNMENT * roleScore +
      WEIGHT_WORKFLOW_RELEVANCE * workflowScore +
      WEIGHT_RISK_RELEVANCE * riskScore +
      WEIGHT_SOURCE_BOOST * sourceBoost

    // Blend computed score with the domain's own relevanceScore (provider-assigned)
    const blended = 0.6 * compositeScore + 0.4 * domain.relevanceScore

    return { domain, score: blended }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored.map(({ domain, score }) => ({
    ...domain,
    relevanceScore: Math.min(1, Math.max(0, score)),
  }))
}
