export type AIProviderType = 'claude' | 'openai' | 'generic'
export type SearchProviderType = 'tavily' | 'brave' | 'generic'

export interface AIProviderSettings {
  providerType: AIProviderType
  apiKey?: string
  baseUrl?: string
  model: string
  maxOutputTokens: number
  temperature: number
  timeoutMs: number
  customHeaders?: Record<string, string>
  responseTextPath?: string
}

export interface AIProviderConfig {
  id: string
  displayName: string
  providerType: AIProviderType
  baseUrl: string
  defaultModel: string
  supportedModels: { id: string; displayName: string; maxTokens: number; contextWindow: number }[]
  requiresApiKey: boolean
  keyEnvHint: string
  docsUrl: string
  description: string
}

export interface SearchProviderSettings {
  providerType: SearchProviderType
  apiKey?: string
  baseUrl?: string
  customHeaders?: Record<string, string>
  timeoutMs: number
}

export interface SearchProviderConfig {
  id: string
  displayName: string
  providerType: SearchProviderType
  baseUrl: string
  requiresApiKey: boolean
  keyEnvHint: string
  docsUrl: string
  description: string
  maxResults: number
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  score?: number
}

export interface NormalizedSearchResult {
  title: string
  url: string
  snippet: string
  relevanceScore: number
  source: string
}

export interface SearchError {
  code: string
  message: string
  retryable: boolean
}

export interface ProviderResponse {
  text: string
  model: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

export interface AITextResult {
  text: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
}

export interface AIProviderError {
  code: string
  message: string
  retryable: boolean
  statusCode?: number
}

export interface StoredAIProviderSettings {
  id: string
  providerId: string
  settings: Omit<AIProviderSettings, 'apiKey'>
  hasApiKey: boolean
  updatedAt: string
}

export interface StoredSearchProviderSettings {
  id: string
  providerId: string
  settings: Omit<SearchProviderSettings, 'apiKey'>
  hasApiKey: boolean
  updatedAt: string
}
