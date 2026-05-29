import { getDb } from './db'
import type {
  AIProviderSettings,
  SearchProviderSettings,
  StoredAIProviderSettings,
  StoredSearchProviderSettings,
} from '../types'

// ---------------------------------------------------------------------------
// Key storage strategy
// ---------------------------------------------------------------------------
// PRIMARY:  IndexedDB `apiKeys` store — survives all navigation, tab close,
//           browser restarts, and most privacy-mode settings.
// CACHE:    localStorage — fast synchronous read for hasAIKey() checks.
//           Re-populated from IndexedDB on getAIProviderSettings() if missing.
// SESSION:  sessionStorage — opt-in session-only mode (cleared on tab close).
//
// API keys are NEVER written to the general IndexedDB data stores, NEVER
// included in the export bundle, and NEVER sent to any logging system.
// ---------------------------------------------------------------------------

const LOCAL_AI_CACHE_PREFIX = 'pmks_ai_key_'
const LOCAL_SEARCH_CACHE_PREFIX = 'pmks_search_key_'
const SESSION_AI_PREFIX = 'pmks_sess_ai_'
const SESSION_SEARCH_PREFIX = 'pmks_sess_search_'

// Migration: old key locations from prior versions of the app
const LEGACY_LOCAL_AI_PREFIX = 'pmks_persist_ai_key_'
const LEGACY_SESSION_AI_PREFIX = 'pmks_ai_key_'
const LEGACY_LOCAL_SEARCH_PREFIX = 'pmks_persist_search_key_'
const LEGACY_SESSION_SEARCH_PREFIX = 'pmks_search_key_'

const aiDbId = (providerId: string) => `ai_${providerId}`
const searchDbId = (providerId: string) => `search_${providerId}`

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function readKeyFromDb(dbId: string): Promise<string | undefined> {
  try {
    const db = await getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (db as any).get('apiKeys', dbId)
    return record?.apiKey || undefined
  } catch {
    return undefined
  }
}

async function writeKeyToDb(dbId: string, apiKey: string, sessionOnly: boolean): Promise<void> {
  const db = await getDb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).put('apiKeys', { id: dbId, apiKey, sessionOnly, updatedAt: new Date().toISOString() })
}

async function deleteKeyFromDb(dbId: string): Promise<void> {
  try {
    const db = await getDb()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).delete('apiKeys', dbId)
  } catch {
    // best-effort
  }
}

/** Migrate a key from legacy storage locations to the new IndexedDB store. */
async function migrateLegacyAiKey(providerId: string): Promise<string | undefined> {
  const fromLocal = localStorage.getItem(LEGACY_LOCAL_AI_PREFIX + providerId)
  const fromSession = sessionStorage.getItem(LEGACY_SESSION_AI_PREFIX + providerId)
  const key = fromLocal || fromSession
  if (!key) return undefined

  await writeKeyToDb(aiDbId(providerId), key, false)
  localStorage.setItem(LOCAL_AI_CACHE_PREFIX + providerId, key)

  if (fromLocal) localStorage.removeItem(LEGACY_LOCAL_AI_PREFIX + providerId)
  if (fromSession) sessionStorage.removeItem(LEGACY_SESSION_AI_PREFIX + providerId)
  return key
}

async function migrateLegacySearchKey(providerId: string): Promise<string | undefined> {
  const fromLocal = localStorage.getItem(LEGACY_LOCAL_SEARCH_PREFIX + providerId)
  const fromSession = sessionStorage.getItem(LEGACY_SESSION_SEARCH_PREFIX + providerId)
  const key = fromLocal || fromSession
  if (!key) return undefined

  await writeKeyToDb(searchDbId(providerId), key, false)
  localStorage.setItem(LOCAL_SEARCH_CACHE_PREFIX + providerId, key)

  if (fromLocal) localStorage.removeItem(LEGACY_LOCAL_SEARCH_PREFIX + providerId)
  if (fromSession) sessionStorage.removeItem(LEGACY_SESSION_SEARCH_PREFIX + providerId)
  return key
}

// ---------------------------------------------------------------------------
// Public store
// ---------------------------------------------------------------------------

