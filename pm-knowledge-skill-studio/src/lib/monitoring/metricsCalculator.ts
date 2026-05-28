import type { ActivityEvent, ActivityMetrics } from '../../types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function incrementRecord(record: Record<string, number>, key: string | undefined): void {
  if (!key) return
  record[key] = (record[key] ?? 0) + 1
}

function mostFrequent(record: Record<string, number>): string | undefined {
  const entries = Object.entries(record)
  if (entries.length === 0) return undefined
  return entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))[0]
}

function topN(record: Record<string, number>, n: number): string[] {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([key]) => key)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates all ActivityMetrics fields from a flat array of ActivityEvents.
 * This is a pure function — it does not read from or write to storage.
 */
export function calculateMetrics(events: ActivityEvent[]): ActivityMetrics {
  let totalAppOpens = 0
  let rolesSelectedCount = 0
  let domainsSelectedCount = 0
  let domainMarkdownCreated = 0
  let skillsSuggested = 0
  let skillsAccepted = 0
  let promptExecutionCount = 0
  let promptEditCount = 0
  let blockedAiRuns = 0
  let governanceWarnings = 0
  let governanceBlocks = 0
  let exportCount = 0
  let importCount = 0
  let lastActivityAt: string | undefined = undefined

  const roleSelectionCounts: Record<string, number> = {}
  const domainSelectionCounts: Record<string, number> = {}
  const phaseExecutionCounts: Record<string, number> = {}
  const taskExecutionCounts: Record<string, number> = {}
  const aiRunsByProvider: Record<string, number> = {}
  const aiRunsByModel: Record<string, number> = {}

  for (const event of events) {
    // Track last activity timestamp
    if (!lastActivityAt || event.createdAt > lastActivityAt) {
      lastActivityAt = event.createdAt
    }

    switch (event.eventType) {
      case 'app_opened':
        totalAppOpens++
        break

      case 'role_selected':
        rolesSelectedCount++
        if (event.roleId) incrementRecord(roleSelectionCounts, event.roleId)
        break

      case 'domain_selected':
      case 'domain_discovered':
        domainsSelectedCount++
        if (event.domainId) incrementRecord(domainSelectionCounts, event.domainId)
        break

      case 'domain_markdown_created':
        domainMarkdownCreated++
        break

      case 'skill_suggested':
        skillsSuggested++
        break

      case 'skill_accepted':
        skillsAccepted++
        break

      case 'sdlc_phase_selected':
        if (event.phaseId) incrementRecord(phaseExecutionCounts, event.phaseId)
        break

      case 'sdlc_task_selected':
        if (event.taskId) incrementRecord(taskExecutionCounts, event.taskId)
        break

      case 'prompt_executed':
        promptExecutionCount++
        if (event.phaseId) incrementRecord(phaseExecutionCounts, event.phaseId)
        if (event.taskId) incrementRecord(taskExecutionCounts, event.taskId)
        break

      case 'prompt_edited':
        promptEditCount++
        break

      case 'ai_run_started':
      case 'ai_run_success':
      case 'ai_run_failed': {
        const providerId = event.aiProviderId ?? (event.metadata?.providerId as string | undefined)
        const model = event.metadata?.model as string | undefined
        if (providerId) incrementRecord(aiRunsByProvider, providerId)
        if (model) incrementRecord(aiRunsByModel, model)
        break
      }

      case 'ai_run_blocked':
        blockedAiRuns++
        break

      case 'governance_warning':
        governanceWarnings++
        break

      case 'governance_block':
        governanceBlocks++
        break

      case 'export_created':
        exportCount++
        break

      case 'import_completed':
        importCount++
        break

      default:
        break
    }
  }

  return {
    totalAppOpens,
    rolesSelectedCount,
    rolesSelectedBreakdown: roleSelectionCounts,
    mostSelectedRole: mostFrequent(roleSelectionCounts),
    domainsSelectedCount,
    mostSelectedDomains: topN(domainSelectionCounts, 5),
    domainMarkdownCreated,
    skillsSuggested,
    skillsAccepted,
    phaseExecutionCounts,
    taskExecutionCounts,
    promptExecutionCount,
    promptEditCount,
    aiRunsByProvider,
    aiRunsByModel,
    blockedAiRuns,
    governanceWarnings,
    governanceBlocks,
    exportCount,
    importCount,
    lastActivityAt,
  }
}
