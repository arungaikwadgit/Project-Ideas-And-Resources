import { describe, it, expect } from 'vitest'
import { rankDomains } from '../../lib/domain/domainRanker'
import type { CandidateDomain } from '../../types'

function makeDomain(id: string, name: string, source: CandidateDomain['source'] = 'curated'): CandidateDomain {
  return {
    id, name, category: 'Test', description: `Description for ${name}`,
    relevanceScore: 0, source,
    suggestedWorkflows: [], suggestedMetrics: [], suggestedRisks: [],
    suggestedIntegrations: [], suggestedCompliance: [], suggestedRoles: [],
    whySuggested: '',
  }
}

describe('rankDomains', () => {
  it('returns sorted array by relevance score', () => {
    const domains = [
      { ...makeDomain('a', 'Healthcare'), relevanceScore: 0.3 },
      { ...makeDomain('b', 'E-commerce'), relevanceScore: 0.8 },
    ]
    const result = rankDomains(domains, 'commerce', [])
    expect(result[0].relevanceScore).toBeGreaterThanOrEqual(result[1].relevanceScore)
  })

  it('boosts domains matching query keyword', () => {
    const domains = [makeDomain('a', 'Healthcare'), makeDomain('b', 'E-commerce Marketplace')]
    const result = rankDomains(domains, 'commerce', [])
    const ecommerceRank = result.findIndex(d => d.id === 'b')
    const healthcareRank = result.findIndex(d => d.id === 'a')
    expect(ecommerceRank).toBeLessThan(healthcareRank)
  })

  it('handles empty array', () => {
    expect(rankDomains([], 'test', [])).toEqual([])
  })

  it('handles single domain', () => {
    const domains = [makeDomain('a', 'Healthcare')]
    const result = rankDomains(domains, 'health', [])
    expect(result.length).toBe(1)
  })
})
