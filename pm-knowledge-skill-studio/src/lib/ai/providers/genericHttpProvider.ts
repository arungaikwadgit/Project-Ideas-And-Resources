import type {
  AIProviderSettings,
  ValidationResult,
  ProviderResponse,
  AITextResult,
  AIProviderError,
  UsageEstimate,
} from '../../../types'
import type { AIProvider } from './AIProvider'

// ---------------------------------------------------------------------------
// JSON path extraction utility
// ---------------------------------------------------------------------------

/**
 * Traverses a nested object using dot-notation path segments.
 * Array indices can be specified as numeric strings, e.g. 'choices.0.message.content'.
 */
function extractByPath(obj: unknown, path: string): unknown {
  const segments = path.split('.')
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined

    if (Array.isArray(current)) {
      const idx = parseInt(segment, 10)
      if (isNaN(idx)) return undefined
      current = current[idx]
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * Attempts to extract the text response from common API response shapes.
 * Tries the following paths in order:
 *   1. choices[0].message.content  (OpenAI-compatible)
 *   2. choices[0].text
 *   3. result.text
 *   4. result
 *   5. text
 *   6. content
 *   7. output
 *   8. response
 *   9. message
 */
function extractTextFromCommonPaths(response: unknown): string | undefined {
  const COMMON_PATHS = [
    'choices.0.message.content',
    'choices.0.text',
    'result.text',
    'result',
    'text',
    'content',
    'output',
    'response',
    'message',
  ]

  for (const path of COMMON_PATHS) {
    const value = extractByPath(response, path)
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
  }

  return undefined
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

function parseResponseWithPath(response: unknown, responseTextPath?: string): AITextResult {
  let text: string | undefined

  if (responseTextPath && responseTextPath.trim().length > 0) {
    const value = extractByPath(response, responseTextPath.trim())
    if (typeof value === 'string') text = value
  }

  if (!text) text = extractTextFromCommonPaths(response)

  if (!text) {
    throw new Error(
      'Could not extract text from the provider response. ' +
        'Configure responseTextPath to specify the JSON path to the text field.',
    )
  }

  return { text }
}

export const genericHttpProvider: AIProvider = {
  providerId: 'generic',
  displayName: 'Generic HTTP (OpenAI-compatible)',

  validateSettings(settings: AIProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.baseUrl || settings.baseUrl.trim().length === 0) {
      errors.push('Base URL is required for the generic HTTP provider.')
    } else {
      try {
        new URL(settings.baseUrl)
      } catch {
        errors.push('Base URL must be a valid URL (e.g. http://localhost:11434/v1/chat/completions).')
      }
    }

    if (!settings.model || settings.model.trim().length === 0) {
      errors.push('A model name must be specified.')
    }
    if (settings.maxOutputTokens <= 0) {
      errors.push('maxOutputTokens must be greater than 0.')
    }

    return { valid: errors.length === 0, errors }
  },

  buildRequest(prompt: string, settings: AIProviderSettings): Record<string, unknown> {
    // Use OpenAI-compatible request format by default
    return {
      model: settings.model,
      max_tokens: settings.maxOutputTokens,
      temperature: settings.temperature,
      messages: [{ role: 'user', content: prompt }],
    }
  },

  async execute(
    prompt: string,
    settings: AIProviderSettings,
    abortSignal?: AbortSignal,
  ): Promise<ProviderResponse> {
    if (!settings.baseUrl) {
      throw Object.assign(new Error('Generic provider base URL is not configured.'), {
        code: 'MISSING_CONFIG',
      })
    }

    const body = this.buildRequest(prompt, settings)
    const timeoutMs = settings.timeoutMs > 0 ? settings.timeoutMs : 60_000

    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)

    let combinedSignal = timeoutController.signal
    if (abortSignal) {
      const combined = new AbortController()
      abortSignal.addEventListener('abort', () => combined.abort())
      timeoutController.signal.addEventListener('abort', () => combined.abort())
      combinedSignal = combined.signal
    }

    // Build headers: content-type always set; apiKey as Bearer if provided;
    // custom headers override everything else
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    }
    if (settings.apiKey && settings.apiKey.trim().length > 0) {
      headers['Authorization'] = `Bearer ${settings.apiKey}`
    }
    if (settings.customHeaders) {
      Object.assign(headers, settings.customHeaders)
    }

    let response: Response
    try {
      response = await fetch(settings.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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
      } as AIProviderError
    }

    if (!response.ok) {
      const errMsg =
        (typeof json === 'object' && json !== null && 'error' in json
          ? ((json as Record<string, unknown>)['error'] as Record<string, unknown>)?.message
          : undefined) ?? `HTTP ${response.status}`

      const err: unknown = Object.assign(new Error(String(errMsg)), {
        status: response.status,
        responseBody: json,
      })
      throw this.normalizeError(err)
    }

    const parsed = parseResponseWithPath(json, settings.responseTextPath)

    return {
      text: parsed.text,
      model: settings.model,
      usage: parsed.usage,
    }
  },

  parseResponse(response: unknown): AITextResult {
    return parseResponseWithPath(response, undefined)
  },

  normalizeError(error: unknown): AIProviderError {
    if (error instanceof Error) {
      const err = error as Error & { status?: number; code?: string }

      if (err.name === 'AbortError') {
        return { code: 'TIMEOUT', message: 'Request timed out or was cancelled.', retryable: true }
      }

      if (err.code === 'MISSING_CONFIG') {
        return {
          code: 'MISSING_CONFIG',
          message: err.message,
          retryable: false,
        }
      }

      const status = err.status
      if (status === 401) {
        return {
          code: 'INVALID_KEY',
          message: 'Unauthorized. Check the API key or authentication configuration.',
          retryable: false,
          statusCode: 401,
        }
      }
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded. Please wait before retrying.',
          retryable: true,
          statusCode: 429,
        }
      }
      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: `Server error (HTTP ${status}). Please try again later.`,
          retryable: true,
          statusCode: status,
        }
      }

      if (
        err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('network')
      ) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error reaching the provider endpoint. Check the base URL and your connection.',
          retryable: true,
        }
      }

      return {
        code: 'UNKNOWN',
        message: err.message || 'An unknown error occurred.',
        retryable: false,
      }
    }

    // Already normalized AIProviderError
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    ) {
      return error as AIProviderError
    }

    return {
      code: 'UNKNOWN',
      message: 'An unexpected error occurred.',
      retryable: false,
    }
  },

  estimateUsage(prompt: string, response: ProviderResponse): UsageEstimate {
    const inputTokens = response.usage?.inputTokens ?? Math.ceil(prompt.length / 4)
    const outputTokens = response.usage?.outputTokens ?? Math.ceil(response.text.length / 4)
    const totalTokens = inputTokens + outputTokens
    return { inputTokens, outputTokens, totalTokens }
  },
}
