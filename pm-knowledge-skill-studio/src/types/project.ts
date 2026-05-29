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

export interface Project {
  id: string
  name: string
  description: string
  goals: string
  techStack: string
  team: string
  status: 'active' | 'archived'
  linkedDomainIds: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}
