import type { SearchProviderSettings, ValidationResult, NormalizedSearchResult, SearchError } from '../../../types'

export interface SearchProvider {
  providerId: string
  displayName: string
  validateSettings(settings: SearchProviderSettings): ValidationResult
  search(
    query: string,
    settings: SearchProviderSettings,
    abortSignal?: AbortSignal,
  ): Promise<NormalizedSearchResult[]>
  normalizeError(error: unknown): SearchError
}
