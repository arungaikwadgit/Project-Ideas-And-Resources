import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { dbList, dbCreate, dbUpdate, dbDelete } from '../stores/db'
import type { Decision } from '../types'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { v4 as uuid } from 'uuid'

interface DecisionStatus {
  id: string
  label: string
  color: string
  description: string
}

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const EMPTY_FORM = (): Omit<Decision, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  context: '',
  optionsConsidered: [''],
  decisionMade: '',
  rationale: '',
  status: 'proposed',
  decisionBy: '',
  decisionDate: '',
  reviewDate: '',
  tags: [],
  linkedProjectId: '',
  linkedDomainIds: [],
})

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [statuses, setStatuses] = useState<DecisionStatus[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Decision | null>(null)

  const loadDecisions = useCallback(async () => {
    const all = await dbList<Decision>('decisions')
    setDecisions(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  useEffect(() => {
    loadDecisions()
    fetch('/pm-knowledge-skill-studio/config/starterDecisionStatuses.json')
      .then((r) => r.json())
      .then(setStatuses)
      .catch(() => {})
  }, [loadDecisions])

  const filteredDecisions = decisions.filter(
    (d) => !filterStatus || d.status === filterStatus,
  )

  const getStatus = (id: string) => statuses.find((s) => s.id === id)

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM())
    setShowForm(true)
  }

  const openEdit = (decision: Decision) => {
    setEditingId(decision.id)
    setForm({
      title: decision.title,
      context: decision.context,
      optionsConsidered: decision.optionsConsidered.length > 0 ? decision.optionsConsidered : [''],
      decisionMade: decision.decisionMade,
      rationale: decision.rationale,
      status: decision.status,
      decisionBy: decision.decisionBy,
      decisionDate: decision.decisionDate,
      reviewDate: decision.reviewDate ?? '',
      tags: decision.tags,
      linkedProjectId: decision.linkedProjectId ?? '',
      linkedDomainIds: decision.linkedDomainIds,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM())
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const cleanedOptions = form.optionsConsidered.filter((o) => o.trim())
      if (editingId) {
        const existing = decisions.find((d) => d.id === editingId)
        if (existing) {
          await dbUpdate<Decision>('decisions', {
            ...existing,
            ...form,
            optionsConsidered: cleanedOptions,
            updatedAt: now,
          })
        }
      } else {
        await dbCreate<Decision>('decisions', {
          id: uuid(),
          ...form,
          optionsConsidered: cleanedOptions,
          createdAt: now,
          updatedAt: now,
        })
      }
      await loadDecisions()
      closeForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await dbDelete('decisions', deleteTarget.id)
    setDeleteTarget(null)
    if (editingId === deleteTarget.id) closeForm()
    await loadDecisions()
  }

  const addOption = () => setForm((f) => ({ ...f, optionsConsidered: [...f.optionsConsidered, ''] }))
  const updateOption = (i: number, val: string) =>
    setForm((f) => {
      const opts = [...f.optionsConsidered]
      opts[i] = val
      return { ...f, optionsConsidered: opts }
    })
  const removeOption = (i: number) =>
    setForm((f) => ({
      ...f,
      optionsConsidered: f.optionsConsidered.filter((_, idx) => idx !== i),
    }))

  return (
    <div className="page-container">
      <PageHeader
        title="Decision Log"
        subtitle={`${decisions.length} decision${decisions.length !== 1 ? 's' : ''} recorded`}
        actions={
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={15} /> New Decision
          </button>
        }
      />

      {/* Inline form */}
      {showForm && (
        <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Edit Decision' : 'New Decision'}</h3>
            <button className="btn btn-ghost btn-icon" onClick={closeForm}><X size={16} /></button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Decision title"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Context</label>
              <textarea
                className="textarea"
                value={form.context}
                onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                placeholder="What is the background or context for this decision?"
                rows={3}
              />
            </div>

            {/* Options Considered */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Options Considered</label>
                <button className="btn btn-secondary btn-sm" onClick={addOption}><Plus size={13} /> Add Option</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {form.optionsConsidered.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="input"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                    />
                    {form.optionsConsidered.length > 1 && (
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--error)', flexShrink: 0 }} onClick={() => removeOption(i)}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Decision Made</label>
              <textarea
                className="textarea"
                value={form.decisionMade}
                onChange={(e) => setForm((f) => ({ ...f, decisionMade: e.target.value }))}
                placeholder="What was decided?"
                rows={2}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rationale</label>
              <textarea
                className="textarea"
                value={form.rationale}
                onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))}
                placeholder="Why was this decision made?"
                rows={2}
              />
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select
                  className="select"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Decision By</label>
                <input
                  className="input"
                  value={form.decisionBy}
                  onChange={(e) => setForm((f) => ({ ...f, decisionBy: e.target.value }))}
                  placeholder="Name or role"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Decision Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.decisionDate}
                  onChange={(e) => setForm((f) => ({ ...f, decisionDate: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Review Date (optional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="select"
          style={{ width: 'auto', minWidth: 180 }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {filterStatus && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilterStatus('')}>
            <X size={13} /> Clear filter
          </button>
        )}
        <span className="text-sm text-muted" style={{ marginLeft: 'auto' }}>
          {filteredDecisions.length} result{filteredDecisions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Decision cards */}
      {filteredDecisions.length === 0 ? (
        <EmptyState
          title={filterStatus ? 'No decisions with this status' : 'No decisions yet'}
          description={filterStatus ? 'Try a different status filter.' : 'Start logging important project decisions to build institutional memory.'}
          action={
            !filterStatus ? (
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={14} /> New Decision
              </button>
            ) : undefined
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredDecisions.map((d) => {
            const status = getStatus(d.status)
            return (
              <div key={d.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '1rem' }}>{d.title}</span>
                      {status && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: status.color + '22',
                            color: status.color,
                            borderColor: status.color + '55',
                          }}
                        >
                          {status.label}
                        </span>
                      )}
                    </div>

                    {d.context && (
                      <p className="text-sm text-muted line-clamp-2" style={{ marginBottom: '0.5rem' }}>
                        {d.context}
                      </p>
                    )}

                    {d.decisionMade && (
                      <p className="text-sm" style={{ marginBottom: '0.5rem' }}>
                        <span className="text-muted">Decision: </span>{d.decisionMade}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {d.decisionBy && (
                        <span className="text-xs text-muted">By: {d.decisionBy}</span>
                      )}
                      {d.decisionDate && (
                        <span className="text-xs text-muted">Date: {formatDate(d.decisionDate)}</span>
                      )}
                      {d.optionsConsidered.length > 0 && d.optionsConsidered[0] && (
                        <span className="text-xs text-muted">{d.optionsConsidered.length} option{d.optionsConsidered.length !== 1 ? 's' : ''} considered</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => openEdit(d)}
                      title="Edit decision"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--error)' }}
                      onClick={() => setDeleteTarget(d)}
                      title="Delete decision"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Decision"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
