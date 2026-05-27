import type {
  AIProviderSettings,
  ValidationResult,
  ProviderResponse,
  AITextResult,
  AIProviderError,
  UsageEstimate,
} from '../../../types'
import type { AIProvider } from './AIProvider'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// ---------------------------------------------------------------------------
// Response shapes (partial) from OpenAI Chat Completions API
// ---------------------------------------------------------------------------

interface OpenAIChoice {
  message?: {
    role?: string
    content?: string | null
  }
  finish_reason?: string
}

interface OpenAIUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

interface OpenAIResponse {
  id?: string
  model?: string
  choices?: OpenAIChoice[]
  usage?: OpenAIUsage
  error?: {
    message?: string
    type?: string
    code?: string
  }
}

// ---------------------------------------------------------------------------
// Provider implementation
// ---------------------------------------------------------------------------

export const openAIProvider: AIProvider = {
  providerId: 'openai',
  displayName: 'OpenAI',

  validateSettings(settings: AIProviderSettings): ValidationResult {
    const errors: string[] = []

    if (!settings.apiKey || settings.apiKey.trim().length === 0) {
      errors.push('OpenAI API key is required.')
    }
    if (!settings.model || settings.model.trim().length === 0) {
      errors.push('A model must be specified (e.g. gpt-4o).')
    }
    if (settings.maxOutputTokens <= 0) {
      errors.push('maxOutputTokens must be greater than 0.')
    }
    if (settings.temperature < 0 || settings.temperature > 2) {
      errors.push('Temperature must be between 0 and 2 for OpenAI models.')
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
      throw Object.assign(new Error('OpenAI API key is not configured.'), { code: 'INVALID_KEY' })
    }

    const baseUrl = settings.baseUrl?.trim() || OPENAI_API_URL
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

    const headers: Record<string, string> = {
      Authorization: `Bearer ${settings.apiKey}`,
      'content-type': 'application/json',
      ...(settings.customHeaders ?? {}),
    }

    let response: Response
    try {
      response = await fetch(baseUrl, {
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

    const json = (await response.json()) as OpenAIResponse

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
        inputTokens: json.usage?.prompt_tokens,
        outputTokens: json.usage?.completion_tokens,
      },
    }
  },

  parseResponse(response: unknown): AITextResult {
    const res = response as OpenAIResponse

    if (!res?.choices || res.choices.length === 0) {
      throw new Error('OpenAI response contained no choices.')
    }

    const content = res.choices[0]?.message?.content
    if (typeof content !== 'string') {
      throw new Error('OpenAI response did not contain a valid text content string.')
    }

    return {
      text: content,
      usage: {
        inputTokens: res.usage?.prompt_tokens,
        outputTokens: res.usage?.completion_tokens,
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
          message: 'Invalid OpenAI API key. Please check your settings.',
          retryable: false,
          statusCode: 401,
        }
      }
      if (status === 429) {
        return {
          code: 'RATE_LIMIT',
          message: 'OpenAI rate limit exceeded. Please wait before retrying.',
          retryable: true,
          statusCode: 429,
        }
      }
      if (status === 403) {
        return {
          code: 'FORBIDDEN',
          message: 'Access to this OpenAI resource is forbidden. Check your account permissions.',
          retryable: false,
          statusCode: 403,
        }
      }
      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'OpenAI server error. Please try again later.',
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
          message: 'Network error reaching OpenAI API. Check your internet connection.',
          retryable: true,
        }
      }

      return {
        code: 'UNKNOWN',
        message: err.message || 'An unknown error occurred calling the OpenAI API.',
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

    // GPT-4o pricing (approximate)
    const estimatedCostUsd = (inputTokens / 1_000_000) * 2.5 + (outputTokens / 1_000_000) * 10.0

    return { inputTokens, outputTokens, totalTokens, estimatedCostUsd }
  },
}
