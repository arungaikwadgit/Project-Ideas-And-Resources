import type { GovernanceResult } from './governanceTypes'

export function canExecute(result: GovernanceResult): boolean {
  return result.allowed && result.severity !== 'blocked'
}

export function requiresAcknowledgement(result: GovernanceResult): boolean {
  return result.severity === 'warning'
}
