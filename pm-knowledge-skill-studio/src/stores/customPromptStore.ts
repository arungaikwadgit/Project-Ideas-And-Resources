import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { CustomPrompt } from '../types'

export const customPromptStore = {
  async create(item: Omit<CustomPrompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomPrompt> {
    const now = new Date().toISOString()
    const record: CustomPrompt = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('customPrompts', record)
    return record
  },
  async update(item: CustomPrompt): Promise<CustomPrompt> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('customPrompts', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('customPrompts', id) },
  async getById(id: string): Promise<CustomPrompt | undefined> { return dbGetById('customPrompts', id) },
  async list(): Promise<CustomPrompt[]> { return dbList('customPrompts') },
  async getByBasePromptId(basePromptId: string): Promise<CustomPrompt | undefined> {
    const all = await dbList<CustomPrompt>('customPrompts')
    return all.find((cp) => cp.basePromptId === basePromptId)
  },
}
