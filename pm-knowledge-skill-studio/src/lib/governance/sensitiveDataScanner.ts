import type { GovernanceCheck, GovernanceResult } from './governanceTypes'

// ---------------------------------------------------------------------------
// Pattern registry
// ---------------------------------------------------------------------------

interface PatternDef {
  id: string
  name: string
  regex: RegExp
  severity: 'blocked' | 'warning'
  message: string
  fix: string
}

const PATTERNS: PatternDef[] = [
  // ---- Hard blocks --------------------------------------------------------
  {
    id: 'ssn',
    name: 'Social Security Number (SSN)',
    // 123-45-6789 or 123 45 6789 or 123456789
    regex: /\b(?:\d{3}[-\s]\d{2}[-\s]\d{4}|\d{9})\b/g,
    severity: 'blocked',
    message: 'Text contains what appears to be a Social Security Number (SSN).',
    fix: 'Remove or anonymize any SSN values before including this text.',
  },
  {
    id: 'payment_card',
    name: 'Payment Card Number',
    // Luhn-structured 13–19 digit card numbers with optional separators
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    severity: 'blocked',
    message: 'Text contains what appears to be a payment card number.',
    fix: 'Remove or tokenize payment card numbers before including this text.',
  },
  {
    id: 'private_key',
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'blocked',
    message: 'Text contains a PEM private key block.',
    fix: 'Remove all private key material before including this text.',
  },
  {
    id: 'api_key_token',
    name: 'API Key / Secret Token',
    // Common patterns: sk-xxx, ghp_xxx, Bearer xxx, api_key=xxx, token=xxx
    regex:
      /(?:(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*["']?[A-Za-z0-9\-._~+/]{20,}["']?|(?:sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{36,}|xox[baprs]-[A-Za-z0-9\-]{10,}))/gi,
    severity: 'blocked',
    message: 'Text contains what appears to be an API key or secret token.',
    fix: 'Remove all API keys and secret tokens. Use placeholders like {API_KEY} instead.',
  },
  {
    id: 'password_value',
    name: 'Password in Plain Text',
    regex: /(?:password|passwd|pwd)\s*[:=]\s*["']?(?!\s*\{)[^\s"'<>{]{4,}["']?/gi,
    severity: 'blocked',
    message: 'Text contains what appears to be a password value in plain text.',
    fix: 'Remove password values. Reference credentials via environment variables or a secrets manager.',
  },

  // ---- Warnings -----------------------------------------------------------
  {
    id: 'email',
    name: 'Email Address',
    regex: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g,
    severity: 'warning',
    message: 'Text contains one or more email addresses.',
    fix: 'Verify that sharing email addresses is permitted in this context. Consider anonymizing.',
  },
  {
    id: 'phone',
    name: 'Phone Number',
    // Various US / international patterns
    regex:
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}|\+\d{1,3}[-.\s]\d{2,4}[-.\s]\d{4,10}/g,
    severity: 'warning',
    message: 'Text contains what appears to be a phone number.',
    fix: 'Verify that sharing phone numbers is permitted. Consider anonymizing.',
  },
  {
    id: 'phi_keywords',
    name: 'Protected Health Information (PHI) Keywords',
    regex:
      /\b(?:diagnosis|medical record(?:\s*number)?|patient\s+id|date\s+of\s+birth|dob|health\s+insurance|medicare|medicaid|hipaa|icd[-\s]?(?:9|10)|prescription|clinical\s+notes?)\b/gi,
    severity: 'warning',
    message: 'Text contains PHI-related keywords.',
    fix: 'Ensure this content is appropriate to include. Do not paste real patient data.',
  },
  {
    id: 'confidential',
    name: 'Confidential / Proprietary Wording',
    regex:
      /\b(?:confidential|proprietary|trade\s+secret|internal\s+use\s+only|do\s+not\s+distribute|attorney[-\s]?client\s+privilege)\b/gi,
    severity: 'warning',
    message: 'Text contains confidential or proprietary markings.',
    fix: 'Confirm that sharing this content with an AI service is allowed by your organization.',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a snippet with the matched portion REDACTED.
 * We take up to 40 chars of context on each side of the match.
 */
function buildRedactedSnippet(text: string, match: RegExpExecArray): string {
  const CONTEXT = 40
  const start = Math.max(0, match.index - CONTEXT)
  const end = Math.min(text.length, match.index + match[0].length + CONTEXT)
  const before = text.slice(start, match.index)
  const after = text.slice(match.index + match[0].length, end)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${before}[REDACTED]${after}${suffix}`
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function scanText(text: string): GovernanceResult {
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

  for (const pattern of PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.regex.lastIndex = 0
    const match = pattern.regex.exec(text)

    if (match) {
      const evidenceSnippet = buildRedactedSnippet(text, match)

      if (pattern.severity === 'blocked') {
        checks.push({
          id: pattern.id,
          name: pattern.name,
          status: 'blocked',
          message: pattern.message,
          evidenceSnippet,
        })
        blockedReasons.push(pattern.message)
        if (!recommendedFixes.includes(pattern.fix)) {
          recommendedFixes.push(pattern.fix)
        }
      } else {
        checks.push({
          id: pattern.id,
          name: pattern.name,
          status: 'warning',
          message: pattern.message,
          evidenceSnippet,
        })
        warningReasons.push(pattern.message)
        if (!recommendedFixes.includes(pattern.fix)) {
          recommendedFixes.push(pattern.fix)
        }
      }
    } else {
      checks.push({
        id: pattern.id,
        name: pattern.name,
        status: 'passed',
        message: `No ${pattern.name.toLowerCase()} detected.`,
      })
    }

    // Reset after exec
    pattern.regex.lastIndex = 0
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
