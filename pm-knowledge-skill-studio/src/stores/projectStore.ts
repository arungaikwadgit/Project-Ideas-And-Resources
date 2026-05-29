import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { Project } from '../types'

export const projectStore = {
  async create(item: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date().toISOString()
    const record: Project = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('projects', record)
    return record
  },
  async update(item: Project): Promise<Project> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('projects', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('projects', id) },
  async getById(id: string): Promise<Project | undefined> { return dbGetById('projects', id) },
  async list(): Promise<Project[]> { return dbList('projects') },
}
