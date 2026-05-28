import type { GovernanceCheck, GovernanceResult } from './governanceTypes'

// ---------------------------------------------------------------------------
// Pattern registry
// ---------------------------------------------------------------------------

interface InjectionPatternDef {
  id: string
  name: string
  patterns: RegExp[]
  severity: 'blocked' | 'warning'
  message: string
  fix: string
}

const INJECTION_PATTERNS: InjectionPatternDef[] = [
  // ---- Instruction override attempts (hard block) --------------------------
  {
    id: 'instruction_override',
    name: 'Instruction Override Attempt',
    patterns: [
      /ignore\s+(?:all\s+)?(?:previous|prior|earlier|above)\s+instructions?/gi,
      /disregard\s+(?:all\s+)?(?:your\s+|previous\s+|prior\s+|earlier\s+)?instructions?/gi,
      /forget\s+(?:your\s+)?(?:previous\s+)?(?:instructions?|role|context|training)/gi,
      /override\s+(?:your\s+)?(?:previous\s+)?(?:instructions?|rules?|guidelines?)/gi,
      /(?:start|begin)\s+over\s+with\s+(?:new\s+)?instructions?/gi,
      /new\s+instructions?[:]\s/gi,
      /from\s+now\s+on[,\s]+(?:you\s+(?:will|must|should|are))/gi,
      /replace\s+your\s+(?:system\s+)?(?:prompt|instructions?|role)/gi,
    ],
    severity: 'blocked',
    message: 'Text contains instruction override phrases that attempt to hijack the AI system prompt.',
    fix: 'Remove any phrases that attempt to override, ignore, or replace the AI system instructions.',
  },

  // ---- Role manipulation / jailbreak (hard block) -------------------------
  {
    id: 'role_manipulation',
    name: 'Role Manipulation / Jailbreak Attempt',
    patterns: [
      /\bact\s+as\s+(?:an?\s+)?(?!a\s+PM|a\s+product|a\s+project|a\s+scrum|a\s+business)[\w\s]{1,60}(?:without\s+(?:any\s+)?(?:restrictions?|limits?|filters?|guidelines?|rules?))/gi,
      /you\s+are\s+now\s+(?:an?\s+)?(?:DAN|jailbroken|unrestricted|unfiltered|free)/gi,
      /pretend\s+(?:you\s+(?:are|have\s+no)|there\s+are\s+no)\s+(?:restrictions?|limits?|guidelines?|filters?|rules?)/gi,
      /(?:DAN|jailbreak|jail\s+break|do\s+anything\s+now)\s+mode/gi,
      /(?:enable|activate|turn\s+on)\s+(?:developer|god|unrestricted|unfiltered|uncensored)\s+mode/gi,
      /simulate\s+(?:an?\s+)?(?:AI|language\s+model)\s+(?:without|with\s+no)\s+(?:restrictions?|limits?|filters?|safety)/gi,
      /you\s+(?:have\s+no|don'?t\s+have\s+any)\s+(?:restrictions?|limits?|guidelines?|rules?|filters?)/gi,
    ],
    severity: 'blocked',
    message: 'Text contains role manipulation or jailbreak attempt patterns.',
    fix: 'Remove any phrases that attempt to change the AI role or bypass safety guidelines.',
  },

  // ---- Secrets / credential extraction (hard block) -----------------------
  {
    id: 'secrets_extraction',
    name: 'Secrets / Credential Extraction Attempt',
    patterns: [
      /(?:show|tell|reveal|display|output|print|give)\s+(?:me\s+)?(?:your\s+)?(?:api[_\s-]?key|secret|token|password|credentials?)/gi,
      /(?:what\s+is|what'?s)\s+(?:your\s+)?(?:api[_\s-]?key|secret|password|token)/gi,
      /(?:reveal|expose|leak|disclose)\s+(?:your\s+)?(?:system\s+prompt|instructions?|context|configuration)/gi,
      /(?:show|print|output|display)\s+(?:your\s+)?(?:system\s+prompt|hidden\s+instructions?|internal\s+config)/gi,
      /(?:repeat|echo|reproduce)\s+(?:everything\s+)?(?:above|before|in\s+your\s+context)/gi,
    ],
    severity: 'blocked',
    message: 'Text attempts to extract secrets, credentials, or system prompt contents from the AI.',
    fix: 'Remove any requests for API keys, credentials, system prompts, or internal configuration.',
  },

  // ---- PII/PHI/PCI output injection (hard block) --------------------------
  {
    id: 'sensitive_output_injection',
    name: 'Sensitive Data Output Injection',
    patterns: [
      /include\s+(?:real\s+)?(?:patient|customer|user|employee)\s+(?:names?|data|records?|information)\s+in\s+(?:your\s+)?(?:output|response|answer)/gi,
      /(?:output|generate|create|write|produce)\s+(?:with\s+)?(?:real|actual|live)\s+(?:PII|PHI|PCI|SSN|credit\s+card)/gi,
      /use\s+(?:real|actual|real-life)\s+(?:patient|customer|user)\s+(?:data|records?|information)/gi,
      /(?:insert|add|include)\s+(?:credit\s+card|SSN|social\s+security|health\s+record|medical\s+record)\s+(?:numbers?|data)/gi,
    ],
    severity: 'blocked',
    message: 'Text attempts to instruct the AI to include real PII, PHI, or PCI data in its output.',
    fix: 'Remove any instructions to include real personal, health, or financial data in AI outputs.',
  },

  // ---- Prompt exfiltration (hard block) -----------------------------------
  {
    id: 'prompt_exfiltration',
    name: 'Prompt Exfiltration Attempt',
    patterns: [
      /translate\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)\s+to\s+\w+/gi,
      /encode\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions?)\s+(?:in|as|to)\s+(?:base64|hex|rot13)/gi,
      /summarize\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?(?:context|instructions?|system\s+prompt)/gi,
      /what\s+(?:were\s+)?(?:your\s+)?(?:exact\s+)?(?:initial\s+)?(?:system\s+)?instructions?/gi,
    ],
    severity: 'blocked',
    message: 'Text attempts to exfiltrate the system prompt or internal instructions.',
    fix: 'Remove any requests to translate, encode, or reveal system instructions.',
  },

  // ---- Suspicious code execution patterns (warning) -----------------------
  {
    id: 'code_execution_hint',
    name: 'Suspicious Code Execution Hint',
    patterns: [
      /(?:run|execute|eval)\s*\(.*\)/gi,
      /(?:import|require)\s+(?:os|subprocess|sys|shell|exec)/gi,
      /__import__\s*\(/gi,
    ],
    severity: 'warning',
    message: 'Text contains patterns that may be attempting to inject code execution instructions.',
    fix: 'Review any code execution instructions before including them in prompts.',
  },

  // ---- Roleplay bypass (warning) ------------------------------------------
  {
    id: 'roleplay_bypass',
    name: 'Roleplay Bypass Attempt',
    patterns: [
      /(?:in\s+this\s+)?(?:roleplay|role\s+play|scenario|story|fictional\s+world)[,\s]+(?:you\s+(?:can|are|have))/gi,
      /(?:hypothetically|theoretically|for\s+fictional\s+purposes?)[,\s]+(?:how\s+(?:would|do|could))/gi,
      /let'?s\s+(?:pretend|say|imagine)\s+(?:you\s+(?:have\s+no|are\s+not|can|could))\s+(?:restrictions?|limits?|filters?)/gi,
    ],
    severity: 'warning',
    message: 'Text uses roleplay or hypothetical framing that may be attempting to bypass safety guidelines.',
    fix: 'Review fictional or roleplay framing to ensure it does not bypass safety requirements.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findFirstMatch(patterns: RegExp[], text: string): RegExpExecArray | null {
  for (const pattern of patterns) {
    pattern.lastIndex = 0
    const match = pattern.exec(text)
    if (match) {
      pattern.lastIndex = 0
      return match
    }
    pattern.lastIndex = 0
  }
  return null
}

function buildRedactedSnippet(text: string, match: RegExpExecArray): string {
  const CONTEXT = 60
  const start = Math.max(0, match.index - CONTEXT)
  const end = Math.min(text.length, match.index + match[0].length + CONTEXT)
  const before = text.slice(start, match.index)
  const after = text.slice(match.index + match[0].length, end)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${before}[FLAGGED_CONTENT]${after}${suffix}`
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function scanForInjection(text: string): GovernanceResult {
  if (!text || text.trim().length === 0) {
    return {
      allowed: true,
      severity: 'none',
      checks: [],
      blockedReasons: [],
      warningReasons: [],
      recommendedFixes: [],
    }
  }

  const checks: GovernanceCheck[] = []
  const blockedReasons: string[] = []
  const warningReasons: string[] = []
  const recommendedFixes: string[] = []

  for (const patternDef of INJECTION_PATTERNS) {
    const match = findFirstMatch(patternDef.patterns, text)

    if (match) {
      const evidenceSnippet = buildRedactedSnippet(text, match)

      if (patternDef.severity === 'blocked') {
        checks.push({
          id: `injection_${patternDef.id}`,
          name: patternDef.name,
          status: 'blocked',
          message: patternDef.message,
          evidenceSnippet,
        })
        blockedReasons.push(patternDef.message)
        if (!recommendedFixes.includes(patternDef.fix)) {
          recommendedFixes.push(patternDef.fix)
        }
      } else {
        checks.push({
          id: `injection_${patternDef.id}`,
          name: patternDef.name,
          status: 'warning',
          message: patternDef.message,
          evidenceSnippet,
        })
        warningReasons.push(patternDef.message)
        if (!recommendedFixes.includes(patternDef.fix)) {
          recommendedFixes.push(patternDef.fix)
        }
      }
    } else {
      checks.push({
        id: `injection_${patternDef.id}`,
        name: patternDef.name,
        status: 'passed',
        message: `No ${patternDef.name.toLowerCase()} patterns detected.`,
      })
    }
  }

  const hasBlocked = blockedReasons.length > 0
  const hasWarning = warningReasons.length > 0

  const severity: import('./governanceTypes').GovernanceSeverity = hasBlocked
    ? 'blocked'
    : hasWarning
    ? 'warning'
    : 'none'

  return {
    allowed: !hasBlocked,
    severity,
    checks,
    blockedReasons,
    warningReasons,
    recommendedFixes,
  }
}
