import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { Skill } from '../types'

export const skillStore = {
  async create(item: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const now = new Date().toISOString()
    const record: Skill = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('skills', record)
    return record
  },
  async update(item: Skill): Promise<Skill> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('skills', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('skills', id) },
  async getById(id: string): Promise<Skill | undefined> { return dbGetById('skills', id) },
  async list(): Promise<Skill[]> { return dbList('skills') },
  async listByRole(roleId: string): Promise<Skill[]> {
    const all = await dbList<Skill>('skills')
    return all.filter(s => s.roleId === roleId)
  },
}
