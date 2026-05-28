export type AIRunStatus = 'draft' | 'blocked' | 'running' | 'success' | 'failed' | 'cancelled'

export interface UsageEstimate {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  estimatedCostUsd?: number
}

export interface AIRun {
  id: string
  promptPackId?: string
  customPromptId?: string
  preloadedPromptId?: string
  providerId: string
  model: string
  promptSnapshotMarkdown: string
  inputContextSnapshot: string
  resultMarkdown: string
  status: AIRunStatus
  errorSummary?: string
  createdAt: string
  usageEstimate?: UsageEstimate
  linkedSkillIds: string[]
  linkedDomainIds: string[]
  linkedPlaybookIds: string[]
  linkedProjectId?: string
  savedAsKnowledgeId?: string
}
