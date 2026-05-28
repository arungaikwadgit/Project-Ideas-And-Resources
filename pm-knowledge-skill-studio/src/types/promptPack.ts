export interface PromptPack {
  id: string
  title: string
  description: string
  category: string
  targetRoleIds: string[]
  phaseId?: string
  taskId?: string
  systemRole: string
  goalStatement: string
  domainContextIds: string[]
  workStyleSectionIds: string[]
  skillIds: string[]
  playbookIds: string[]
  projectNoteIds: string[]
  decisionIds: string[]
  lessonIds: string[]
  instructionSteps: string[]
  desiredOutputFormat: string
  qualityChecklist: string[]
  governanceChecklist: string[]
  tags: string[]
  builtPromptMarkdown?: string
  createdAt: string
  updatedAt: string
}

export interface PromptPackCatalogItem {
  id: string
  title: string
  description: string
  category: string
  targetRoleIds: string[]
  phaseId: string
  systemRole: string
  goalStatement: string
  instructionSteps: string[]
  desiredOutputFormat: string
  qualityChecklist: string[]
  governanceChecklist: string[]
  tags: string[]
}
