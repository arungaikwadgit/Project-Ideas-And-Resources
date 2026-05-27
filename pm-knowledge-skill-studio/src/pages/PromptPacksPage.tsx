import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Copy, X, Zap, Eye } from 'lucide-react'
import type { PromptPack, PromptPackCatalogItem } from '../types'
import { promptPackStore } from '../stores/promptPackStore'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'

interface Role { id: string; name: string }
interface Phase { id: string; name: string }

function buildPromptMarkdown(pack: Partial<PromptPack>): string {
  const lines: string[] = []
  if (pack.title) lines.push(`# ${pack.title}`, '')
  if (pack.goalStatement) lines.push(`## Goal`, '', pack.goalStatement, '')
  if (pack.systemRole) lines.push(`## System Role`, '', pack.systemRole, '')
  if (pack.instructionSteps && pack.instructionSteps.length > 0) {
    lines.push('## Instructions', '')
    pack.instructionSteps.forEach((step, i) => lines.push(`${i + 1}. ${step}`))
    lines.push('')
  }
  if (pack.desiredOutputFormat) lines.push('## Desired Output Format', '', pack.desiredOutputFormat, '')
  if (pack.qualityChecklist && pack.qualityChecklist.length > 0) {
    lines.push('## Quality Checklist', '')
    pack.qualityChecklist.forEach((item) => lines.push(`- [ ] ${item}`))
    lines.push('')
  }
  return lines.join('\n')
}

const EMPTY_PACK = (): Omit<PromptPack, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: '',
  category: '',
  targetRoleIds: [],
  phaseId: '',
  taskId: '',
  systemRole: '',
  goalStatement: '',
  domainContextIds: [],
  workStyleSectionIds: [],
  skillIds: [],
  playbookIds: [],
  projectNoteIds: [],
  decisionIds: [],
  lessonIds: [],
  instructionSteps: [],
  desiredOutputFormat: '',
  qualityChecklist: [],
  governanceChecklist: [],
  tags: [],
})

