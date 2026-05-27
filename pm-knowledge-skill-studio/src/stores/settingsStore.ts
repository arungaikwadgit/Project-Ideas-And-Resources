import { getDb } from './db'

export const settingsStore = {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await getDb()
    const record = await db.get('settings', key)
    return record?.value as T | undefined
  },

  async set<T>(key: string, value: T): Promise<void> {
    const db = await getDb()
    await db.put('settings', { id: key, value })
  },

  async delete(key: string): Promise<void> {
    const db = await getDb()
    await db.delete('settings', key)
  },
}
