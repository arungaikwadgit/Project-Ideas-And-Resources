import type { AIProviderSettings, ProviderResponse } from '../../types'
import type { AIProvider } from './providers/AIProvider'
import { anthropicProvider } from './providers/anthropicProvider'
import { openAIProvider } from './providers/openAIProvider'
import { genericHttpProvider } from './providers/genericHttpProvider'

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, AIProvider> = {
  anthropic: anthropicProvider,
  claude: anthropicProvider,   // alias: the type in provider.ts uses 'claude'
  openai: openAIProvider,
  generic: genericHttpProvider,
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the AIProvider implementation for the given provider type string,
 * or null if the provider type is not recognised.
 */
export function getProvider(providerType: string): AIProvider | null {
  return PROVIDERS[providerType.toLowerCase()] ?? null
}

/**
 * Validates settings, selects the correct provider, and executes the prompt.
 * Throws an AIProviderError-shaped error if anything goes wrong.
 */
export async function executePrompt(
  prompt: string,
  settings: AIProviderSettings,
  abortSignal?: AbortSignal,
): Promise<ProviderResponse> {
  const provider = getProvider(settings.providerType)

  if (!provider) {
    throw {
      code: 'UNKNOWN_PROVIDER',
      message: `No provider found for type "${settings.providerType}". Supported: anthropic, openai, generic.`,
      retryable: false,
    }
  }

  const validation = provider.validateSettings(settings)
  if (!validation.valid) {
    throw {
      code: 'INVALID_SETTINGS',
      message: `Provider settings validation failed: ${validation.errors.join('; ')}`,
      retryable: false,
    }
  }

  try {
    return await provider.execute(prompt, settings, abortSignal)
  } catch (err) {
    // If the provider already normalized the error, re-throw as-is
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      'message' in err &&
      'retryable' in err
    ) {
      throw err
    }
    // Otherwise normalize
    throw provider.normalizeError(err)
  }
}
