import type {
  AIProviderSettings,
  ValidationResult,
  ProviderResponse,
  AITextResult,
  AIProviderError,
  UsageEstimate,
} from '../../../types'

export interface AIProvider {
  providerId: string
  displayName: string
  validateSettings(settings: AIProviderSettings): ValidationResult
  buildRequest(prompt: string, settings: AIProviderSettings): Record<string, unknown>
  execute(
    prompt: string,
    settings: AIProviderSettings,
    abortSignal?: AbortSignal,
  ): Promise<ProviderResponse>
  parseResponse(response: unknown): AITextResult
  normalizeError(error: unknown): AIProviderError
  estimateUsage?(prompt: string, response: ProviderResponse): UsageEstimate
}