export default function PromptPacksPage() {
  const [packs, setPacks] = useState<PromptPack[]>([])
  const [catalog, setCatalog] = useState<PromptPackCatalogItem[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [activeSection, setActiveSection] = useState<'mine' | 'templates'>('mine')
  const [editingPack, setEditingPack] = useState<Partial<PromptPack> | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PromptPack | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [hasAIProvider, setHasAIProvider] = useState(false)
  const [stepInput, setStepInput] = useState('')
  const [checkInput, setCheckInput] = useState('')

  const loadPacks = useCallback(async () => {
    const all = await promptPackStore.list()
    setPacks(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  useEffect(() => {
    loadPacks()
    fetch('/pm-knowledge-skill-studio/config/promptPackCatalog.json').then((r) => r.json()).then(setCatalog).catch(() => {})
    fetch('/pm-knowledge-skill-studio/config/roles.json').then((r) => r.json()).then(setRoles).catch(() => {})
    fetch('/pm-knowledge-skill-studio/config/sdlcPhases.json').then((r) => r.json()).then(setPhases).catch(() => {})
    import('../stores/db').then(({ dbList }) => dbList('aiProviderSettings').then((s) => setHasAIProvider((s as unknown[]).length > 0)))
  }, [loadPacks])

  const allCategories = [...new Set([...packs.map((p) => p.category), ...catalog.map((c) => c.category)].filter(Boolean))].sort()

  const filteredPacks = packs.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    return matchSearch && (!filterCategory || p.category === filterCategory)
  })

  const filteredCatalog = catalog.filter((c) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    return matchSearch && (!filterCategory || c.category === filterCategory)
  })

  const openEdit = (pack: PromptPack) => {
    setIsNew(false)
    setEditId(pack.id)
    setEditingPack({ ...pack })
    setShowPreview(false)
  }

  const openCreate = () => {
    setIsNew(true)
    setEditId(null)
    setEditingPack(EMPTY_PACK())
    setShowPreview(false)
  }

  const copyFromTemplate = (tmpl: PromptPackCatalogItem) => {
    setIsNew(true)
    setEditId(null)
    setEditingPack({
      title: tmpl.title + ' (Copy)',
      description: tmpl.description,
      category: tmpl.category,
      targetRoleIds: tmpl.targetRoleIds,
      phaseId: tmpl.phaseId,
      systemRole: tmpl.systemRole,
      goalStatement: tmpl.goalStatement,
      instructionSteps: [...tmpl.instructionSteps],
      desiredOutputFormat: tmpl.desiredOutputFormat,
      qualityChecklist: [...tmpl.qualityChecklist],
      governanceChecklist: [...tmpl.governanceChecklist],
      tags: [...tmpl.tags],
      domainContextIds: [], workStyleSectionIds: [], skillIds: [], playbookIds: [],
      projectNoteIds: [], decisionIds: [], lessonIds: [], taskId: '',
    })
    setActiveSection('mine')
  }

  const handleSave = async () => {
    if (!editingPack) return
    setSaving(true)
    try {
      const md = buildPromptMarkdown(editingPack)
      if (isNew) {
        await promptPackStore.create({ ...EMPTY_PACK(), ...editingPack, builtPromptMarkdown: md })
      } else if (editId) {
        const existing = packs.find((p) => p.id === editId)
        if (existing) await promptPackStore.update({ ...existing, ...editingPack, builtPromptMarkdown: md })
      }
      await loadPacks()
      setIsNew(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await promptPackStore.delete(deleteTarget.id)
    setDeleteTarget(null)
    if (editId === deleteTarget.id) { setEditingPack(null); setEditId(null) }
    await loadPacks()
  }

  const upd = (patch: Partial<PromptPack>) => setEditingPack((prev) => prev ? { ...prev, ...patch } : prev)

  const addStep = () => {
    if (!stepInput.trim()) return
    upd({ instructionSteps: [...(editingPack?.instructionSteps ?? []), stepInput.trim()] })
    setStepInput('')
  }

  const removeStep = (i: number) => upd({ instructionSteps: (editingPack?.instructionSteps ?? []).filter((_, idx) => idx !== i) })

  const addCheck = () => {
    if (!checkInput.trim()) return
    upd({ qualityChecklist: [...(editingPack?.qualityChecklist ?? []), checkInput.trim()] })
    setCheckInput('')
  }

  const removeCheck = (i: number) => upd({ qualityChecklist: (editingPack?.qualityChecklist ?? []).filter((_, idx) => idx !== i) })

  const toggleRole = (roleId: string) => {
    const cur = editingPack?.targetRoleIds ?? []
    upd({ targetRoleIds: cur.includes(roleId) ? cur.filter((r) => r !== roleId) : [...cur, roleId] })
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Prompt Packs</h1>
          <p className="text-muted text-sm">{packs.length} custom pack{packs.length !== 1 ? 's' : ''}, {catalog.length} templates</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Prompt Pack</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search prompt packs..." />
        </div>
        <select className="select" style={{ width: 'auto' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingPack ? '300px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* List */}
        <div>
          <div className="tab-list">
            <button className={`tab-item${activeSection === 'mine' ? ' tab-item-active' : ''}`} onClick={() => setActiveSection('mine')}>My Packs ({packs.length})</button>
            <button className={`tab-item${activeSection === 'templates' ? ' tab-item-active' : ''}`} onClick={() => setActiveSection('templates')}>Templates ({catalog.length})</button>
          </div>

          {activeSection === 'mine' ? (
            filteredPacks.length === 0 ? (
              <EmptyState title="No prompt packs yet" description="Create one or copy a starter template." action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Prompt Pack</button>} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredPacks.map((pack) => (
                  <div key={pack.id} className="card card-clickable" style={{ borderColor: editId === pack.id ? 'rgba(74,163,255,0.5)' : undefined, background: editId === pack.id ? 'rgba(74,163,255,0.06)' : undefined }} onClick={() => openEdit(pack)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }} className="truncate">{pack.title}</div>
                        <div className="text-xs text-muted">{pack.category}</div>
                        <p className="text-sm text-muted line-clamp-2" style={{ margin: '0.25rem 0 0' }}>{pack.description}</p>
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)', flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(pack) }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredCatalog.length === 0 ? (
              <EmptyState title="No templates found" description="Try adjusting your search." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredCatalog.map((tmpl) => (
                  <div key={tmpl.id} className="card">
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{tmpl.title}</div>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.375rem' }}>{tmpl.category}</div>
                    <p className="text-sm text-muted line-clamp-2" style={{ margin: '0 0 0.75rem' }}>{tmpl.description}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyFromTemplate(tmpl)}><Copy size={13} /> Copy to My Packs</button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Editor */}
        {editingPack && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{isNew ? 'New Prompt Pack' : 'Edit Prompt Pack'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview((p) => !p)}><Eye size={13} /> {showPreview ? 'Edit' : 'Preview'}</button>
                <button className="btn btn-primary btn-sm" disabled={!hasAIProvider} title={!hasAIProvider ? 'Configure AI provider first' : undefined}><Zap size={13} /> Run</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingPack(null); setEditId(null); setIsNew(false) }}><X size={14} /></button>
              </div>
            </div>

            {showPreview ? (
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', minHeight: 300 }}>
                <MarkdownPreview content={buildPromptMarkdown(editingPack)} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="input" value={editingPack.title ?? ''} onChange={(e) => upd({ title: e.target.value })} placeholder="Prompt pack title" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="input" value={editingPack.category ?? ''} onChange={(e) => upd({ category: e.target.value })} placeholder="e.g. Discovery, Delivery" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">SDLC Phase</label>
                    <select className="select" value={editingPack.phaseId ?? ''} onChange={(e) => upd({ phaseId: e.target.value })}>
                      <option value="">Select phase...</option>
                      {phases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="textarea" value={editingPack.description ?? ''} onChange={(e) => upd({ description: e.target.value })} rows={2} placeholder="Describe this prompt pack..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Roles</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {roles.map((r) => (
                      <button key={r.id} type="button" className={`tag${(editingPack.targetRoleIds ?? []).includes(r.id) ? ' tag-active' : ''}`} onClick={() => toggleRole(r.id)} style={{ cursor: 'pointer', border: '1px solid' }}>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">System Role</label>
                  <textarea className="textarea" value={editingPack.systemRole ?? ''} onChange={(e) => upd({ systemRole: e.target.value })} rows={2} placeholder="You are a..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Goal Statement</label>
                  <textarea className="textarea" value={editingPack.goalStatement ?? ''} onChange={(e) => upd({ goalStatement: e.target.value })} rows={2} placeholder="The goal of this prompt is to..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Instructions ({(editingPack.instructionSteps ?? []).length})</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="input" value={stepInput} onChange={(e) => setStepInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())} placeholder="Add instruction step..." style={{ flex: 1 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addStep}><Plus size={13} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {(editingPack.instructionSteps ?? []).map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0, marginTop: '0.125rem' }}>{i + 1}.</span>
                        <span style={{ flex: 1, fontSize: '0.875rem' }}>{step}</span>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={() => removeStep(i)}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Desired Output Format</label>
                  <textarea className="textarea" value={editingPack.desiredOutputFormat ?? ''} onChange={(e) => upd({ desiredOutputFormat: e.target.value })} rows={2} placeholder="Describe the format of the expected output..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Quality Checklist ({(editingPack.qualityChecklist ?? []).length})</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input className="input" value={checkInput} onChange={(e) => setCheckInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheck())} placeholder="Add quality check..." style={{ flex: 1 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addCheck}><Plus size={13} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {(editingPack.qualityChecklist ?? []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8125rem', flex: 1 }}>☐ {item}</span>
                        <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={() => removeCheck(i)}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Prompt Pack"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
