export interface KnowledgeNote {
  id: string
  title: string
  contentMarkdown: string
  category: string
  tags: string[]
  isFavorite: boolean
  linkedSkillIds: string[]
  linkedDomainIds: string[]
  linkedPlaybookIds: string[]
  linkedAiRunIds: string[]
  linkedProjectIds: string[]
  createdAt: string
  updatedAt: string
}
