import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { KnowledgeNote } from '../types'

export const knowledgeStore = {
  async create(item: Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeNote> {
    const now = new Date().toISOString()
    const record: KnowledgeNote = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('knowledge', record)
    return record
  },
  async update(item: KnowledgeNote): Promise<KnowledgeNote> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('knowledge', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('knowledge', id) },
  async getById(id: string): Promise<KnowledgeNote | undefined> { return dbGetById('knowledge', id) },
  async list(): Promise<KnowledgeNote[]> { return dbList('knowledge') },
}
