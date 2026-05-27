export interface PlaybookStep {
  id: string
  title: string
  description: string
  order: number
}

export interface Playbook {
  id: string
  title: string
  description: string
  category: string
  phases: string[]
  roles: string[]
  steps: PlaybookStep[]
  tags: string[]
  contentMarkdown: string
  linkedDomainIds: string[]
  linkedSkillIds: string[]
  isCustom: boolean
  createdAt: string
  updatedAt: string
}

export interface PlaybookCatalogItem {
  id: string
  title: string
  description: string
  category: string
  phases: string[]
  roles: string[]
  steps: PlaybookStep[]
  tags: string[]
}
