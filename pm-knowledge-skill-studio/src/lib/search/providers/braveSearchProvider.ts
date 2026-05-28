import type { SearchProviderSettings, ValidationResult, NormalizedSearchResult, SearchError } from '../../../types'
import type { SearchProvider } from './searchProvider'

const BRAVE_API_BASE_URL = 'https://api.search.brave.com/res/v1/web/search'

// ---------------------------------------------------------------------------
// Response shapes (partial) from Brave Search API
// ---------------------------------------------------------------------------

interface BraveWebResult {
  title?: string
  url?: string
  description?: string
  score?: number
  age?: string
}

interface BraveWebResults {
  results?: BraveWebResult[]
}

interface BraveResponse {
  web?: BraveWebResults
  error?: {
    code?: string
    message?: string
  }
  detail?: string
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export const braveSearchProvider: SearchProvider = {
  providerId: 'brave',
  displayName: 'Brave Search',

  validateSettings(settings: SearchProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      errors.push('Brave Search API key is required.')
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
    if (!settings.apiKey) {
      throw { code: 'INVALID_KEY', message: 'Brave Search API key is not configured.', retryable: false } as SearchError
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

    const baseUrl = settings.baseUrl?.trim() || BRAVE_API_BASE_URL
    const url = new URL(baseUrl)
    url.searchParams.set('q', query.trim())
    url.searchParams.set('count', '10')

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': settings.apiKey,
      ...(settings.customHeaders ?? {}),
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

    let json: BraveResponse
    try {
      json = (await response.json()) as BraveResponse
    } catch {
      throw {
        code: 'PARSE_ERROR',
        message: `HTTP ${response.status}: Response was not valid JSON.`,
        retryable: false,
      } as SearchError
    }

    if (!response.ok) {
      const errMsg =
        json?.error?.message ??
        json?.detail ??
        `HTTP ${response.status}`
      const err: unknown = Object.assign(new Error(String(errMsg)), { status: response.status })
      throw this.normalizeError(err)
    }

    const results = json?.web?.results ?? []

    return results.map((r, index): NormalizedSearchResult => ({
      title: r.title ?? 'Untitled',
      url: r.url ?? '',
      snippet: r.description ?? '',
      // Brave doesn't always return an explicit score; assign a decay score
      relevanceScore: typeof r.score === 'number' ? r.score : Math.max(0.1, 1 - index * 0.08),
      source: 'brave',
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
          message: 'Invalid Brave Search API key. Please check your settings.',
          retryable: false,
        }
      }
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Brave Search rate limit exceeded. Please wait before retrying.',
          retryable: true,
        }
      }
      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Brave Search server error. Please try again later.',
          retryable: true,
        }
      }
      if (
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('network')
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error reaching Brave Search. Check your internet connection.',
          retryable: true,
        }
      }

      return { code: 'UNKNOWN', message: err.message || 'Unknown Brave Search error.', retryable: false }
    }

    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as SearchError
    }

    return { code: 'UNKNOWN', message: 'An unexpected error occurred.', retryable: false }
  },
}
