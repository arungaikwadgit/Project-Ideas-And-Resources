import { getDb } from './db'
import type {
  AIProviderSettings,
  SearchProviderSettings,
  StoredAIProviderSettings,
  StoredSearchProviderSettings,
} from '../types'

// ---------------------------------------------------------------------------
// Storage key prefixes — session-only by default
// ---------------------------------------------------------------------------

const SESSION_AI_KEY_PREFIX = 'pmks_ai_key_'
const SESSION_SEARCH_KEY_PREFIX = 'pmks_search_key_'

// localStorage keys for the (not-recommended) persistent mode
const LOCAL_AI_KEY_PREFIX = 'pmks_persist_ai_key_'
const LOCAL_SEARCH_KEY_PREFIX = 'pmks_persist_search_key_'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveAiKey(providerId: string): string | undefined {
  return (
    sessionStorage.getItem(SESSION_AI_KEY_PREFIX + providerId) ||
    localStorage.getItem(LOCAL_AI_KEY_PREFIX + providerId) ||
    undefined
  )
}

function resolveSearchKey(providerId: string): string | undefined {
  return (
    sessionStorage.getItem(SESSION_SEARCH_KEY_PREFIX + providerId) ||
    localStorage.getItem(LOCAL_SEARCH_KEY_PREFIX + providerId) ||
    undefined
  )
}

// ---------------------------------------------------------------------------
// Public store
// ---------------------------------------------------------------------------