export const providerSettingsStore = {
  // ---- AI provider --------------------------------------------------------

  /**
   * Save AI provider settings and API key.
   * persistKey = true (default): key stored in IndexedDB + localStorage cache.
   * persistKey = false: key stored in sessionStorage only (cleared on tab close).
   * API keys are NEVER written to the main IndexedDB data stores.
   */
  async saveAIProviderSettings(
    providerId: string,
    settings: Omit<AIProviderSettings, 'apiKey'>,
    apiKey?: string,
    persistKey = true,
  ): Promise<void> {
    const db = await getDb()
    const record: StoredAIProviderSettings = {
      id: providerId,
      providerId,
      settings,
      hasApiKey: !!apiKey,
      updatedAt: new Date().toISOString(),
    }
    await db.put('aiProviderSettings', record)

    if (apiKey) {
      if (persistKey) {
        // Primary: IndexedDB (survives all navigation and browser restarts)
        await writeKeyToDb(aiDbId(providerId), apiKey, false)
        // Cache: localStorage (fast sync access for hasAIKey())
        localStorage.setItem(LOCAL_AI_CACHE_PREFIX + providerId, apiKey)
        // Remove any session-only key
        sessionStorage.removeItem(SESSION_AI_PREFIX + providerId)
      } else {
        // Session-only mode
        sessionStorage.setItem(SESSION_AI_PREFIX + providerId, apiKey)
        // Remove persistent copies
        await deleteKeyFromDb(aiDbId(providerId))
        localStorage.removeItem(LOCAL_AI_CACHE_PREFIX + providerId)
      }
    }
  },

  /** Retrieve AI provider settings + API key. Handles migration and cache repair. */
  async getAIProviderSettings(
    providerId: string,
  ): Promise<{ settings: Omit<AIProviderSettings, 'apiKey'> | null; apiKey?: string }> {
    const db = await getDb()
    const record = await db.get('aiProviderSettings', providerId)

    // 1. Try IndexedDB (most reliable)
    let apiKey = await readKeyFromDb(aiDbId(providerId))
    if (apiKey) {
      // Re-sync localStorage cache in case it was cleared by the browser
      localStorage.setItem(LOCAL_AI_CACHE_PREFIX + providerId, apiKey)
      return { settings: record?.settings ?? null, apiKey }
    }

    // 2. Try localStorage cache (may have the key if IndexedDB was cleared)
    const cached = localStorage.getItem(LOCAL_AI_CACHE_PREFIX + providerId)
    if (cached) {
      await writeKeyToDb(aiDbId(providerId), cached, false)
      return { settings: record?.settings ?? null, apiKey: cached }
    }

    // 3. Try sessionStorage (session-only mode)
    const sessKey = sessionStorage.getItem(SESSION_AI_PREFIX + providerId)
    if (sessKey) {
      return { settings: record?.settings ?? null, apiKey: sessKey }
    }

    // 4. Migrate from legacy storage locations (one-time migration)
    apiKey = await migrateLegacyAiKey(providerId)
    if (apiKey) {
      return { settings: record?.settings ?? null, apiKey }
    }

    return { settings: record?.settings ?? null, apiKey: undefined }
  },

  async listAIProviderSettings(): Promise<StoredAIProviderSettings[]> {
    const db = await getDb()
    return db.getAll('aiProviderSettings')
  },

  async deleteAIProviderSettings(providerId: string): Promise<void> {
    const db = await getDb()
    await db.delete('aiProviderSettings', providerId)
    await deleteKeyFromDb(aiDbId(providerId))
    localStorage.removeItem(LOCAL_AI_CACHE_PREFIX + providerId)
    sessionStorage.removeItem(SESSION_AI_PREFIX + providerId)
  },

  // ---- Search provider ----------------------------------------------------

  async saveSearchProviderSettings(
    providerId: string,
    settings: Omit<SearchProviderSettings, 'apiKey'>,
    apiKey?: string,
    persistKey = true,
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
        await writeKeyToDb(searchDbId(providerId), apiKey, false)
        localStorage.setItem(LOCAL_SEARCH_CACHE_PREFIX + providerId, apiKey)
        sessionStorage.removeItem(SESSION_SEARCH_PREFIX + providerId)
      } else {
        sessionStorage.setItem(SESSION_SEARCH_PREFIX + providerId, apiKey)
        await deleteKeyFromDb(searchDbId(providerId))
        localStorage.removeItem(LOCAL_SEARCH_CACHE_PREFIX + providerId)
      }
    }
  },

  async getSearchProviderSettings(
    providerId: string,
  ): Promise<{ settings: Omit<SearchProviderSettings, 'apiKey'> | null; apiKey?: string }> {
    const db = await getDb()
    const record = await db.get('searchProviderSettings', providerId)

    let apiKey = await readKeyFromDb(searchDbId(providerId))
    if (apiKey) {
      localStorage.setItem(LOCAL_SEARCH_CACHE_PREFIX + providerId, apiKey)
      return { settings: record?.settings ?? null, apiKey }
    }

    const cached = localStorage.getItem(LOCAL_SEARCH_CACHE_PREFIX + providerId)
    if (cached) {
      await writeKeyToDb(searchDbId(providerId), cached, false)
      return { settings: record?.settings ?? null, apiKey: cached }
    }

    const sessKey = sessionStorage.getItem(SESSION_SEARCH_PREFIX + providerId)
    if (sessKey) {
      return { settings: record?.settings ?? null, apiKey: sessKey }
    }

    apiKey = await migrateLegacySearchKey(providerId)
    return { settings: record?.settings ?? null, apiKey }
  },

  async listSearchProviderSettings(): Promise<StoredSearchProviderSettings[]> {
    const db = await getDb()
    return db.getAll('searchProviderSettings')
  },

  async deleteSearchProviderSettings(providerId: string): Promise<void> {
    const db = await getDb()
    await db.delete('searchProviderSettings', providerId)
    await deleteKeyFromDb(searchDbId(providerId))
    localStorage.removeItem(LOCAL_SEARCH_CACHE_PREFIX + providerId)
    sessionStorage.removeItem(SESSION_SEARCH_PREFIX + providerId)
  },

  // ---- Global key management ----------------------------------------------

  /** Wipe every PMKS API key from IndexedDB, localStorage, and sessionStorage. */
  async clearAllKeys(): Promise<void> {
    try {
      const db = await getDb()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).clear('apiKeys')
    } catch {
      // best-effort
    }

    const clearStorage = (storage: Storage, ...prefixes: string[]) => {
      const toRemove: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i)
        if (k && prefixes.some(p => k.startsWith(p))) toRemove.push(k)
      }
      toRemove.forEach(k => storage.removeItem(k))
    }

    clearStorage(localStorage,
      LOCAL_AI_CACHE_PREFIX, LOCAL_SEARCH_CACHE_PREFIX,
      LEGACY_LOCAL_AI_PREFIX, LEGACY_LOCAL_SEARCH_PREFIX,
    )
    clearStorage(sessionStorage,
      SESSION_AI_PREFIX, SESSION_SEARCH_PREFIX,
      LEGACY_SESSION_AI_PREFIX, LEGACY_SESSION_SEARCH_PREFIX,
    )
  },

  /**
   * Synchronous check — returns true if a key is available for the given provider.
   * Checks localStorage cache (persistent keys) and sessionStorage (session-only).
   * The cache is kept in sync by saveAIProviderSettings and getAIProviderSettings.
   */
  hasAIKey(providerId: string): boolean {
    return !!(
      localStorage.getItem(LOCAL_AI_CACHE_PREFIX + providerId) ||
      sessionStorage.getItem(SESSION_AI_PREFIX + providerId) ||
      // Legacy locations (before migration runs)
      localStorage.getItem(LEGACY_LOCAL_AI_PREFIX + providerId) ||
      sessionStorage.getItem(LEGACY_SESSION_AI_PREFIX + providerId)
    )
  },

  hasSearchKey(providerId: string): boolean {
    return !!(
      localStorage.getItem(LOCAL_SEARCH_CACHE_PREFIX + providerId) ||
      sessionStorage.getItem(SESSION_SEARCH_PREFIX + providerId) ||
      localStorage.getItem(LEGACY_LOCAL_SEARCH_PREFIX + providerId) ||
      sessionStorage.getItem(LEGACY_SESSION_SEARCH_PREFIX + providerId)
    )
  },
}
