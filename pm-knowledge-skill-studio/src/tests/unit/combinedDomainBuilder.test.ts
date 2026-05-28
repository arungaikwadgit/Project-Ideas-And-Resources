import { describe, it, expect } from 'vitest'
import { buildCombinedDomainMarkdown } from '../../lib/domain/combinedDomainBuilder'
import type { CandidateDomain } from '../../types'

const mockDomainA: CandidateDomain = {
  id: 'ecommerce', name: 'E-commerce', category: 'Commerce',
  description: 'Online marketplace', relevanceScore: 0.9, source: 'curated',
  suggestedWorkflows: ['Order management'], suggestedMetrics: ['GMV'],
  suggestedRisks: ['Fraud'], suggestedIntegrations: ['Stripe'],
  suggestedCompliance: ['PCI-DSS'], suggestedRoles: ['pm'], whySuggested: 'test',
}

const mockDomainB: CandidateDomain = {
  id: 'fintech', name: 'Finance / FinTech', category: 'Financial Services',
  description: 'Financial technology platform', relevanceScore: 0.8, source: 'curated',
  suggestedWorkflows: ['Payment processing'], suggestedMetrics: ['Transaction volume'],
  suggestedRisks: ['Regulatory risk'], suggestedIntegrations: ['Banking APIs'],
  suggestedCompliance: ['SOX', 'AML'], suggestedRoles: ['pm', 'ba'], whySuggested: 'test',
}

describe('buildCombinedDomainMarkdown', () => {
  it('generates combined markdown with all 11 required sections', () => {
    const result = buildCombinedDomainMarkdown([mockDomainA, mockDomainB], ['pm'])
    expect(result).toContain('# Combined Domain Context:')
    expect(result).toContain('## 1. Selected Domains')
    expect(result).toContain('## 2. Why These Domains Are Related')
    expect(result).toContain('## 3. Shared Business Workflows')
    expect(result).toContain('## 4. Cross-Domain Data Entities')
    expect(result).toContain('## 5. Shared Metrics')
    expect(result).toContain('## 6. Cross-Domain Risks')
    expect(result).toContain('## 7. Cross-Domain Integrations')
    expect(result).toContain('## 8. Cross-Domain Compliance / Governance')
    expect(result).toContain('## 9. Persona-Specific Implications')
    expect(result).toContain('## 10. AI Prompting Context')
    expect(result).toContain('## 11. Open Questions')
  })

  it('includes both domain names in header', () => {
    const result = buildCombinedDomainMarkdown([mockDomainA, mockDomainB], ['pm'])
    expect(result).toContain('E-commerce')
    expect(result).toContain('FinTech')
  })

  it('returns non-empty string', () => {
    const result = buildCombinedDomainMarkdown([mockDomainA, mockDomainB], ['pm'])
    expect(result.length).toBeGreaterThan(300)
  })

  it('handles single domain', () => {
    const result = buildCombinedDomainMarkdown([mockDomainA], ['pm'])
    expect(result).toContain('# Combined Domain Context:')
  })
})
