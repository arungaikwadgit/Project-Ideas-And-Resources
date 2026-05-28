import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { PromptPack } from '../types'

export const promptPackStore = {
  async create(item: Omit<PromptPack, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptPack> {
    const now = new Date().toISOString()
    const record: PromptPack = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('promptPacks', record)
    return record
  },
  async update(item: PromptPack): Promise<PromptPack> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('promptPacks', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('promptPacks', id) },
  async getById(id: string): Promise<PromptPack | undefined> { return dbGetById('promptPacks', id) },
  async list(): Promise<PromptPack[]> { return dbList('promptPacks') },
}
