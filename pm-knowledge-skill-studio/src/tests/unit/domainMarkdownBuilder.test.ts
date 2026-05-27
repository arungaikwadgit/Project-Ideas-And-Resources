import { describe, it, expect } from 'vitest'
import { buildDomainMarkdown } from '../../lib/domain/domainMarkdownBuilder'
import type { CandidateDomain } from '../../types'

const mockDomain: CandidateDomain = {
  id: 'ecommerce',
  name: 'E-commerce / Marketplace',
  category: 'Commerce',
  description: 'Online marketplace platform for buyers and sellers',
  relevanceScore: 0.9,
  source: 'curated',
  suggestedWorkflows: ['Product listing', 'Order management', 'Payment processing'],
  suggestedMetrics: ['GMV', 'Conversion rate', 'AOV'],
  suggestedRisks: ['Payment fraud', 'Inventory mismatch'],
  suggestedIntegrations: ['Stripe', 'Shopify', 'ERP'],
  suggestedCompliance: ['PCI-DSS', 'GDPR'],
  suggestedRoles: ['pm', 'po'],
  whySuggested: 'Matches query about online marketplace',
}

describe('buildDomainMarkdown', () => {
  it('generates markdown with all 12 required sections', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('# Domain Knowledge:')
    expect(result).toContain('## 1. Domain Overview')
    expect(result).toContain('## 2. Target Users')
    expect(result).toContain('## 3. Key Business Workflows')
    expect(result).toContain('## 4. Core Data Entities')
    expect(result).toContain('## 5. Business Metrics')
    expect(result).toContain('## 6. Common Risks')
    expect(result).toContain('## 7. Common Integrations')
    expect(result).toContain('## 8. Compliance / Governance Considerations')
    expect(result).toContain('## 9. Common Project Artifacts')
    expect(result).toContain('## 10. Useful Vocabulary')
    expect(result).toContain('## 11. AI Prompting Context')
    expect(result).toContain('## 12. Open Questions')
  })

  it('includes domain name in heading', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('E-commerce / Marketplace')
  })

  it('includes workflow data from domain', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('Order management')
  })

  it('includes metrics', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('GMV')
  })

  it('includes compliance items', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('PCI-DSS')
  })

  it('includes risks', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result).toContain('Payment fraud')
  })

  it('returns non-empty string of sufficient length', () => {
    const result = buildDomainMarkdown(mockDomain, ['pm'])
    expect(result.length).toBeGreaterThan(200)
  })

  it('handles empty roles array', () => {
    const result = buildDomainMarkdown(mockDomain, [])
    expect(result).toContain('# Domain Knowledge:')
  })
})
