import { dbList, dbCreate } from '../stores/db'
import type {
  DomainKnowledge,
  KnowledgeNote,
  Skill,
  Playbook,
  PromptPack,
  ProjectNote,
  Decision,
  LessonLearned,
  CustomPrompt,
} from '../types'

// ---------------------------------------------------------------------------
// Bundle schema
// ---------------------------------------------------------------------------

const EXPORT_VERSION = '1.0.0'
const APP_NAME = 'PM Knowledge & Skill Studio'

interface ExportBundle {
  version: string
  exportedAt: string
  appName: string
  // API keys are NEVER included
  data: {
    domainKnowledge: DomainKnowledge[]
    knowledge: KnowledgeNote[]
    skills: Skill[]
    playbooks: Playbook[]
    promptPacks: PromptPack[]
    projectNotes: ProjectNote[]
    decisions: Decision[]
    lessons: LessonLearned[]
    customPrompts: CustomPrompt[]
  }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Reads all user data from IndexedDB, bundles it into a JSON string, and
 * returns it.  API keys are **never** included — they are not stored in
 * IndexedDB and an extra regex guard redacts any accidental `apiKey` field.
 */
export async function exportKnowledgeBundle(): Promise<string> {
  const [
    domainKnowledge,
    knowledge,
    skills,
    playbooks,
    promptPacks,
    projectNotes,
    decisions,
    lessons,
    customPrompts,
  ] = await Promise.all([
    dbList<DomainKnowledge>('domainKnowledge'),
    dbList<KnowledgeNote>('knowledge'),
    dbList<Skill>('skills'),
    dbList<Playbook>('playbooks'),
    dbList<PromptPack>('promptPacks'),
    dbList<ProjectNote>('projectNotes'),
    dbList<Decision>('decisions'),
    dbList<LessonLearned>('lessons'),
    dbList<CustomPrompt>('customPrompts'),
  ])

  const bundle: ExportBundle = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appName: APP_NAME,
    data: {
      domainKnowledge,
      knowledge,
      skills,
      playbooks,
      promptPacks,
      projectNotes,
      decisions,
      lessons,
      customPrompts,
    },
  }

  const jsonStr = JSON.stringify(bundle, null, 2)

  // Safety guard: redact any accidental apiKey field before returning
  const safeJson = jsonStr.replace(/"apiKey"\s*:\s*"[^"]*"/g, '"apiKey": "[REDACTED]"')

  return safeJson
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

type StoreKey = keyof ExportBundle['data']

const STORE_MAP: Array<{ key: StoreKey; store: Parameters<typeof dbCreate>[0] }> = [
  { key: 'domainKnowledge', store: 'domainKnowledge' },
  { key: 'knowledge', store: 'knowledge' },
  { key: 'skills', store: 'skills' },
  { key: 'playbooks', store: 'playbooks' },
  { key: 'promptPacks', store: 'promptPacks' },
  { key: 'projectNotes', store: 'projectNotes' },
  { key: 'decisions', store: 'decisions' },
  { key: 'lessons', store: 'lessons' },
  { key: 'customPrompts', store: 'customPrompts' },
]

export interface ImportResult {
  imported: number
  errors: string[]
}

/**
 * Parses a JSON export bundle and upserts every record into IndexedDB.
 * Items that already exist by ID are overwritten (put semantics).
 * Returns the count of successfully imported records and any error messages.
 */
export async function importKnowledgeBundle(jsonString: string): Promise<ImportResult> {
  const errors: string[] = []

  // 1. Parse JSON
  let bundle: ExportBundle
  try {
    bundle = JSON.parse(jsonString) as ExportBundle
  } catch {
    throw new Error('Invalid JSON: Could not parse the import file.')
  }

  // 2. Validate bundle shape
  if (!bundle.version || !bundle.data || !bundle.appName) {
    throw new Error('Invalid bundle: Missing required fields (version, appName, data).')
  }

  if (bundle.appName !== APP_NAME) {
    errors.push(
      `Warning: Bundle was exported from "${bundle.appName}", not ${APP_NAME}. Importing anyway.`,
    )
  }

  // 3. Import each store
  let imported = 0

  for (const { key, store } of STORE_MAP) {
    const items = bundle.data[key]
    if (!Array.isArray(items)) continue

    for (const item of items) {
      try {
        await dbCreate(store, item)
        imported++
      } catch {
        const id = (item as { id?: string }).id ?? 'unknown'
        errors.push(`Failed to import ${key} item: ${id}`)
      }
    }
  }

  return { imported, errors }
}

// ---------------------------------------------------------------------------
// Utility: trigger browser download
// ---------------------------------------------------------------------------

/**
 * Creates a temporary anchor element to trigger a file download in the
 * browser.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'application/json',
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
