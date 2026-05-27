import type { SearchProviderSettings, ValidationResult, NormalizedSearchResult, SearchError } from '../../../types'
import type { SearchProvider } from './searchProvider'

// ---------------------------------------------------------------------------
// Common response shape parsing
// ---------------------------------------------------------------------------

interface AnySearchResult {
  title?: string
  url?: string
  snippet?: string
  description?: string
  content?: string
  text?: string
  summary?: string
  score?: number
  relevance?: number
  rank?: number
  link?: string
  href?: string
}

/**
 * Attempts to extract a results array from a variety of common API response structures.
 */
function extractResults(json: unknown): AnySearchResult[] {
  if (!json || typeof json !== 'object') return []

  const obj = json as Record<string, unknown>

  // Direct array
  if (Array.isArray(json)) return json as AnySearchResult[]

  // Common wrapper keys
  const candidateKeys = ['results', 'items', 'hits', 'data', 'documents', 'entries', 'organic', 'web']
  for (const key of candidateKeys) {
    if (Array.isArray(obj[key])) {
      const arr = obj[key] as unknown[]
      // For 'web' key it might be { results: [...] }
      if (key === 'web' && typeof arr[0] === 'undefined') {
        const webObj = obj[key] as unknown as Record<string, unknown>
        if (Array.isArray(webObj?.results)) return webObj.results as AnySearchResult[]
      }
      return arr as AnySearchResult[]
    }
  }

  return []
}

function extractSnippet(r: AnySearchResult): string {
  return r.snippet ?? r.description ?? r.content ?? r.text ?? r.summary ?? ''
}

function extractUrl(r: AnySearchResult): string {
  return r.url ?? r.link ?? r.href ?? ''
}

function extractScore(r: AnySearchResult, index: number): number {
  if (typeof r.score === 'number') return r.score
  if (typeof r.relevance === 'number') return r.relevance
  if (typeof r.rank === 'number') return Math.max(0.1, 1 - (r.rank - 1) * 0.08)
  return Math.max(0.1, 1 - index * 0.08)
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export const genericSearchProvider: SearchProvider = {
  providerId: 'generic',
  displayName: 'Generic Search',

  validateSettings(settings: SearchProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.baseUrl || settings.baseUrl.trim().length === 0) {
      errors.push('Base URL is required for the generic search provider.')
    } else {
      try {
        new URL(settings.baseUrl)
      } catch {
        errors.push('Base URL must be a valid URL.')
      }
    }
    if (settings.timeoutMs <= 0) {
      errors.push('timeoutMs must be greater than 0.')
    }

    return { valid: errors.length === 0, errors }
  },

  async search(
    query: string,
    settings: SearchProviderSettings,
    abortSignal?: AbortSignal,
  ): Promise<NormalizedSearchResult[]> {
    if (!settings.baseUrl) {
      throw { code: 'MISSING_CONFIG', message: 'Generic search base URL is not configured.', retryable: false } as SearchError
    }

    const timeoutMs = settings.timeoutMs > 0 ? settings.timeoutMs : 30_000

    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)

    let combinedSignal = timeoutController.signal
    if (abortSignal) {
      const combined = new AbortController()
      abortSignal.addEventListener('abort', () => combined.abort())
      timeoutController.signal.addEventListener('abort', () => combined.abort())
      combinedSignal = combined.signal
    }

    const url = new URL(settings.baseUrl.trim())
    url.searchParams.set('q', query.trim())

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (settings.apiKey && settings.apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    if (settings.customHeaders) {
      Object.assign(headers, settings.customHeaders)
    }

    let response: Response
    try {
      response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: combinedSignal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      throw this.normalizeError(err)
    }

    clearTimeout(timeoutId)

    let json: unknown
    try {
      json = await response.json()
    } catch {
      throw {
        code: 'PARSE_ERROR',
        message: `HTTP ${response.status}: Response was not valid JSON.`,
        retryable: false,
      } as SearchError
    }

    if (!response.ok) {
      const err: unknown = Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
      throw this.normalizeError(err)
    }

    const rawResults = extractResults(json)

    return rawResults.slice(0, 10).map((r, index): NormalizedSearchResult => ({
      title: r.title ?? 'Untitled',
      url: extractUrl(r),
      snippet: extractSnippet(r),
      relevanceScore: extractScore(r, index),
      source: 'generic',
    }))
  },

  normalizeError(error: unknown): SearchError {
    if (error instanceof Error) {
      const err = error as Error & { status?: number }

      if (err.name === 'AbortError') {
        return { code: 'TIMEOUT', message: 'Search request timed out or was cancelled.', retryable: true }
      }

      const status = err.status
      if (status === 401 || status === 403) {
        return {
          code: 'INVALID_KEY',
          message: 'Unauthorized. Check the API key or authentication headers.',
          retryable: false,
        }
      }
      if (status === 429) {
        return { code: 'RATE_LIMIT', message: 'Rate limit exceeded. Please wait before retrying.', retryable: true }
      }
      if (status && status >= 500) {
        return { code: 'SERVER_ERROR', message: `Server error (HTTP ${status}). Try again later.`, retryable: true }
      }
      if (
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('network')
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error reaching the search endpoint. Check the base URL and your connection.',
          retryable: true,
        }
      }

      return { code: 'UNKNOWN', message: err.message || 'Unknown search error.', retryable: false }
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as SearchError
    }

    return { code: 'UNKNOWN', message: 'An unexpected error occurred.', retryable: false }
  },
}
