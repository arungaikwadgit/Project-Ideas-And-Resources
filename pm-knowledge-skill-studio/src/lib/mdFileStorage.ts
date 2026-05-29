import type { DomainKnowledge, Skill } from '../types'

// ---------------------------------------------------------------------------
// Lightweight YAML-frontmatter parser
// Handles: string values, booleans, inline arrays ["a", "b"]
// ---------------------------------------------------------------------------

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }

  const meta: Record<string, unknown> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim()
      meta[key] = inner
        ? inner.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''))
        : []
    } else if (val === 'true') {
      meta[key] = true
    } else if (val === 'false') {
      meta[key] = false
    } else {
      meta[key] = val.replace(/^["']|["']$/g, '')
    }
  }

  return { meta, body: match[2] }
}

function serializeArray(arr: string[]): string {
  return `[${arr.map((v) => `"${v}"`).join(', ')}]`
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ---------------------------------------------------------------------------
// DomainKnowledge  ↔  Markdown
// ---------------------------------------------------------------------------

export function domainKnowledgeToMd(dk: DomainKnowledge): string {
  const lines = [
    '---',
    `pmks_type: domain_knowledge`,
    `id: "${dk.id}"`,
    `domainKey: "${dk.domainKey}"`,
    `domainName: "${dk.domainName}"`,
    `source: ${dk.source}`,
    `selectedRoleIds: ${serializeArray(dk.selectedRoleIds)}`,
    `generatedSkillIds: ${serializeArray(dk.generatedSkillIds)}`,
    `linkedPromptPackIds: ${serializeArray(dk.linkedPromptPackIds)}`,
    `linkedPlaybookIds: ${serializeArray(dk.linkedPlaybookIds)}`,
    `tags: ${serializeArray(dk.tags)}`,
    `sourceLinks: ${serializeArray(dk.sourceLinks ?? [])}`,
    `createdAt: "${dk.createdAt}"`,
    `updatedAt: "${dk.updatedAt}"`,
    '---',
    '',
    dk.contentMarkdown,
  ]
  return lines.join('\n')
}

export function mdToDomainKnowledge(raw: string): DomainKnowledge | null {
  const { meta, body } = parseFrontmatter(raw)
  if (meta.pmks_type !== 'domain_knowledge') return null
  if (!meta.domainName) return null

  return {
    id: String(meta.id || ''),
    domainKey: String(meta.domainKey || slugify(String(meta.domainName))),
    domainName: String(meta.domainName),
    contentMarkdown: body.trimStart(),
    source: (meta.source as DomainKnowledge['source']) || 'manual',
    selectedRoleIds: (meta.selectedRoleIds as string[]) || [],
    generatedSkillIds: (meta.generatedSkillIds as string[]) || [],
    linkedPromptPackIds: (meta.linkedPromptPackIds as string[]) || [],
    linkedPlaybookIds: (meta.linkedPlaybookIds as string[]) || [],
    tags: (meta.tags as string[]) || [],
    sourceLinks: (meta.sourceLinks as string[]) || [],
    createdAt: String(meta.createdAt || new Date().toISOString()),
    updatedAt: String(meta.updatedAt || new Date().toISOString()),
  }
}

export function domainKnowledgeMdFilename(dk: Pick<DomainKnowledge, 'domainKey' | 'domainName'>): string {
  return `${dk.domainKey || slugify(dk.domainName)}.domain.md`
}

// ---------------------------------------------------------------------------
// Skill  ↔  Markdown
// ---------------------------------------------------------------------------

export function skillToMd(skill: Skill): string {
  const lines = [
    '---',
    `pmks_type: skill`,
    `id: "${skill.id}"`,
    `name: "${skill.name}"`,
    `roleId: "${skill.roleId}"`,
    `category: "${skill.category}"`,
    `maturityLevel: ${skill.maturityLevel}`,
    `isCrossDomainSkill: ${skill.isCrossDomainSkill}`,
    `linkedDomainIds: ${serializeArray(skill.linkedDomainIds)}`,
    `linkedArtifacts: ${serializeArray(skill.linkedArtifacts)}`,
    `tags: ${serializeArray(skill.tags)}`,
    `createdAt: "${skill.createdAt}"`,
    `updatedAt: "${skill.updatedAt}"`,
    '---',
    '',
    `# ${skill.name}`,
    '',
  ]

  if (skill.description) {
    lines.push('## Description', '', skill.description, '')
  }
  if (skill.evidenceNotes) {
    lines.push('## Evidence Notes', '', skill.evidenceNotes, '')
  }
  if (skill.practiceNotes) {
    lines.push('## Practice Notes', '', skill.practiceNotes, '')
  }
  if (skill.reflectionNotes) {
    lines.push('## Reflection Notes', '', skill.reflectionNotes, '')
  }

  return lines.join('\n')
}

export function mdToSkill(raw: string): Skill | null {
  const { meta, body } = parseFrontmatter(raw)
  if (meta.pmks_type !== 'skill') return null
  if (!meta.name) return null

  const section = (heading: string) => {
    const re = new RegExp(`## ${heading}\\n+([\\s\\S]*?)(?=\\n## |\\s*$)`)
    const m = body.match(re)
    return m ? m[1].trim() : ''
  }

  return {
    id: String(meta.id || ''),
    name: String(meta.name),
    roleId: String(meta.roleId || ''),
    category: String(meta.category || ''),
    maturityLevel: (meta.maturityLevel as Skill['maturityLevel']) || 'Developing',
    description: section('Description'),
    evidenceNotes: section('Evidence Notes'),
    practiceNotes: section('Practice Notes'),
    reflectionNotes: section('Reflection Notes'),
    linkedDomainIds: (meta.linkedDomainIds as string[]) || [],
    linkedArtifacts: (meta.linkedArtifacts as string[]) || [],
    isCrossDomainSkill: meta.isCrossDomainSkill === true || meta.isCrossDomainSkill === 'true',
    tags: (meta.tags as string[]) || [],
    createdAt: String(meta.createdAt || new Date().toISOString()),
    updatedAt: String(meta.updatedAt || new Date().toISOString()),
  }
}

export function skillMdFilename(skill: Pick<Skill, 'name'>): string {
  return `${slugify(skill.name)}.skill.md`
}

// ---------------------------------------------------------------------------
// Browser file I/O helpers
// ---------------------------------------------------------------------------

export function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function readMdFile(accept = '.md,.markdown'): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) { reject(new Error('No file selected')); return }
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}
