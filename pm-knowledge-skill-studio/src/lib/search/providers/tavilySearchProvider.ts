import type { SearchProviderSettings, ValidationResult, NormalizedSearchResult, SearchError } from '../../../types'
import type { SearchProvider } from './searchProvider'

const TAVILY_API_URL = 'https://api.tavily.com/search'

// ---------------------------------------------------------------------------
// Response shapes (partial) from Tavily Search API
// ---------------------------------------------------------------------------

interface TavilyResult {
  title?: string
  url?: string
  content?: string
  score?: number
}

interface TavilyResponse {
  results?: TavilyResult[]
  error?: string
  detail?: string
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export const tavilySearchProvider: SearchProvider = {
  providerId: 'tavily',
  displayName: 'Tavily Search',

  validateSettings(settings: SearchProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      errors.push('Tavily API key is required.')
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
      throw { code: 'INVALID_KEY', message: 'Tavily API key is not configured.', retryable: false } as SearchError
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

    const body = {
      api_key: settings.apiKey,
      query: query.trim(),
      max_results: 10,
      search_depth: 'advanced',
    }

    let response: Response
    try {
      response = await fetch(TAVILY_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: combinedSignal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      throw this.normalizeError(err)
    }

    clearTimeout(timeoutId)

    let json: TavilyResponse
    try {
      json = (await response.json()) as TavilyResponse
    } catch {
      throw {
        code: 'PARSE_ERROR',
        message: `HTTP ${response.status}: Response was not valid JSON.`,
        retryable: false,
      } as SearchError
    }

    if (!response.ok) {
      const errMsg = json?.error ?? json?.detail ?? `HTTP ${response.status}`
      const err: unknown = Object.assign(new Error(String(errMsg)), { status: response.status })
      throw this.normalizeError(err)
    }

    const results = json.results ?? []

    return results.map((r): NormalizedSearchResult => ({
      title: r.title ?? 'Untitled',
      url: r.url ?? '',
      snippet: r.content ?? '',
      relevanceScore: typeof r.score === 'number' ? r.score : 0.5,
      source: 'tavily',
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
          message: 'Invalid Tavily API key. Please check your settings.',
          retryable: false,
        }
      }
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Tavily rate limit exceeded. Please wait before retrying.',
          retryable: true,
        }
      }
      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Tavily server error. Please try again later.',
          retryable: true,
        }
      }
      if (
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('network')
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error reaching Tavily. Check your internet connection.',
          retryable: true,
        }
      }

      return { code: 'UNKNOWN', message: err.message || 'Unknown Tavily search error.', retryable: false }
    }

    // Already a SearchError
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as SearchError
    }

    return { code: 'UNKNOWN', message: 'An unexpected error occurred.', retryable: false }
  },
}
