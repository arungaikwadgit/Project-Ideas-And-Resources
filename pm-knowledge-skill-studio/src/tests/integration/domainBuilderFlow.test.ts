import { describe, it, expect } from 'vitest'
import { buildDomainMarkdown } from '../../lib/domain/domainMarkdownBuilder'
import { buildCombinedDomainMarkdown } from '../../lib/domain/combinedDomainBuilder'
import { suggestSkillsForDomain } from '../../lib/domainSkillRules'
import { dedupeDomains } from '../../lib/domain/domainDeduper'
import { rankDomains } from '../../lib/domain/domainRanker'
import type { CandidateDomain } from '../../types'

const ecommerce: CandidateDomain = {
  id: 'ecommerce', name: 'E-commerce', category: 'Commerce',
  description: 'Online marketplace', relevanceScore: 0, source: 'curated',
  suggestedWorkflows: ['Order management', 'Product catalog'],
  suggestedMetrics: ['GMV', 'Conversion rate'],
  suggestedRisks: ['Payment fraud'],
  suggestedIntegrations: ['Stripe', 'Shopify'],
  suggestedCompliance: ['PCI-DSS'],
  suggestedRoles: ['pm'],
  whySuggested: 'Commerce domain',
}

const fintech: CandidateDomain = {
  id: 'fintech', name: 'Finance / FinTech', category: 'Financial Services',
  description: 'Financial technology', relevanceScore: 0, source: 'curated',
  suggestedWorkflows: ['Payment processing', 'KYC'],
  suggestedMetrics: ['Transaction volume'],
  suggestedRisks: ['Regulatory risk'],
  suggestedIntegrations: ['Banking APIs'],
  suggestedCompliance: ['SOX', 'AML'],
  suggestedRoles: ['pm', 'ba'],
  whySuggested: 'Finance domain',
}

describe('Domain Builder Flow', () => {
  it('builds domain markdown for single domain', () => {
    const md = buildDomainMarkdown(ecommerce, ['pm'])
    expect(md).toContain('# Domain Knowledge:')
    expect(md.length).toBeGreaterThan(200)
  })

  it('builds combined markdown for two domains', () => {
    const md = buildCombinedDomainMarkdown([ecommerce, fintech], ['pm'])
    expect(md).toContain('# Combined Domain Context:')
    expect(md).toContain('E-commerce')
    expect(md).toContain('FinTech')
  })

  it('suggests pm skills after domain selection', () => {
    const skills = suggestSkillsForDomain({
      domainKey: 'ecommerce', domainName: 'E-commerce',
      selectedRoleIds: ['pm'],
      workflows: ecommerce.suggestedWorkflows,
      risks: ecommerce.suggestedRisks,
      complianceItems: ecommerce.suggestedCompliance,
      integrations: ecommerce.suggestedIntegrations,
      selectedDomains: ['ecommerce'],
    })
    expect(skills.some(s => s.roleId === 'pm')).toBe(true)
  })

  it('deduplicates domains correctly in full flow', () => {
    const domains = [ecommerce, { ...ecommerce, id: 'ecommerce-2', source: 'web_discovered' as const }]
    const deduped = dedupeDomains(domains)
    expect(deduped.length).toBe(1)
    expect(deduped[0].source).toBe('curated')
  })

  it('ranks domains by query relevance', () => {
    const domains = [fintech, ecommerce]
    const ranked = rankDomains(domains, 'marketplace commerce', [])
    expect(ranked[0].id).toBe('ecommerce')
  })
})
