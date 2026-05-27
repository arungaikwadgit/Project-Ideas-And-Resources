import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, BookOpen, Copy, ChevronRight, X, ArrowUp, ArrowDown } from 'lucide-react'
import { playbookStore } from '../stores/playbookStore'
import type { Playbook, PlaybookStep, PlaybookCatalogItem } from '../types'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import { v4 as uuid } from 'uuid'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function buildPlaybookMarkdown(playbook: Partial<Playbook>): string {
  const lines: string[] = [`# ${playbook.title || 'Untitled Playbook'}`, '']
  if (playbook.description) lines.push(playbook.description, '')
  if (playbook.category) lines.push(`**Category:** ${playbook.category}`, '')
  if (playbook.roles && playbook.roles.length > 0) lines.push(`**Roles:** ${playbook.roles.join(', ')}`, '')
  if (playbook.phases && playbook.phases.length > 0) lines.push(`**Phases:** ${playbook.phases.join(', ')}`, '')
  if (playbook.steps && playbook.steps.length > 0) {
    lines.push('## Steps', '')
    playbook.steps.forEach((step, i) => {
      lines.push(`### Step ${i + 1}: ${step.title}`)
      if (step.description) lines.push('', step.description)
      lines.push('')
    })
  }
  if (playbook.tags && playbook.tags.length > 0) lines.push(`**Tags:** ${playbook.tags.join(', ')}`, '')
  return lines.join('\n')
}

const CATEGORIES = ['Discovery', 'Planning', 'Delivery', 'Release', 'Retrospective', 'Risk', 'Stakeholder', 'Governance', 'AI', 'Operations']

