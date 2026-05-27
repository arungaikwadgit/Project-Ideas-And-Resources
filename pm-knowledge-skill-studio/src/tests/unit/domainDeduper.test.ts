import { describe, it, expect } from 'vitest'
import { dedupeDomains } from '../../lib/domain/domainDeduper'
import type { CandidateDomain } from '../../types'

function makeDomain(id: string, name: string, source: CandidateDomain['source'] = 'curated', score = 0.8): CandidateDomain {
  return {
    id, name, category: 'Test', description: 'Test domain',
    relevanceScore: score, source,
    suggestedWorkflows: [], suggestedMetrics: [], suggestedRisks: [],
    suggestedIntegrations: [], suggestedCompliance: [], suggestedRoles: [],
    whySuggested: 'Test',
  }
}

describe('dedupeDomains', () => {
  it('removes exact duplicate domain names', () => {
    const domains = [makeDomain('a', 'E-commerce'), makeDomain('b', 'E-commerce')]
    const result = dedupeDomains(domains)
    expect(result.length).toBe(1)
  })

  it('prefers curated over web_discovered', () => {
    const domains = [
      makeDomain('a', 'E-commerce', 'web_discovered', 0.9),
      makeDomain('b', 'E-commerce', 'curated', 0.7),
    ]
    const result = dedupeDomains(domains)
    expect(result.length).toBe(1)
    expect(result[0].source).toBe('curated')
  })

  it('keeps unique domains', () => {
    const domains = [makeDomain('a', 'E-commerce'), makeDomain('b', 'Healthcare')]
    const result = dedupeDomains(domains)
    expect(result.length).toBe(2)
  })

  it('handles empty array', () => {
    expect(dedupeDomains([])).toEqual([])
  })

  it('handles single domain', () => {
    const domains = [makeDomain('a', 'E-commerce')]
    expect(dedupeDomains(domains).length).toBe(1)
  })

  it('is case-insensitive when deduplicating', () => {
    const domains = [makeDomain('a', 'e-commerce'), makeDomain('b', 'E-Commerce')]
    const result = dedupeDomains(domains)
    expect(result.length).toBe(1)
  })
})
