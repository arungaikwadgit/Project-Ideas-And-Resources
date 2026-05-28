export interface DomainCatalogItem {
  id: string
  name: string
  category: string
  description: string
  commonUsers: string[]
  commonWorkflows: string[]
  commonMetrics: string[]
  commonRisks: string[]
  commonIntegrations: string[]
  complianceConsiderations: string[]
  suggestedRoles: string[]
  relatedSkills: string[]
  starterPromptContext: string
  source: 'curated'
}

export interface CandidateDomain {
  id: string
  name: string
  category: string
  description: string
  relevanceScore: number
  source: 'curated' | 'web_discovered' | 'custom'
  sourceLinks?: string[]
  suggestedWorkflows: string[]
  suggestedMetrics: string[]
  suggestedRisks: string[]
  suggestedIntegrations: string[]
  suggestedCompliance: string[]
  suggestedRoles: string[]
  whySuggested: string
}

export interface DomainKnowledge {
  id: string
  domainKey: string
  domainName: string
  contentMarkdown: string
  selectedRoleIds: string[]
  generatedSkillIds: string[]
  linkedPromptPackIds: string[]
  linkedPlaybookIds: string[]
  tags: string[]
  source: 'manual' | 'ai_assisted' | 'curated' | 'web_discovered'
  sourceLinks?: string[]
  createdAt: string
  updatedAt: string
}

export interface DomainSearchQuery {
  businessArea?: string
  productIdea?: string
  targetUsers?: string
  knownIndustry?: string
  keywords?: string[]
  freeText: string
}
