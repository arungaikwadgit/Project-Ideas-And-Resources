export interface SDLCPhase {
  id: string
  name: string
  purpose: string
  typicalInputs: string[]
  typicalOutputs: string[]
  applicableRoles: string[]
  commonRisks: string[]
  recommendedPlaybooks: string[]
}

export interface SDLCTask {
  id: string
  phaseId: string
  roleIds: string[]
  title: string
  description: string
  inputsNeeded: string[]
  expectedOutputs: string[]
  relatedSkills: string[]
  relatedPlaybooks: string[]
  suggestedPromptPackType: string
  defaultMarkdownTemplateId: string
}

export interface PreloadedPrompt {
  id: string
  roleId: string
  phaseId: string
  taskId: string
  title: string
  description: string
  systemPromptMarkdown: string
  userPromptMarkdown: string
  inputGuidanceMarkdown: string
  expectedOutputMarkdown: string
  qualityChecklistMarkdown: string
  governanceChecklistMarkdown: string
  tags: string[]
  version: string
}

export interface CustomPrompt {
  id: string
  basePromptId: string
  roleId: string
  phaseId: string
  taskId: string
  title: string
  systemPromptMarkdown: string
  userPromptMarkdown: string
  inputGuidanceMarkdown: string
  expectedOutputMarkdown: string
  qualityChecklistMarkdown: string
  governanceChecklistMarkdown: string
  createdAt: string
  updatedAt: string
}
