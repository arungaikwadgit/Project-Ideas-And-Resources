import type { CandidateDomain, DomainCatalogItem } from '../../types/domain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listOrPlaceholder(items: string[], placeholder: string): string {
  const unique = [...new Set(items.filter(Boolean))]
  if (unique.length === 0) return `_${placeholder}_`
  return unique.map((item) => `- ${item}`).join('\n')
}

function isCatalogItem(domain: CandidateDomain | DomainCatalogItem): domain is DomainCatalogItem {
  return domain.source === 'curated' && 'commonUsers' in domain
}

function getWorkflows(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.commonWorkflows
  return domain.suggestedWorkflows
}

function getMetrics(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.commonMetrics
  return domain.suggestedMetrics
}

function getRisks(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.commonRisks
  return domain.suggestedRisks
}

function getIntegrations(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.commonIntegrations
  return domain.suggestedIntegrations
}

function getCompliance(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.complianceConsiderations
  return domain.suggestedCompliance
}

function getTargetUsers(domain: CandidateDomain | DomainCatalogItem): string[] {
  if (isCatalogItem(domain)) return domain.commonUsers
  return domain.suggestedRoles
}

function deduplicateList(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const key = item.trim().toLowerCase()
    if (key && !seen.has(key)) {
      seen.add(key)
      result.push(item.trim())
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildSelectedDomains(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const rows = domains
    .map((d) => `| **${d.name}** | ${d.category} | ${d.description.slice(0, 100)}${d.description.length > 100 ? '…' : ''} |`)
    .join('\n')

  return [
    '## 1. Selected Domains',
    '',
    '| Domain | Category | Description |',
    '|--------|----------|-------------|',
    rows,
  ].join('\n')
}

function buildRelatedExplanation(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const names = domains.map((d) => d.name).join(', ')
  return [
    '## 2. Why These Domains Are Related',
    '',
    `_The following domains — ${names} — have been combined because they share common workflows, user personas, or technology touchpoints._`,
    '',
    '- [ ] _Describe how these domains intersect in your specific product context_',
    '- [ ] _Note any dependencies or data flows between domains_',
  ].join('\n')
}

function buildSharedWorkflows(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const allWorkflows = deduplicateList(domains.flatMap(getWorkflows))
  return [
    '## 3. Shared Business Workflows',
    '',
    listOrPlaceholder(allWorkflows, 'No shared workflows identified — add cross-domain process flows here.'),
  ].join('\n')
}

function buildCrossDataEntities(): string {
  return [
    '## 4. Cross-Domain Data Entities',
    '',
    '_List the data entities that appear in multiple domains and need consistent definitions._',
    '',
    '| Entity | Appears In | Notes |',
    '|--------|------------|-------|',
    '| _Entity name_ | _Domain A, Domain B_ | _How this entity is shared or differs_ |',
  ].join('\n')
}

function buildSharedMetrics(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const allMetrics = deduplicateList(domains.flatMap(getMetrics))
  return [
    '## 5. Shared Metrics',
    '',
    listOrPlaceholder(allMetrics, 'No shared metrics identified — add cross-domain KPIs and measures here.'),
  ].join('\n')
}

function buildCrossRisks(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const allRisks = deduplicateList(domains.flatMap(getRisks))
  return [
    '## 6. Cross-Domain Risks',
    '',
    listOrPlaceholder(allRisks, 'No cross-domain risks identified — document shared risks and failure modes here.'),
  ].join('\n')
}

function buildCrossIntegrations(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const allIntegrations = deduplicateList(domains.flatMap(getIntegrations))
  return [
    '## 7. Cross-Domain Integrations',
    '',
    listOrPlaceholder(allIntegrations, 'No cross-domain integrations identified — list shared tools and platforms here.'),
  ].join('\n')
}

function buildCrossCompliance(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const allCompliance = deduplicateList(domains.flatMap(getCompliance))
  return [
    '## 8. Cross-Domain Compliance / Governance',
    '',
    listOrPlaceholder(allCompliance, 'No cross-domain compliance items identified — add shared regulatory requirements here.'),
  ].join('\n')
}

function buildPersonaImplications(
  domains: Array<CandidateDomain | DomainCatalogItem>,
  selectedRoles: string[],
): string {
  const allUsers = deduplicateList(domains.flatMap(getTargetUsers))
  const roles = deduplicateList([...allUsers, ...selectedRoles])

  const lines: string[] = [
    '## 9. Persona-Specific Implications',
    '',
    '_How does combining these domains affect different stakeholders?_',
    '',
  ]

  roles.slice(0, 6).forEach((role) => {
    lines.push(`### ${role}`)
    lines.push('')
    lines.push('_Add implications for this persona when working across the combined domains._')
    lines.push('')
  })

  if (roles.length === 0) {
    lines.push('_Add your stakeholder personas and their cross-domain implications here._')
  }

  return lines.join('\n')
}

function buildCombinedPromptContext(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const contextParts = domains.map((d) => {
    const ctx = isCatalogItem(d) ? d.starterPromptContext : d.whySuggested
    return `**${d.name}:** ${ctx}`
  })

  return [
    '## 10. AI Prompting Context',
    '',
    '_This combined context is injected into AI prompts that span multiple domains._',
    '',
    ...contextParts,
    '',
    '_When prompting with this combined context, specify which domain is primary for the current task._',
  ].join('\n')
}

function buildOpenQuestions(domains: Array<CandidateDomain | DomainCatalogItem>): string {
  const lines: string[] = [
    '## 11. Open Questions',
    '',
    '_Track cross-domain questions and research items here._',
    '',
    '- [ ] _How do these domains share data in your architecture?_',
    '- [ ] _Which domain takes precedence when business rules conflict?_',
    '- [ ] _What is the ownership model for cross-domain features?_',
  ]

  domains.forEach((d) => {
    lines.push(`- [ ] _Open question specific to ${d.name}_`)
  })

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a combined 11-section domain markdown document for multiple domains.
 */
export function buildCombinedDomainMarkdown(
  domains: Array<CandidateDomain | DomainCatalogItem>,
  selectedRoles: string[],
): string {
  if (domains.length === 0) {
    return '# Combined Domain Context\n\n_No domains selected._\n'
  }

  if (domains.length === 1) {
    const name = domains[0].name
    return `# Combined Domain Context: ${name}\n\n_Only one domain selected. Use the single-domain view for a full structured breakdown._\n`
  }

  const title = domains.map((d) => d.name).join(' + ')

  const sections: string[] = [
    `# Combined Domain Context: ${title}`,
    '',
    buildSelectedDomains(domains),
    '',
    buildRelatedExplanation(domains),
    '',
    buildSharedWorkflows(domains),
    '',
    buildCrossDataEntities(),
    '',
    buildSharedMetrics(domains),
    '',
    buildCrossRisks(domains),
    '',
    buildCrossIntegrations(domains),
    '',
    buildCrossCompliance(domains),
    '',
    buildPersonaImplications(domains, selectedRoles),
    '',
    buildCombinedPromptContext(domains),
    '',
    buildOpenQuestions(domains),
    '',
  ]

  return sections.join('\n')
}
