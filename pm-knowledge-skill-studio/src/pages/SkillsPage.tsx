import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, X, Layers, Download, Upload } from 'lucide-react'
import type { Skill, SkillMaturityLevel } from '../types'
import { skillStore } from '../stores/skillStore'
import { skillToMd, mdToSkill, skillMdFilename, downloadFile, readMdFile } from '../lib/mdFileStorage'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import MaturityBadge from '../components/ui/MaturityBadge'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'

const MATURITY_LEVELS: SkillMaturityLevel[] = ['Beginner', 'Developing', 'Proficient', 'Advanced', 'Expert']

interface Role { id: string; name: string }

const EMPTY_SKILL = (): Omit<Skill, 'id' | 'createdAt' | 'updatedAt'> => ({
  name: '',
  roleId: '',
  category: '',
  description: '',
  maturityLevel: 'Developing',
  evidenceNotes: '',
  practiceNotes: '',
  reflectionNotes: '',
  linkedDomainIds: [],
  linkedArtifacts: [],
  isCrossDomainSkill: false,
  tags: [],
})

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRoleId, setFilterRoleId] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [editingSkill, setEditingSkill] = useState<Partial<Skill> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null)
  const [saving, setSaving] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'evidence' | 'practice' | 'reflection'>('basic')

  const loadSkills = useCallback(async () => {
    const all = await skillStore.list()
    setSkills(all.sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  useEffect(() => {
    loadSkills()
    fetch('/pm-knowledge-skill-studio/config/roles.json')
      .then((r) => r.json())
      .then((data: Role[]) => setRoles(data))
      .catch(() => {})
  }, [loadSkills])

  const filteredSkills = skills.filter((s) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    const matchRole = !filterRoleId || s.roleId === filterRoleId
    return matchSearch && matchRole
  })

  // Group by roleId
  const grouped: Record<string, Skill[]> = {}
  for (const skill of filteredSkills) {
    const key = skill.roleId || 'general'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(skill)
  }

  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? roleId

  const openEdit = (skill: Skill) => {
    setIsNew(false)
    setSelectedSkill(skill)
    setEditingSkill({ ...skill })
    setActiveTab('basic')
  }

  const openCreate = () => {
    setIsNew(true)
    setSelectedSkill(null)
    setEditingSkill({ ...EMPTY_SKILL(), roleId: filterRoleId || '' })
    setActiveTab('basic')
  }

  const handleSave = async () => {
    if (!editingSkill) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await skillStore.create(editingSkill as Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>)
        setSelectedSkill(created)
        setIsNew(false)
        setEditingSkill({ ...created })
      } else if (selectedSkill) {
        const updated = await skillStore.update({ ...selectedSkill, ...editingSkill } as Skill)
        setSelectedSkill(updated)
        setEditingSkill({ ...updated })
      }
      await loadSkills()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await skillStore.delete(deleteTarget.id)
    setDeleteTarget(null)
    if (selectedSkill?.id === deleteTarget.id) { setSelectedSkill(null); setEditingSkill(null) }
    await loadSkills()
  }

  const update = (patch: Partial<Skill>) => setEditingSkill((prev) => prev ? { ...prev, ...patch } : prev)

  const handleExportSkillMd = (skill: Skill) => {
    downloadFile(skillMdFilename(skill), skillToMd(skill))
  }

  const handleImportMd = async () => {
    setImportError(null)
    try {
      const raw = await readMdFile()
      const parsed = mdToSkill(raw)
      if (!parsed) { setImportError('File does not appear to be a PMKS skill MD file.'); return }
      const existing = parsed.id ? await skillStore.getById(parsed.id) : undefined
      if (existing) {
        await skillStore.update({ ...parsed, updatedAt: new Date().toISOString() })
      } else {
        const { id: _id, ...rest } = parsed
        await skillStore.create(rest)
      }
      await loadSkills()
    } catch (e) {
      if ((e as Error).message !== 'No file selected') {
        setImportError('Failed to import file. Make sure it is a valid PMKS skill MD file.')
      }
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Skills Studio</h1>
          <p className="text-muted text-sm">{skills.length} skill{skills.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleImportMd} title="Import a .skill.md file">
            <Upload size={15} /> Import MD
          </button>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Skill</button>
        </div>
      </div>

      {importError && (
        <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 6, padding: '0.625rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--error)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {importError}
          <button onClick={() => setImportError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: editingSkill ? '300px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* List */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search skills..." />
            </div>
            <select className="select" style={{ width: 'auto' }} value={filterRoleId} onChange={(e) => setFilterRoleId(e.target.value)}>
              <option value="">All roles</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          {Object.keys(grouped).length === 0 ? (
            <EmptyState
              icon={<Layers size={40} />}
              title="No skills yet"
              description="Build domains to get skill suggestions, or create skills manually."
              action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Skill</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(grouped).map(([roleId, roleSkills]) => (
                <div key={roleId}>
                  <div className="section-header" style={{ marginBottom: '0.5rem' }}>
                    <span className="section-title">{getRoleName(roleId)}</span>
                    <span className="badge badge-default">{roleSkills.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {roleSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="card card-clickable"
                        style={{ padding: '0.75rem', borderColor: selectedSkill?.id === skill.id ? 'rgba(74,163,255,0.5)' : undefined, background: selectedSkill?.id === skill.id ? 'rgba(74,163,255,0.06)' : undefined }}
                        onClick={() => openEdit(skill)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{skill.name}</div>
                            <div className="text-xs text-muted">{skill.category}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                            <MaturityBadge level={skill.maturityLevel} size="sm" />
                            <button className="btn btn-ghost btn-sm btn-icon" title="Export as MD" onClick={(e) => { e.stopPropagation(); handleExportSkillMd(skill) }}><Download size={12} /></button>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(skill) }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        {editingSkill && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{isNew ? 'New Skill' : 'Edit Skill'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isNew && selectedSkill && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleExportSkillMd({ ...selectedSkill, ...editingSkill } as Skill)} title="Download as .skill.md">
                    <Download size={13} /> Export MD
                  </button>
                )}
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : <><Save size={13} /> Save</>}</button>
                {!isNew && <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(selectedSkill!)}><Trash2 size={13} /></button>}
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSkill(null); setSelectedSkill(null); setIsNew(false) }}><X size={14} /></button>
              </div>
            </div>

            <div className="tab-list">
              {(['basic', 'evidence', 'practice', 'reflection'] as const).map((tab) => (
                <button key={tab} className={`tab-item${activeTab === tab ? ' tab-item-active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Skill Name *</label>
                  <input className="input" value={editingSkill.name ?? ''} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Requirements Elicitation" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="select" value={editingSkill.roleId ?? ''} onChange={(e) => update({ roleId: e.target.value })}>
                      <option value="">Select role...</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input className="input" value={editingSkill.category ?? ''} onChange={(e) => update({ category: e.target.value })} placeholder="e.g. Discovery, Strategy" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Maturity Level</label>
                  <select className="select" value={editingSkill.maturityLevel ?? 'Developing'} onChange={(e) => update({ maturityLevel: e.target.value as SkillMaturityLevel })}>
                    {MATURITY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <div style={{ marginTop: '0.5rem' }}>
                    <MaturityBadge level={editingSkill.maturityLevel as SkillMaturityLevel ?? 'Developing'} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="textarea" value={editingSkill.description ?? ''} onChange={(e) => update({ description: e.target.value })} placeholder="Describe this skill and how it's applied..." rows={3} />
                </div>
              </div>
            )}

            {activeTab === 'evidence' && (
              <div className="form-group">
                <label className="form-label">Evidence Notes</label>
                <p className="form-hint">Document specific examples of where you've applied this skill.</p>
                <MarkdownEditor value={editingSkill.evidenceNotes ?? ''} onChange={(v) => update({ evidenceNotes: v })} placeholder="e.g. Led discovery sessions for Project X, resulting in..." minHeight={300} />
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="form-group">
                <label className="form-label">Practice Notes</label>
                <p className="form-hint">How are you actively developing this skill? What are your practice goals?</p>
                <MarkdownEditor value={editingSkill.practiceNotes ?? ''} onChange={(v) => update({ practiceNotes: v })} placeholder="e.g. Reading 'Continuous Discovery Habits', attending weekly..." minHeight={300} />
              </div>
            )}

            {activeTab === 'reflection' && (
              <div className="form-group">
                <label className="form-label">Reflection Notes</label>
                <p className="form-hint">What have you learned? What would you do differently?</p>
                <MarkdownEditor value={editingSkill.reflectionNotes ?? ''} onChange={(v) => update({ reflectionNotes: v })} placeholder="e.g. I've found that structured interview templates help significantly..." minHeight={300} />
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Skill"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