export const providerSettingsStore = {
  // ---- AI provider --------------------------------------------------------

  /**
   * Persist non-key AI provider settings to IndexedDB.
   * The API key is stored in sessionStorage by default, or optionally in
   * localStorage (persistKey = true — not recommended; shown with a warning).
   * API keys are NEVER written to IndexedDB.
   */
  async saveAIProviderSettings(
    providerId: string,
    settings: Omit<AIProviderSettings, 'apiKey'>,
    apiKey?: string,
    persistKey = false,
  ): Promise<void> {
    const db = await getDb()

    const record: StoredAIProviderSettings = {
      id: providerId,
      providerId,
      settings,
      hasApiKey: !!apiKey,
      updatedAt: new Date().toISOString(),
    }

    // Store non-sensitive config in IndexedDB only
    await db.put('aiProviderSettings', record)

    if (apiKey) {
      if (persistKey) {
        // Warn in console — persistent key storage is not recommended
        console.warn(
          '[PMKS] persistKey=true: API key stored in localStorage for provider',
          providerId,
          '— this is not recommended.',
        )
        localStorage.setItem(LOCAL_AI_KEY_PREFIX + providerId, apiKey)
      } else {
        sessionStorage.setItem(SESSION_AI_KEY_PREFIX + providerId, apiKey)
        // Remove from localStorage if the user is switching back to session-only
        localStorage.removeItem(LOCAL_AI_KEY_PREFIX + providerId)
      }
    }
  },

  /**
   * Retrieve AI provider settings + in-memory API key for the given provider.
   * Returns `{ settings: null, apiKey: undefined }` when nothing is stored.
   */
  async getAIProviderSettings(
    providerId: string,
  ): Promise<{ settings: Omit<AIProviderSettings, 'apiKey'> | null; apiKey?: string }> {
    const db = await getDb()
    const record = await db.get('aiProviderSettings', providerId)
    const apiKey = resolveAiKey(providerId)
    return { settings: record?.settings ?? null, apiKey }
  },

  /**
   * List all stored AI provider setting records (no API keys included).
   */
  async listAIProviderSettings(): Promise<StoredAIProviderSettings[]> {
    const db = await getDb()
    return db.getAll('aiProviderSettings')
  },

  /**
   * Remove a specific AI provider's stored settings and its key from all
   * storages.
   */
  async deleteAIProviderSettings(providerId: string): Promise<void> {
    const db = await getDb()
    await db.delete('aiProviderSettings', providerId)
    sessionStorage.removeItem(SESSION_AI_KEY_PREFIX + providerId)
    localStorage.removeItem(LOCAL_AI_KEY_PREFIX + providerId)
  },

  // ---- Search provider ----------------------------------------------------

  /**
   * Persist non-key search provider settings to IndexedDB.
   * API key follows the same session/local split as AI providers.
   */
  async saveSearchProviderSettings(
    providerId: string,
    settings: Omit<SearchProviderSettings, 'apiKey'>,
    apiKey?: string,
    persistKey = false,
  ): Promise<void> {
    const db = await getDb()

    const record: StoredSearchProviderSettings = {
      id: providerId,
      providerId,
      settings,
      hasApiKey: !!apiKey,
      updatedAt: new Date().toISOString(),
    }

    await db.put('searchProviderSettings', record)

    if (apiKey) {
      if (persistKey) {
        console.warn(
          '[PMKS] persistKey=true: Search API key stored in localStorage for provider',
          providerId,
          '— this is not recommended.',
        )
        localStorage.setItem(LOCAL_SEARCH_KEY_PREFIX + providerId, apiKey)
      } else {
        sessionStorage.setItem(SESSION_SEARCH_KEY_PREFIX + providerId, apiKey)
        localStorage.removeItem(LOCAL_SEARCH_KEY_PREFIX + providerId)
      }
    }
  },

  /**
   * Retrieve search provider settings + in-memory API key.
   */
  async getSearchProviderSettings(
    providerId: string,
  ): Promise<{ settings: Omit<SearchProviderSettings, 'apiKey'> | null; apiKey?: string }> {
    const db = await getDb()
    const record = await db.get('searchProviderSettings', providerId)
    const apiKey = resolveSearchKey(providerId)
    return { settings: record?.settings ?? null, apiKey }
  },

  /**
   * List all stored search provider setting records (no API keys included).
   */
  async listSearchProviderSettings(): Promise<StoredSearchProviderSettings[]> {
    const db = await getDb()
    return db.getAll('searchProviderSettings')
  },

  /**
   * Remove a specific search provider's stored settings and its key from all
   * storages.
   */
  async deleteSearchProviderSettings(providerId: string): Promise<void> {
    const db = await getDb()
    await db.delete('searchProviderSettings', providerId)
    sessionStorage.removeItem(SESSION_SEARCH_KEY_PREFIX + providerId)
    localStorage.removeItem(LOCAL_SEARCH_KEY_PREFIX + providerId)
  },

  // ---- Global key management ----------------------------------------------

  /**
   * Wipe every PMKS API key from both sessionStorage and localStorage.
   * Does NOT touch IndexedDB (non-sensitive settings remain).
   */
  clearAllKeys(): void {
    // Collect session storage keys to remove (avoid mutating during iteration)
    const sessionKeysToRemove: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (
        key &&
        (key.startsWith(SESSION_AI_KEY_PREFIX) ||
          key.startsWith(SESSION_SEARCH_KEY_PREFIX))
      ) {
        sessionKeysToRemove.push(key)
      }
    }
    sessionKeysToRemove.forEach((k) => sessionStorage.removeItem(k))

    // Collect local storage keys to remove
    const localKeysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith(LOCAL_AI_KEY_PREFIX) ||
          key.startsWith(LOCAL_SEARCH_KEY_PREFIX))
      ) {
        localKeysToRemove.push(key)
      }
    }
    localKeysToRemove.forEach((k) => localStorage.removeItem(k))
  },

  /**
   * Returns true if an AI key is currently available in memory for the given
   * provider (session or local storage).
   */
  hasAIKey(providerId: string): boolean {
    return !!resolveAiKey(providerId)
  },

  /**
   * Returns true if a search key is currently available in memory for the
   * given provider.
   */
  hasSearchKey(providerId: string): boolean {
    return !!resolveSearchKey(providerId)
  },
}
