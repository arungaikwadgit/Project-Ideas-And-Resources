import type { CandidateDomain, DomainCatalogItem } from '../../types/domain'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listOrPlaceholder(items: string[], placeholder: string): string {
  if (!items || items.length === 0) return `_${placeholder}_`
  return items.map((item) => `- ${item}`).join('\n')
}

function commaSeparated(items: string[]): string {
  if (!items || items.length === 0) return '_None specified_'
  return items.join(', ')
}

function isCatalogItem(domain: CandidateDomain | DomainCatalogItem): domain is DomainCatalogItem {
  return domain.source === 'curated' && 'commonUsers' in domain
}

// ---------------------------------------------------------------------------
// Field extractors (handle both CandidateDomain and DomainCatalogItem)
// ---------------------------------------------------------------------------

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

function getTargetUsers(domain: CandidateDomain | DomainCatalogItem, selectedRoles: string[]): string[] {
  if (isCatalogItem(domain)) return domain.commonUsers
  // For candidates, combine suggested roles with the user's selected roles
  const combined = [...new Set([...domain.suggestedRoles, ...selectedRoles])]
  return combined.length > 0 ? combined : ['Product Managers', 'Business Stakeholders']
}

function getPromptContext(domain: CandidateDomain | DomainCatalogItem): string {
  if (isCatalogItem(domain)) return domain.starterPromptContext
  return domain.whySuggested || `Use domain knowledge from ${domain.name} to inform product decisions.`
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildOverview(domain: CandidateDomain | DomainCatalogItem): string {
  const lines: string[] = [
    `## 1. Domain Overview`,
    '',
    domain.description || '_No description available._',
    '',
    `**Category:** ${domain.category}`,
  ]

  if (!isCatalogItem(domain) && domain.sourceLinks && domain.sourceLinks.length > 0) {
    lines.push('')
    lines.push('**Source References:**')
    domain.sourceLinks.forEach((link) => lines.push(`- [${link}](${link})`))
  }

  return lines.join('\n')
}

function buildTargetUsers(domain: CandidateDomain | DomainCatalogItem, selectedRoles: string[]): string {
  const users = getTargetUsers(domain, selectedRoles)
  return [
    '## 2. Target Users',
    '',
    listOrPlaceholder(users, 'No target users specified — add your stakeholder personas here.'),
  ].join('\n')
}

function buildWorkflows(domain: CandidateDomain | DomainCatalogItem): string {
  const workflows = getWorkflows(domain)
  return [
    '## 3. Key Business Workflows',
    '',
    listOrPlaceholder(workflows, 'No workflows specified — document the core business processes here.'),
  ].join('\n')
}

function buildDataEntities(): string {
  return [
    '## 4. Core Data Entities',
    '',
    '_Add the primary data objects, records, and entities that are central to this domain._',
    '',
    'Examples: Customer record, Order, Invoice, Product catalog item, Policy, Ticket…',
  ].join('\n')
}

function buildMetrics(domain: CandidateDomain | DomainCatalogItem): string {
  const metrics = getMetrics(domain)
  return [
    '## 5. Business Metrics',
    '',
    listOrPlaceholder(metrics, 'No metrics specified — add KPIs and business metrics tracked in this domain.'),
  ].join('\n')
}

function buildRisks(domain: CandidateDomain | DomainCatalogItem): string {
  const risks = getRisks(domain)
  return [
    '## 6. Common Risks',
    '',
    listOrPlaceholder(risks, 'No risks specified — document the common risks and failure modes here.'),
  ].join('\n')
}

function buildIntegrations(domain: CandidateDomain | DomainCatalogItem): string {
  const integrations = getIntegrations(domain)
  return [
    '## 7. Common Integrations',
    '',
    listOrPlaceholder(integrations, 'No integrations specified — list the tools, platforms, and APIs commonly used.'),
  ].join('\n')
}

function buildCompliance(domain: CandidateDomain | DomainCatalogItem): string {
  const compliance = getCompliance(domain)
  return [
    '## 8. Compliance / Governance Considerations',
    '',
    listOrPlaceholder(compliance, 'No compliance items specified — add regulatory and governance requirements here.'),
  ].join('\n')
}

function buildArtifacts(): string {
  return [
    '## 9. Common Project Artifacts',
    '',
    '_List the typical deliverables and documents produced when working in this domain._',
    '',
    'Examples: PRD, BRD, data flow diagrams, process maps, RACI, compliance documentation…',
  ].join('\n')
}

function buildVocabulary(): string {
  return [
    '## 10. Useful Vocabulary',
    '',
    '_Add domain-specific terminology, acronyms, and jargon used by stakeholders._',
    '',
    '| Term | Definition |',
    '|------|------------|',
    '| _Term_ | _Definition_ |',
  ].join('\n')
}

function buildPromptContext(domain: CandidateDomain | DomainCatalogItem, userContext?: string): string {
  const defaultContext = getPromptContext(domain)
  const contextBlock = userContext
    ? `${defaultContext}\n\n**Additional Context:**\n${userContext}`
    : defaultContext

  return [
    '## 11. AI Prompting Context',
    '',
    '_This section is injected into AI prompts to ground the model in domain knowledge._',
    '',
    contextBlock,
  ].join('\n')
}

function buildOpenQuestions(): string {
  return [
    '## 12. Open Questions',
    '',
    '_Use this section to track unanswered questions and research items._',
    '',
    '- [ ] _Add your first open question here_',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a complete 12-section domain knowledge markdown document.
 */
export function buildDomainMarkdown(
  domain: CandidateDomain | DomainCatalogItem,
  selectedRoles: string[],
  userContext?: string,
): string {
  const sections: string[] = [
    `# Domain Knowledge: ${domain.name}`,
    '',
    buildOverview(domain),
    '',
    buildTargetUsers(domain, selectedRoles),
    '',
    buildWorkflows(domain),
    '',
    buildDataEntities(),
    '',
    buildMetrics(domain),
    '',
    buildRisks(domain),
    '',
    buildIntegrations(domain),
    '',
    buildCompliance(domain),
    '',
    buildArtifacts(),
    '',
    buildVocabulary(),
    '',
    buildPromptContext(domain, userContext),
    '',
    buildOpenQuestions(),
    '',
  ]

  return sections.join('\n')
}
