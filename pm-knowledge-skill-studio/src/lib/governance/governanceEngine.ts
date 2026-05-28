import type { GovernanceCheck, GovernanceResult, GovernanceSeverity } from './governanceTypes'
import { scanText } from './sensitiveDataScanner'
import { scanForInjection } from './promptInjectionScanner'

// ---------------------------------------------------------------------------
// Merge helpers
// ---------------------------------------------------------------------------

function mergeSeverity(a: GovernanceSeverity, b: GovernanceSeverity): GovernanceSeverity {
  if (a === 'blocked' || b === 'blocked') return 'blocked'
  if (a === 'warning' || b === 'warning') return 'warning'
  return 'none'
}

function mergeResults(results: GovernanceResult[]): GovernanceResult {
  const checks: GovernanceCheck[] = []
  const blockedReasons: string[] = []
  const warningReasons: string[] = []
  const recommendedFixes: string[] = []

  let severity: GovernanceSeverity = 'none'

  for (const result of results) {
    checks.push(...result.checks)

    for (const reason of result.blockedReasons) {
      if (!blockedReasons.includes(reason)) blockedReasons.push(reason)
    }
    for (const reason of result.warningReasons) {
      if (!warningReasons.includes(reason)) warningReasons.push(reason)
    }
    for (const fix of result.recommendedFixes) {
      if (!recommendedFixes.includes(fix)) recommendedFixes.push(fix)
    }

    severity = mergeSeverity(severity, result.severity)
  }

  return {
    allowed: blockedReasons.length === 0,
    severity,
    checks,
    blockedReasons,
    warningReasons,
    recommendedFixes,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs all governance checks (sensitive data + prompt injection) against
 * the provided text plus an optional context string.
 */
export function runGovernanceCheck(text: string, context?: string): GovernanceResult {
  const combined = context ? `${text}\n${context}` : text

  const sensitiveResult = scanText(combined)
  const injectionResult = scanForInjection(combined)

  return mergeResults([sensitiveResult, injectionResult])
}

/**
 * Runs governance checks against a JSON string being imported.
 * Checks the raw JSON for sensitive data; injection checks are skipped
 * since JSON import isn't executed as a prompt.
 */
export function runImportGovernanceCheck(jsonString: string): GovernanceResult {
  if (!jsonString || jsonString.trim().length === 0) {
    return {
      allowed: false,
      severity: 'blocked',
      checks: [
        {
          id: 'import_empty',
          name: 'Import Content Check',
          status: 'blocked',
          message: 'Import data is empty or could not be read.',
        },
      ],
      blockedReasons: ['Import data is empty or could not be read.'],
      warningReasons: [],
      recommendedFixes: ['Provide a valid knowledge bundle JSON file.'],
    }
  }

  // Validate JSON structure first
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return {
      allowed: false,
      severity: 'blocked',
      checks: [
        {
          id: 'import_invalid_json',
          name: 'Import JSON Validity',
          status: 'blocked',
          message: 'Import data is not valid JSON.',
        },
      ],
      blockedReasons: ['Import data is not valid JSON.'],
      warningReasons: [],
      recommendedFixes: ['Ensure the import file is a valid JSON knowledge bundle.'],
    }
  }

  // Check for API keys in import bundle (they should never be exported)
  if (
    parsed !== null &&
    typeof parsed === 'object' &&
    !Array.isArray(parsed)
  ) {
    const obj = parsed as Record<string, unknown>
    if ('apiKey' in obj || 'api_key' in obj) {
      return {
        allowed: false,
        severity: 'blocked',
        checks: [
          {
            id: 'import_api_key',
            name: 'Import API Key Detection',
            status: 'blocked',
            message: 'Import bundle contains API key fields which should never be exported.',
          },
        ],
        blockedReasons: ['Import bundle contains API key fields which should never be exported.'],
        warningReasons: [],
        recommendedFixes: ['Re-export the bundle from the application. API keys are automatically excluded from exports.'],
      }
    }
  }

  // Run sensitive data scan on the raw JSON string
  const sensitiveResult = scanText(jsonString)

  return mergeResults([sensitiveResult])
}
