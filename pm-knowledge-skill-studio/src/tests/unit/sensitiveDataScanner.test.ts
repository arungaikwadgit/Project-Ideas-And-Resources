import { describe, it, expect } from 'vitest'
import { scanText } from '../../lib/governance/sensitiveDataScanner'

describe('sensitiveDataScanner', () => {
  // ---------------------------------------------------------------------------
  // SSN detection (hard block)
  // ---------------------------------------------------------------------------

  it('blocks text containing SSN pattern', () => {
    const result = scanText('The employee SSN is 123456789 on record.')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.blockedReasons.length).toBeGreaterThan(0)
    expect(result.blockedReasons.some((r) => r.toLowerCase().includes('social security'))).toBe(true)
  })

  it('blocks text with formatted SSN like 123-45-6789', () => {
    const result = scanText('Please verify SSN: 123-45-6789 before processing.')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.checks.some((c) => c.id === 'ssn' && c.status === 'blocked')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Payment card (hard block)
  // ---------------------------------------------------------------------------

  it('blocks text containing credit card number', () => {
    const result = scanText('Card on file: 4532123456789012 exp 12/26')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.blockedReasons.some((r) => r.toLowerCase().includes('payment card'))).toBe(true)
  })

  it('blocks text with formatted card 4532-1234-5678-9012', () => {
    const result = scanText('Payment card: 4532-1234-5678-9012')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.checks.some((c) => c.id === 'payment_card' && c.status === 'blocked')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Private key (hard block)
  // ---------------------------------------------------------------------------

  it('blocks text containing PEM private key block', () => {
    const result = scanText('-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.checks.some((c) => c.id === 'private_key' && c.status === 'blocked')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // API key (hard block)
  // ---------------------------------------------------------------------------

  it('blocks text with obvious API key pattern like sk-...', () => {
    const result = scanText('Use this key: sk-abcdefghij1234567890ABCDEFGHIJ12 to call the API.')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.checks.some((c) => c.id === 'api_key_token' && c.status === 'blocked')).toBe(true)
  })

  it('blocks text with token-looking values like api_key= ...', () => {
    const result = scanText('api_key=supersecretabcdefghijklmnopqrstuvwxyz1234567890')
    expect(result.allowed).toBe(false)
    expect(result.severity).toBe('blocked')
    expect(result.blockedReasons.some((r) => r.toLowerCase().includes('api key'))).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Email (warning)
  // ---------------------------------------------------------------------------

  it('warns on text containing email address', () => {
    const result = scanText('Contact the PM at jane.doe@example.com for details.')
    expect(result.allowed).toBe(true)
    expect(result.severity).toBe('warning')
    expect(result.warningReasons.some((r) => r.toLowerCase().includes('email'))).toBe(true)
    expect(result.checks.some((c) => c.id === 'email' && c.status === 'warning')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Phone (warning)
  // ---------------------------------------------------------------------------

  it('warns on text containing phone number', () => {
    const result = scanText('Call the team at 555-867-5309 during business hours.')
    expect(result.allowed).toBe(true)
    expect(result.severity).toBe('warning')
    expect(result.warningReasons.some((r) => r.toLowerCase().includes('phone'))).toBe(true)
    expect(result.checks.some((c) => c.id === 'phone' && c.status === 'warning')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Clean text (passes)
  // ---------------------------------------------------------------------------

  it('allows clean business text without sensitive data', () => {
    const result = scanText(
      'Our product roadmap focuses on improving checkout conversion rates and reducing cart abandonment.',
    )
    expect(result.allowed).toBe(true)
    expect(result.severity).toBe('none')
    expect(result.blockedReasons).toHaveLength(0)
    expect(result.warningReasons).toHaveLength(0)
  })

  it('returns allowed=true for clean text', () => {
    const result = scanText('Q3 OKR: Increase monthly active users by 20%.')
    expect(result.allowed).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // Evidence snippet redaction
  // ---------------------------------------------------------------------------

  it('never includes full sensitive value in evidence snippet', () => {
    const ssn = '123-45-6789'
    const result = scanText(`Customer SSN is ${ssn} per their application.`)

    const ssnCheck = result.checks.find((c) => c.id === 'ssn')
    expect(ssnCheck).toBeDefined()
    expect(ssnCheck?.evidenceSnippet).toBeDefined()

    // The evidence snippet should contain [REDACTED] and NOT the raw SSN
    expect(ssnCheck?.evidenceSnippet).toContain('[REDACTED]')
    expect(ssnCheck?.evidenceSnippet).not.toContain(ssn)
  })

  // ---------------------------------------------------------------------------
  // Empty / whitespace input
  // ---------------------------------------------------------------------------

  it('returns allowed=true for empty text', () => {
    const result = scanText('')
    expect(result.allowed).toBe(true)
    expect(result.severity).toBe('none')
    expect(result.checks).toHaveLength(0)
  })

  it('returns allowed=true for whitespace-only text', () => {
    const result = scanText('   \n   ')
    expect(result.allowed).toBe(true)
    expect(result.severity).toBe('none')
  })

  // ---------------------------------------------------------------------------
  // Recommended fixes
  // ---------------------------------------------------------------------------

  it('provides recommended fix for blocked content', () => {
    const result = scanText('SSN 987-65-4321')
    expect(result.recommendedFixes.length).toBeGreaterThan(0)
  })

  it('provides recommended fix for warning content', () => {
    const result = scanText('Reach out to user@domain.com')
    expect(result.recommendedFixes.length).toBeGreaterThan(0)
  })

  // ---------------------------------------------------------------------------
  // Result structure
  // ---------------------------------------------------------------------------

  it('returns GovernanceResult with all required fields', () => {
    const result = scanText('Hello world, our product vision is to delight users.')
    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('severity')
    expect(result).toHaveProperty('checks')
    expect(result).toHaveProperty('blockedReasons')
    expect(result).toHaveProperty('warningReasons')
    expect(result).toHaveProperty('recommendedFixes')
    expect(Array.isArray(result.checks)).toBe(true)
    expect(Array.isArray(result.blockedReasons)).toBe(true)
    expect(Array.isArray(result.warningReasons)).toBe(true)
    expect(Array.isArray(result.recommendedFixes)).toBe(true)
  })

  it('severity is blocked when blocked reasons exist', () => {
    const result = scanText('SSN is 111-22-3333 per HR.')
    expect(result.severity).toBe('blocked')
    expect(result.allowed).toBe(false)
  })

  it('severity is warning when only warnings exist', () => {
    const result = scanText('PM email: alice@company.com')
    expect(result.severity).toBe('warning')
    expect(result.allowed).toBe(true)
  })

  it('severity is none for clean text', () => {
    const result = scanText('The sprint velocity improved by 15% this quarter.')
    expect(result.severity).toBe('none')
    expect(result.allowed).toBe(true)
  })
})