const EMPTY_PLAYBOOK = (): Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: '',
  category: '',
  phases: [],
  roles: [],
  steps: [],
  tags: [],
  contentMarkdown: '',
  linkedDomainIds: [],
  linkedSkillIds: [],
  isCustom: true,
})

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [catalog, setCatalog] = useState<PlaybookCatalogItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [activeSection, setActiveSection] = useState<'mine' | 'templates'>('mine')
  const [selectedPlaybook, setSelectedPlaybook] = useState<Partial<Playbook> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Playbook | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  const loadPlaybooks = useCallback(async () => {
    const all = await playbookStore.list()
    setPlaybooks(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  useEffect(() => {
    loadPlaybooks()
    fetch('/pm-knowledge-skill-studio/config/playbookCatalog.json')
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {})
  }, [loadPlaybooks])

  const allCategories = [...new Set([
    ...playbooks.map((p) => p.category),
    ...catalog.map((c) => c.category),
  ].filter(Boolean))].sort()

  const filteredPlaybooks = playbooks.filter((p) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    const matchCat = !filterCategory || p.category === filterCategory
    return matchSearch && matchCat
  })

  const filteredCatalog = catalog.filter((c) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    const matchCat = !filterCategory || c.category === filterCategory
    return matchSearch && matchCat
  })

  const openEdit = (playbook: Playbook) => {
    setIsNew(false)
    setEditId(playbook.id)
    setSelectedPlaybook({ ...playbook })
    setActiveTab('editor')
  }

  const openCreate = () => {
    setIsNew(true)
    setEditId(null)
    setSelectedPlaybook(EMPTY_PLAYBOOK())
    setActiveTab('editor')
  }

  const closeEditor = () => {
    setSelectedPlaybook(null)
    setEditId(null)
    setIsNew(false)
  }

  const copyFromTemplate = (template: PlaybookCatalogItem) => {
    setIsNew(true)
    setEditId(null)
    setSelectedPlaybook({
      title: template.title + ' (Copy)',
      description: template.description,
      category: template.category,
      phases: template.phases,
      roles: template.roles,
      steps: template.steps.map((s) => ({ ...s })),
      tags: [...template.tags],
      contentMarkdown: '',
      linkedDomainIds: [],
      linkedSkillIds: [],
      isCustom: true,
    })
    setActiveSection('mine')
    setActiveTab('editor')
  }

  const handleSave = async () => {
    if (!selectedPlaybook || !selectedPlaybook.title?.trim()) return
    setSaving(true)
    try {
      const md = buildPlaybookMarkdown(selectedPlaybook)
      if (isNew) {
        await playbookStore.create({ ...EMPTY_PLAYBOOK(), ...selectedPlaybook, contentMarkdown: md })
      } else if (editId) {
        const existing = playbooks.find((p) => p.id === editId)
        if (existing) await playbookStore.update({ ...existing, ...selectedPlaybook, contentMarkdown: md })
      }
      await loadPlaybooks()
      setIsNew(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await playbookStore.delete(deleteTarget.id)
    setDeleteTarget(null)
    if (editId === deleteTarget.id) closeEditor()
    await loadPlaybooks()
  }

  const addStep = () => {
    const newStep: PlaybookStep = {
      id: uuid(),
      title: '',
      description: '',
      order: (selectedPlaybook?.steps?.length ?? 0) + 1,
    }
    setSelectedPlaybook((prev) => prev ? { ...prev, steps: [...(prev.steps ?? []), newStep] } : prev)
  }

  const updateStep = (stepId: string, patch: Partial<PlaybookStep>) => {
    setSelectedPlaybook((prev) =>
      prev ? { ...prev, steps: (prev.steps ?? []).map((s) => s.id === stepId ? { ...s, ...patch } : s) } : prev
    )
  }

  const removeStep = (stepId: string) => {
    setSelectedPlaybook((prev) =>
      prev ? { ...prev, steps: (prev.steps ?? []).filter((s) => s.id !== stepId) } : prev
    )
  }

  const moveStep = (stepId: string, dir: 'up' | 'down') => {
    setSelectedPlaybook((prev) => {
      if (!prev?.steps) return prev
      const steps = [...prev.steps]
      const idx = steps.findIndex((s) => s.id === stepId)
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= steps.length) return prev
      ;[steps[idx], steps[target]] = [steps[target], steps[idx]]
      return { ...prev, steps }
    })
  }

  const upd = (patch: Partial<Playbook>) =>
    setSelectedPlaybook((prev) => prev ? { ...prev, ...patch } : prev)

  return (
    <div className="page-container">
      <PageHeader
        title="Playbooks"
        subtitle={`${playbooks.length} custom playbook${playbooks.length !== 1 ? 's' : ''} · ${catalog.length} starter templates`}
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> New Playbook
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          style={{ flex: 1, minWidth: 180 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search playbooks..."
        />
        <select
          className="select"
          style={{ width: 'auto' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedPlaybook ? '320px 1fr' : '1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* List panel                                                          */}
        {/* ------------------------------------------------------------------ */}
        <div>
          <div className="tab-list" style={{ marginBottom: '1rem' }}>
            <button
              className={`tab-item${activeSection === 'mine' ? ' tab-item-active' : ''}`}
              onClick={() => setActiveSection('mine')}
            >
              My Playbooks ({playbooks.length})
            </button>
            <button
              className={`tab-item${activeSection === 'templates' ? ' tab-item-active' : ''}`}
              onClick={() => setActiveSection('templates')}
            >
              Templates ({catalog.length})
            </button>
          </div>

          {activeSection === 'mine' ? (
            filteredPlaybooks.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={40} />}
                title="No playbooks yet"
                description="Create a playbook from scratch or copy a starter template to get started."
                action={
                  <button className="btn btn-primary" onClick={openCreate}>
                    <Plus size={14} /> New Playbook
                  </button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredPlaybooks.map((pb) => (
                  <div
                    key={pb.id}
                    className="card card-clickable"
                    style={{
                      borderColor: editId === pb.id ? 'rgba(74,163,255,0.5)' : undefined,
                      background: editId === pb.id ? 'rgba(74,163,255,0.06)' : undefined,
                    }}
                    onClick={() => openEdit(pb)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }} className="truncate">{pb.title}</div>
                        <div className="text-xs text-muted" style={{ margin: '0.15rem 0 0.25rem' }}>
                          {pb.category && <span className="badge" style={{ marginRight: '0.375rem' }}>{pb.category}</span>}
                          {pb.steps.length} step{pb.steps.length !== 1 ? 's' : ''} · {formatDate(pb.updatedAt)}
                        </div>
                        {pb.description && (
                          <p className="text-sm text-muted line-clamp-2" style={{ margin: 0 }}>{pb.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={(e) => { e.stopPropagation(); openEdit(pb) }}
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--error)' }}
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(pb) }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredCatalog.length === 0 ? (
              <EmptyState
                title="No templates found"
                description="Try adjusting your search or category filter."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredCatalog.map((tmpl) => (
                  <div key={tmpl.id} className="card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{tmpl.title}</div>
                      <ChevronRight size={14} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} />
                    </div>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.375rem' }}>
                      <span className="badge" style={{ marginRight: '0.375rem' }}>{tmpl.category}</span>
                      {tmpl.steps.length} step{tmpl.steps.length !== 1 ? 's' : ''}
                    </div>
                    <p className="text-sm text-muted line-clamp-2" style={{ margin: '0 0 0.75rem' }}>{tmpl.description}</p>
                    <button className="btn btn-secondary btn-sm" onClick={() => copyFromTemplate(tmpl)}>
                      <Copy size={13} /> Use Template
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Editor panel                                                        */}
        {/* ------------------------------------------------------------------ */}
        {selectedPlaybook && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            {/* Editor header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{isNew ? 'New Playbook' : 'Edit Playbook'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="tab-list" style={{ marginBottom: 0, borderBottom: 'none' }}>
                  <button
                    className={`tab-item${activeTab === 'editor' ? ' tab-item-active' : ''}`}
                    onClick={() => setActiveTab('editor')}
                  >
                    Editor
                  </button>
                  <button
                    className={`tab-item${activeTab === 'preview' ? ' tab-item-active' : ''}`}
                    onClick={() => setActiveTab('preview')}
                  >
                    Preview
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={saving || !selectedPlaybook.title?.trim()}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={closeEditor} title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {activeTab === 'preview' ? (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem',
                  minHeight: 300,
                }}
              >
                <MarkdownPreview content={buildPlaybookMarkdown(selectedPlaybook)} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    className="input"
                    value={selectedPlaybook.title ?? ''}
                    onChange={(e) => upd({ title: e.target.value })}
                    placeholder="Playbook title"
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="select"
                    value={selectedPlaybook.category ?? ''}
                    onChange={(e) => upd({ category: e.target.value })}
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="textarea"
                    value={selectedPlaybook.description ?? ''}
                    onChange={(e) => upd({ description: e.target.value })}
                    placeholder="Describe the purpose and goals of this playbook..."
                    rows={3}
                  />
                </div>

                {/* Tags */}
                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    className="input"
                    value={(selectedPlaybook.tags ?? []).join(', ')}
                    onChange={(e) =>
                      upd({
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. planning, agile, discovery"
                  />
                </div>

                {/* Steps */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <label className="form-label" style={{ margin: 0 }}>
                      Steps ({(selectedPlaybook.steps ?? []).length})
                    </label>
                    <button className="btn btn-secondary btn-sm" onClick={addStep}>
                      <Plus size={13} /> Add Step
                    </button>
                  </div>

                  {(selectedPlaybook.steps ?? []).length === 0 ? (
                    <div
                      style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--muted)',
                        fontSize: '0.875rem',
                      }}
                    >
                      No steps yet. Click "Add Step" to begin building your playbook.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(selectedPlaybook.steps ?? []).map((step, i) => (
                        <div key={step.id} className="panel" style={{ padding: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                color: '#0b1220',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                flexShrink: 0,
                                marginTop: '0.25rem',
                              }}
                            >
                              {i + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <input
                                className="input"
                                value={step.title}
                                onChange={(e) => updateStep(step.id, { title: e.target.value })}
                                placeholder={`Step ${i + 1} title`}
                                style={{ marginBottom: '0.5rem' }}
                              />
                              <textarea
                                className="textarea"
                                value={step.description}
                                onChange={(e) => updateStep(step.id, { description: e.target.value })}
                                placeholder="Describe what to do in this step..."
                                rows={2}
                                style={{ minHeight: 60 }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => moveStep(step.id, 'up')}
                                disabled={i === 0}
                                title="Move up"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                onClick={() => moveStep(step.id, 'down')}
                                disabled={i === (selectedPlaybook.steps?.length ?? 0) - 1}
                                title="Move down"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                className="btn btn-ghost btn-sm btn-icon"
                                style={{ color: 'var(--error)' }}
                                onClick={() => removeStep(step.id)}
                                title="Remove step"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Playbook"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
