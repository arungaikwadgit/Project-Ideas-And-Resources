export type ActivityEventType =
  | 'app_opened'
  | 'role_selected'
  | 'domain_selected'
  | 'domain_discovered'
  | 'domain_markdown_created'
  | 'skill_suggested'
  | 'skill_accepted'
  | 'work_style_created'
  | 'playbook_created'
  | 'sdlc_phase_selected'
  | 'sdlc_task_selected'
  | 'prompt_loaded'
  | 'prompt_edited'
  | 'prompt_reset'
  | 'prompt_executed'
  | 'ai_run_started'
  | 'ai_run_success'
  | 'ai_run_failed'
  | 'ai_run_blocked'
  | 'governance_warning'
  | 'governance_block'
  | 'provider_configured'
  | 'search_provider_configured'
  | 'export_created'
  | 'import_completed'
  | 'admin_health_viewed'

export type ActivityStatus = 'success' | 'failed' | 'blocked' | 'cancelled'

export interface ActivityEvent {
  id: string
  eventType: ActivityEventType
  roleId?: string
  phaseId?: string
  taskId?: string
  domainId?: string
  promptPackId?: string
  aiProviderId?: string
  status: ActivityStatus
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PhaseExecutionMetric {
  phaseId: string
  phaseName: string
  selectedCount: number
  taskExecutedCount: number
  promptExecutedCount: number
  lastExecutedAt?: string
}

export interface RoleExecutionMetric {
  roleId: string
  roleName: string
  selectedCount: number
  phaseCount: number
  taskCount: number
  promptExecutionCount: number
  lastUsedAt?: string
}

export interface TaskExecutionMetric {
  taskId: string
  taskTitle: string
  phaseId: string
  roleIds: string[]
  selectedCount: number
  promptLoadedCount: number
  promptEditedCount: number
  promptExecutedCount: number
  lastExecutedAt?: string
}

export interface ActivityMetrics {
  totalAppOpens: number
  rolesSelectedCount: number
  rolesSelectedBreakdown: Record<string, number>
  mostSelectedRole?: string
  domainsSelectedCount: number
  mostSelectedDomains: string[]
  domainMarkdownCreated: number
  skillsSuggested: number
  skillsAccepted: number
  phaseExecutionCounts: Record<string, number>
  taskExecutionCounts: Record<string, number>
  promptExecutionCount: number
  promptEditCount: number
  aiRunsByProvider: Record<string, number>
  aiRunsByModel: Record<string, number>
  blockedAiRuns: number
  governanceWarnings: number
  governanceBlocks: number
  exportCount: number
  importCount: number
  lastActivityAt?: string
}
