export type GovernanceSeverity = 'none' | 'warning' | 'blocked'

export interface GovernanceCheck {
  id: string
  name: string
  status: 'passed' | 'warning' | 'blocked'
  message: string
  evidenceSnippet?: string
}

export interface GovernanceResult {
  allowed: boolean
  severity: GovernanceSeverity
  checks: GovernanceCheck[]
  blockedReasons: string[]
  warningReasons: string[]
  recommendedFixes: string[]
}
