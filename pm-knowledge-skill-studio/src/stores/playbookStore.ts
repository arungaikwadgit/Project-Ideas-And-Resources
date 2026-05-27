import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbGetById, dbList } from './db'
import type { Playbook } from '../types'

export const playbookStore = {
  async create(item: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playbook> {
    const now = new Date().toISOString()
    const record: Playbook = { ...item, id: uuid(), createdAt: now, updatedAt: now }
    await dbCreate('playbooks', record)
    return record
  },
  async update(item: Playbook): Promise<Playbook> {
    const updated = { ...item, updatedAt: new Date().toISOString() }
    await dbUpdate('playbooks', updated)
    return updated
  },
  async delete(id: string): Promise<void> { await dbDelete('playbooks', id) },
  async getById(id: string): Promise<Playbook | undefined> { return dbGetById('playbooks', id) },
  async list(): Promise<Playbook[]> { return dbList('playbooks') },
}
