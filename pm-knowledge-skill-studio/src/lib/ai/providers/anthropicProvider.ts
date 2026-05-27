import type {
  AIProviderSettings,
  ValidationResult,
  ProviderResponse,
  AITextResult,
  AIProviderError,
  UsageEstimate,
} from '../../../types'
import type { AIProvider } from './AIProvider'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'

// ---------------------------------------------------------------------------
// Response shape (partial) from Anthropic Messages API
// ---------------------------------------------------------------------------

interface AnthropicContent {
  type: string
  text?: string
}

interface AnthropicUsage {
  input_tokens?: number
  output_tokens?: number
}

interface AnthropicResponse {
  id?: string
  model?: string
  content?: AnthropicContent[]
  usage?: AnthropicUsage
  error?: {
    type?: string
    message?: string
  }
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export const anthropicProvider: AIProvider = {
  providerId: 'anthropic',
  displayName: 'Anthropic Claude',

  validateSettings(settings: AIProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      errors.push('Anthropic API key is required.')
    }
    if (!settings.model || settings.model.trim().length === 0) {
      errors.push('A model must be specified (e.g. claude-3-5-sonnet-20241022).')
    }
    if (settings.maxOutputTokens <= 0) {
      errors.push('maxOutputTokens must be greater than 0.')
    }
    if (settings.temperature < 0 || settings.temperature > 1) {
      errors.push('Temperature must be between 0 and 1 for Anthropic models.')
    }

    return { valid: errors.length === 0, errors }
  },

  buildRequest(prompt: string, settings: AIProviderSettings): Record<string, unknown> {
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
    if (!settings.apiKey) {
      throw Object.assign(new Error('Anthropic API key is not configured.'), { code: 'INVALID_KEY' })
    }

    const body = this.buildRequest(prompt, settings)
    const timeoutMs = settings.timeoutMs > 0 ? settings.timeoutMs : 60_000

    // Combine caller abort signal with a timeout signal
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs)

    let combinedSignal = timeoutController.signal
    if (abortSignal) {
      // If either signal fires, abort
      const combined = new AbortController()
      abortSignal.addEventListener('abort', () => combined.abort())
      timeoutController.signal.addEventListener('abort', () => combined.abort())
      combinedSignal = combined.signal
    }

    let response: Response
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': settings.apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: combinedSignal,
      })
    } catch (err) {
      clearTimeout(timeoutId)
      throw this.normalizeError(err)
    }

    clearTimeout(timeoutId)

    const json = (await response.json()) as AnthropicResponse

    if (!response.ok) {
      const errMsg = json?.error?.message ?? `HTTP ${response.status}`
      const err: unknown = Object.assign(new Error(errMsg), {
        status: response.status,
        responseBody: json,
      })
      throw this.normalizeError(err)
    }

    const parsed = this.parseResponse(json)

    return {
      text: parsed.text,
      model: json.model ?? settings.model,
      usage: {
        inputTokens: json.usage?.input_tokens,
        outputTokens: json.usage?.output_tokens,
      },
    }
  },

  parseResponse(response: unknown): AITextResult {
    const res = response as AnthropicResponse

    if (!res?.content || res.content.length === 0) {
      throw new Error('Anthropic response contained no content blocks.')
    }

    const textBlock = res.content.find((c) => c.type === 'text')
    if (!textBlock || typeof textBlock.text !== 'string') {
      throw new Error('Anthropic response did not contain a text content block.')
    }

    return {
      text: textBlock.text,
      usage: {
        inputTokens: res.usage?.input_tokens,
        outputTokens: res.usage?.output_tokens,
      },
    }
  },

  normalizeError(error: unknown): AIProviderError {
    if (error instanceof Error) {
      const err = error as Error & { status?: number }

      if (err.name === 'AbortError') {
        return { code: 'TIMEOUT', message: 'Request timed out or was cancelled.', retryable: true }
      }

      const status = err.status
      if (status === 401) {
        return {
          code: 'INVALID_KEY',
          message: 'Invalid Anthropic API key. Please check your settings.',
          retryable: false,
          statusCode: 401,
        }
      }
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'Anthropic rate limit exceeded. Please wait before retrying.',
          retryable: true,
          statusCode: 429,
        }
      }
      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Anthropic server error. Please try again later.',
          retryable: true,
          statusCode: status,
        }
      }

      // Network / fetch error
      if (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network')) {
        return {
          code: 'NETWORK_ERROR',
          message: 'Network error reaching Anthropic API. Check your internet connection.',
          retryable: true,
        }
      }

      return {
        code: 'UNKNOWN',
        message: err.message || 'An unknown error occurred calling the Anthropic API.',
        retryable: false,
      }
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

    // Claude pricing is approximate — this is a rough estimate only
    const estimatedCostUsd = (inputTokens / 1_000_000) * 3.0 + (outputTokens / 1_000_000) * 15.0

    return { inputTokens, outputTokens, totalTokens, estimatedCostUsd }
  },
}
