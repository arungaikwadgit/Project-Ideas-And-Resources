import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { DomainKnowledge } from '../types'

export const domainKnowledgeStore = {
  async create(item: Omit<DomainKnowledge, 'id' | 'createdAt' | 'updatedAt'>): Promise<DomainKnowledge> {
    const now = new Date().toISOString()
    const record: DomainKnowledge = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('domainKnowledge', record)
    return record
  },
  async update(item: DomainKnowledge): Promise<DomainKnowledge> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('domainKnowledge', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('domainKnowledge', id) },
  async getById(id: string): Promise<DomainKnowledge | undefined> { return dbGetById('domainKnowledge', id) },
  async list(): Promise<DomainKnowledge[]> { return dbList('domainKnowledge') },
}
