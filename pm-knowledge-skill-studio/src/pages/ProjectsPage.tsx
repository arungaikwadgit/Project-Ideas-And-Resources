import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, X, FolderOpen, CheckCircle } from 'lucide-react'
import type { Project, DomainKnowledge } from '../types'
import { projectStore } from '../stores/projectStore'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'

interface ProjectForm {
  name: string
  description: string
  goals: string
  techStack: string
  team: string
  status: 'active' | 'archived'
  linkedDomainIds: string[]
  tags: string[]
}

const EMPTY_FORM: ProjectForm = {
  name: '',
  description: '',
  goals: '',
  techStack: '',
  team: '',
  status: 'active',
  linkedDomainIds: [],
  tags: [],
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<DomainKnowledge[]>([])
  const [selected, setSelected] = useState<Project | null>(null)
  const [form, setForm] = useState<ProjectForm>({ ...EMPTY_FORM })
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [tagInput, setTagInput] = useState('')

  const load = useCallback(async () => {
    const [pList, dList] = await Promise.all([
      projectStore.list().catch(() => [] as Project[]),
      domainKnowledgeStore.list().catch(() => [] as DomainKnowledge[]),
    ])
    setProjects(pList.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    setDomains(dList)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSelect = (p: Project) => {
    setSelected(p)
    setCreating(false)
    setForm({
      name: p.name,
      description: p.description,
      goals: p.goals,
      techStack: p.techStack,
      team: p.team,
      status: p.status,
      linkedDomainIds: p.linkedDomainIds,
      tags: p.tags,
    })
    setTagInput('')
  }

  const handleNew = () => {
    setSelected(null)
    setCreating(true)
    setForm({ ...EMPTY_FORM })
    setTagInput('')
  }

  const handleCancel = () => {
    setCreating(false)
    setSelected(null)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (creating) {
        const created = await projectStore.create({ ...form, name: form.name.trim() })
        setSelected(created)
        setCreating(false)
      } else if (selected) {
        const updated = await projectStore.update({ ...selected, ...form, name: form.name.trim() })
        setSelected(updated)
      }
      await load()
      setSavedMsg('Saved!')
      setTimeout(() => setSavedMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.name}"? This cannot be undone.`)) return
    await projectStore.delete(p.id)
    setSelected(null)
    setCreating(false)
    await load()
  }

  const toggleDomain = (id: string) => {
    setForm(f => ({
      ...f,
      linkedDomainIds: f.linkedDomainIds.includes(id)
        ? f.linkedDomainIds.filter(d => d !== id)
        : [...f.linkedDomainIds, id],
    }))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const removeTag = (t: string) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))

  const showForm = creating || selected !== null

  return (
    <div className="page-container">
      <PageHeader
        title="Projects"
        subtitle="Capture project context once — reuse it in every SDLC prompt automatically."
        actions={
          <button className="btn btn-primary" onClick={handleNew}>
            <Plus size={14} /> New Project
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '280px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Project list */}
        <div>
          {projects.length === 0 && !showForm ? (
            <EmptyState
              icon={<FolderOpen size={40} />}
              title="No projects yet"
              description="Create a project to inject its context into SDLC Workspace prompts."
              action={<button className="btn btn-primary" onClick={handleNew}><Plus size={14} /> New Project</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  style={{
                    background: selected?.id === p.id ? 'rgba(74,163,255,0.1)' : 'var(--surface)',
                    border: `1px solid ${selected?.id === p.id ? 'rgba(74,163,255,0.4)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all var(--transition)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: selected?.id === p.id ? 'var(--accent)' : 'var(--text)', marginBottom: '0.25rem' }}>
                    {p.name}
                  </div>
                  {p.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                    <span
                      style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: p.status === 'active' ? 'rgba(74,255,163,0.15)' : 'rgba(255,255,255,0.06)', color: p.status === 'active' ? 'var(--success)' : 'var(--muted)', border: '1px solid transparent' }}
                    >
                      {p.status}
                    </span>
                    {p.linkedDomainIds.length > 0 && (
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 3, background: 'rgba(74,163,255,0.1)', color: 'var(--accent)' }}>
                        {p.linkedDomainIds.length} domain{p.linkedDomainIds.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit form */}
        {showForm && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0 }}>{creating ? 'New Project' : 'Edit Project'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {savedMsg && (
                  <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <CheckCircle size={13} /> {savedMsg}
                  </span>
                )}
                {selected && !creating && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(selected)} title="Delete project">
                    <Trash2 size={13} />
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Project Name *</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Customer Portal v2"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="form-label">Description / Brief Context</label>
                <textarea
                  className="input"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is this project? What problem does it solve?"
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="form-label">Goals & Objectives</label>
                <textarea
                  className="input"
                  value={form.goals}
                  onChange={e => setForm(f => ({ ...f, goals: e.target.value }))}
                  placeholder="Key goals, success criteria, KPIs…"
                  rows={2}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Tech Stack</label>
                  <textarea
                    className="input"
                    value={form.techStack}
                    onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
                    placeholder="e.g., React, Node.js, PostgreSQL, AWS"
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label className="form-label">Team & Stakeholders</label>
                  <textarea
                    className="input"
                    value={form.team}
                    onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                    placeholder="e.g., 3 engineers, 1 designer, PO: Jane"
                    rows={2}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'archived' }))}
                  style={{ width: 180 }}
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Linked Domains */}
              <div>
                <label className="form-label">Linked Domain Knowledge</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0 0 0.5rem' }}>
                  Domain content linked here will be auto-injected into SDLC prompts when this project is active.
                </p>
                {domains.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                    No domain knowledge saved yet. Use the Domain Builder first.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {domains.map(d => (
                      <label
                        key={d.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                          cursor: 'pointer', fontSize: '0.8125rem',
                          background: form.linkedDomainIds.includes(d.id) ? 'rgba(74,163,255,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${form.linkedDomainIds.includes(d.id) ? 'rgba(74,163,255,0.4)' : 'var(--border)'}`,
                          borderRadius: 4, padding: '0.25rem 0.625rem',
                          transition: 'all var(--transition)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.linkedDomainIds.includes(d.id)}
                          onChange={() => toggleDomain(d.id)}
                          style={{ margin: 0 }}
                        />
                        {d.domainName}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                  {form.tags.map(t => (
                    <span
                      key={t}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 3, padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                      onClick={() => removeTag(t)}
                    >
                      {t} <X size={10} />
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <input
                    className="input"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    placeholder="Add tag…"
                    style={{ flex: 1, maxWidth: 200 }}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                >
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Project'}
                </button>
                <button className="btn btn-ghost" onClick={handleCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
