export interface ProjectNote {
  id: string
  projectId?: string
  projectName: string
  title: string
  contentMarkdown: string
  tags: string[]
  linkedDomainIds: string[]
  linkedSkillIds: string[]
  linkedPlaybookIds: string[]
  createdAt: string
  updatedAt: string
}
