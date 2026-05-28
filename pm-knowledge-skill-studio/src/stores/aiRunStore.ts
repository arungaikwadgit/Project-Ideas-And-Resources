import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { AIRun } from '../types'

export const aiRunStore = {
  async create(item: Omit<AIRun, 'id' | 'createdAt'>): Promise<AIRun> {
    const record: AIRun = { ...item, id: uuid(), createdAt: new Date().toISOString() }
    await dbCreate('aiRuns', record)
    return record
  },
  async update(item: AIRun): Promise<AIRun> { await dbUpdate('aiRuns', item); return item },
  async delete(id: string): Promise<void> { await dbDelete('aiRuns', id) },
  async getById(id: string): Promise<AIRun | undefined> { return dbGetById('aiRuns', id) },
  async list(): Promise<AIRun[]> { return dbList('aiRuns') },
}
