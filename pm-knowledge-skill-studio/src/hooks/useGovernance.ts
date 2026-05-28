import { useState, useCallback } from 'react'
import type { GovernanceResult } from '../types'
import { runGovernanceCheck } from '../lib/governance/governanceEngine'

/**
 * React hook that wraps the governance engine with local state for scan result,
 * acknowledgement, and a derived `canProceed` flag.
 *
 * Usage:
 *   const { result, acknowledged, canProceed, scan, acknowledge, reset } = useGovernance()
 *   const govResult = scan(promptText, optionalContext)
 *   // If result.severity === 'warning', user must call acknowledge() before proceeding.
 */
export function useGovernance() {
  const [result, setResult] = useState<GovernanceResult | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)

  /**
   * Run a governance scan against the given text and optional context string.
   * Resets acknowledgement on every new scan.
   */
  const scan = useCallback((text: string, context?: string): GovernanceResult => {
    const govResult = runGovernanceCheck(text, context)
    setResult(govResult)
    setAcknowledged(false)
    return govResult
  }, [])

  /** Mark warnings as acknowledged so the user can proceed despite them. */
  const acknowledge = useCallback(() => setAcknowledged(true), [])

  /** Clear the scan result and acknowledgement state. */
  const reset = useCallback(() => {
    setResult(null)
    setAcknowledged(false)
  }, [])

  /**
   * True when it is safe to proceed:
   * - No scan has been run yet (result is null), OR
   * - Severity is 'none', OR
   * - Severity is 'warning' AND the user has acknowledged, OR
   * - (never true when severity is 'blocked')
   */
  const canProceed =
    result === null ||
    result.severity === 'none' ||
    (result.severity === 'warning' && acknowledged)

  return { result, acknowledged, canProceed, scan, acknowledge, reset }
}
