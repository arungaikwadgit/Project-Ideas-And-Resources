import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type {
  DomainKnowledge,
  KnowledgeNote,
  WorkStyle,
  Skill,
  Playbook,
  PromptPack,
  AIRun,
  ProjectNote,
  Project,
  Decision,
  LessonLearned,
  ActivityEvent,
  StoredAIProviderSettings,
  StoredSearchProviderSettings,
  CustomPrompt,
} from '../types'

const DB_NAME = 'pm-knowledge-skill-studio'
const DB_VERSION = 3

interface PMKSSchema extends DBSchema {
  domainKnowledge: { key: string; value: DomainKnowledge; indexes: { 'by-domainKey': string; 'by-updatedAt': string } }
  knowledge: { key: string; value: KnowledgeNote; indexes: { 'by-updatedAt': string } }
  workStyle: { key: string; value: WorkStyle }
  skills: { key: string; value: Skill; indexes: { 'by-roleId': string; 'by-updatedAt': string } }
  playbooks: { key: string; value: Playbook; indexes: { 'by-updatedAt': string } }
  promptPacks: { key: string; value: PromptPack; indexes: { 'by-updatedAt': string } }
  aiRuns: { key: string; value: AIRun; indexes: { 'by-status': string; 'by-createdAt': string } }
  projectNotes: { key: string; value: ProjectNote; indexes: { 'by-updatedAt': string } }
  decisions: { key: string; value: Decision; indexes: { 'by-status': string; 'by-updatedAt': string } }
  lessons: { key: string; value: LessonLearned; indexes: { 'by-category': string; 'by-updatedAt': string } }
  activityEvents: { key: string; value: ActivityEvent; indexes: { 'by-eventType': string; 'by-createdAt': string } }
  aiProviderSettings: { key: string; value: StoredAIProviderSettings }
  searchProviderSettings: { key: string; value: StoredSearchProviderSettings }
  customPrompts: { key: string; value: CustomPrompt; indexes: { 'by-basePromptId': string } }
  settings: { key: string; value: { id: string; value: unknown } }
  projects: { key: string; value: Project; indexes: { 'by-name': string; 'by-updatedAt': string } }
  // API keys stored in IndexedDB as the primary persistent store.
  // id = 'ai_<providerId>' or 'search_<providerId>'
  apiKeys: { key: string; value: { id: string; apiKey: string; sessionOnly: boolean; updatedAt: string } }
}

let dbInstance: IDBPDatabase<PMKSSchema> | null = null

export async function getDb(): Promise<IDBPDatabase<PMKSSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<PMKSSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const dkStore = db.createObjectStore('domainKnowledge', { keyPath: 'id' })
        dkStore.createIndex('by-domainKey', 'domainKey')
        dkStore.createIndex('by-updatedAt', 'updatedAt')

        const kStore = db.createObjectStore('knowledge', { keyPath: 'id' })
        kStore.createIndex('by-updatedAt', 'updatedAt')

        db.createObjectStore('workStyle', { keyPath: 'id' })

        const skillStore = db.createObjectStore('skills', { keyPath: 'id' })
        skillStore.createIndex('by-roleId', 'roleId')
        skillStore.createIndex('by-updatedAt', 'updatedAt')

        const pbStore = db.createObjectStore('playbooks', { keyPath: 'id' })
        pbStore.createIndex('by-updatedAt', 'updatedAt')

        const ppStore = db.createObjectStore('promptPacks', { keyPath: 'id' })
        ppStore.createIndex('by-updatedAt', 'updatedAt')

        const arStore = db.createObjectStore('aiRuns', { keyPath: 'id' })
        arStore.createIndex('by-status', 'status')
        arStore.createIndex('by-createdAt', 'createdAt')

        const pnStore = db.createObjectStore('projectNotes', { keyPath: 'id' })
        pnStore.createIndex('by-updatedAt', 'updatedAt')

        const decStore = db.createObjectStore('decisions', { keyPath: 'id' })
        decStore.createIndex('by-status', 'status')
        decStore.createIndex('by-updatedAt', 'updatedAt')

        const lessonStore = db.createObjectStore('lessons', { keyPath: 'id' })
        lessonStore.createIndex('by-category', 'category')
        lessonStore.createIndex('by-updatedAt', 'updatedAt')

        const actStore = db.createObjectStore('activityEvents', { keyPath: 'id' })
        actStore.createIndex('by-eventType', 'eventType')
        actStore.createIndex('by-createdAt', 'createdAt')

        db.createObjectStore('aiProviderSettings', { keyPath: 'id' })
        db.createObjectStore('searchProviderSettings', { keyPath: 'id' })

        const cpStore = db.createObjectStore('customPrompts', { keyPath: 'id' })
        cpStore.createIndex('by-basePromptId', 'basePromptId')

        db.createObjectStore('settings', { keyPath: 'id' })
      }
      if (oldVersion < 2) {
        const projStore = db.createObjectStore('projects', { keyPath: 'id' })
        projStore.createIndex('by-name', 'name')
        projStore.createIndex('by-updatedAt', 'updatedAt')
      }
      if (oldVersion < 3) {
        db.createObjectStore('apiKeys', { keyPath: 'id' })
      }
    },
  })

  return dbInstance
}

export type PMKSStoreName =
  | 'domainKnowledge' | 'knowledge' | 'workStyle' | 'skills' | 'playbooks'
  | 'promptPacks' | 'aiRuns' | 'projectNotes' | 'decisions' | 'lessons'
  | 'activityEvents' | 'aiProviderSettings' | 'searchProviderSettings'
  | 'customPrompts' | 'settings' | 'projects' | 'apiKeys'

// We cast to `unknown` then to the typed parameter to bridge IDBPDatabase generic constraints.
function asDb(db: IDBPDatabase<PMKSSchema>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db as IDBPDatabase<any>
}

export async function dbCreate<T>(storeName: PMKSStoreName, item: T): Promise<void> {
  const db = asDb(await getDb())
  await db.put(storeName, item)
}

export async function dbUpdate<T>(storeName: PMKSStoreName, item: T): Promise<void> {
  const db = asDb(await getDb())
  await db.put(storeName, item)
}

export async function dbDelete(storeName: PMKSStoreName, id: string): Promise<void> {
  const db = asDb(await getDb())
  await db.delete(storeName, id)
}

export async function dbGetById<T>(storeName: PMKSStoreName, id: string): Promise<T | undefined> {
  const db = asDb(await getDb())
  return db.get(storeName, id) as unknown as T | undefined
}

export async function dbList<T>(storeName: PMKSStoreName): Promise<T[]> {
  const db = asDb(await getDb())
  return (await db.getAll(storeName)) as T[]
}

export async function dbClear(storeName: PMKSStoreName): Promise<void> {
  const db = asDb(await getDb())
  await db.clear(storeName)
}
