import { useState, useEffect, useCallback } from 'react'
import { knowledgeStore } from '../stores/knowledgeStore'
import type { KnowledgeNote } from '../types'
import { v4 as uuid } from 'uuid'

// ─── Simple markdown editor (textarea) ──────────────────────────────────────

function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <textarea
      className="textarea"
      style={{ minHeight: 220, fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

// ─── Slide-in panel ─────────────────────────────────────────────────────────

function SlidePanel({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 500,
          }}
          onClick={onClose}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 560,
          maxWidth: '100vw',
          background: 'var(--panel)',
          borderLeft: '1px solid var(--border-strong)',
          zIndex: 501,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '1.0625rem' }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>{children}</div>
      </div>
    </>
  )
}

// ─── Note Card ───────────────────────────────────────────────────────────────

function NoteCard({
  note,
  onEdit,
  onDelete,
  onFavorite,
}: {
  note: KnowledgeNote
  onEdit: () => void
  onDelete: () => void
  onFavorite: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="truncate"
            style={{ fontSize: '0.9375rem', cursor: 'pointer', marginBottom: '0.125rem' }}
            onClick={onEdit}
          >
            {note.title || 'Untitled Note'}
          </h3>
          {note.category && (
            <span className="badge badge-default">{note.category}</span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onFavorite}
          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          style={{ color: note.isFavorite ? 'var(--warning)' : 'var(--muted)', flexShrink: 0 }}
        >
          {note.isFavorite ? '★' : '☆'}
        </button>
      </div>

      <p className="text-sm text-muted line-clamp-3" style={{ marginBottom: '0.75rem' }}>
        {note.contentMarkdown.replace(/[#*`]/g, '').slice(0, 200) || 'No content'}
      </p>

      {note.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
          {note.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-xs text-muted">
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>Edit</button>
          {confirmDelete ? (
            <>
              <button className="btn btn-danger btn-sm" onClick={onDelete}>Confirm</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

const BLANK_NOTE = (): Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  contentMarkdown: '',
  category: '',
  tags: [],
  isFavorite: false,
  linkedSkillIds: [],
  linkedDomainIds: [],
  linkedPlaybookIds: [],
  linkedAiRunIds: [],
  linkedProjectIds: [],
})

export default function KnowledgeLibrary() {
  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<KnowledgeNote | null>(null)
  const [draft, setDraft] = useState(BLANK_NOTE())
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const loadNotes = useCallback(async () => {
    try {
      const all = await knowledgeStore.list()
      setNotes(all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNotes() }, [loadNotes])

  const openCreate = () => {
    setEditingNote(null)
    setDraft(BLANK_NOTE())
    setTagInput('')
    setPanelOpen(true)
  }

  const openEdit = (note: KnowledgeNote) => {
    setEditingNote(note)
    setDraft({
      title: note.title,
      contentMarkdown: note.contentMarkdown,
      category: note.category,
      tags: [...note.tags],
      isFavorite: note.isFavorite,
      linkedSkillIds: note.linkedSkillIds,
      linkedDomainIds: note.linkedDomainIds,
      linkedPlaybookIds: note.linkedPlaybookIds,
      linkedAiRunIds: note.linkedAiRunIds,
      linkedProjectIds: note.linkedProjectIds,
    })
    setTagInput('')
    setPanelOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingNote) {
        await knowledgeStore.update({ ...editingNote, ...draft })
      } else {
        await knowledgeStore.create(draft)
      }
      await loadNotes()
      setPanelOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await knowledgeStore.delete(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleFavorite = async (note: KnowledgeNote) => {
    const updated = await knowledgeStore.update({ ...note, isFavorite: !note.isFavorite })
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !draft.tags.includes(t)) {
      setDraft((d) => ({ ...d, tags: [...d.tags, t] }))
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setDraft((d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }))
  }

  const allTags = [...new Set(notes.flatMap((n) => n.tags))]
  const allCategories = [...new Set(notes.map((n) => n.category).filter(Boolean))]

  const filtered = notes.filter((n) => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.contentMarkdown.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTag && !n.tags.includes(filterTag)) return false
    if (filterCategory && n.category !== filterCategory) return false
    return true
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.375rem' }}>Knowledge Library</h1>
          <p className="text-muted text-sm">Your personal notes, AI outputs, and insights.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Note</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select className="select" style={{ width: 'auto', minWidth: 160 }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" style={{ width: 'auto', minWidth: 140 }} value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
          <option value="">All tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Notes grid */}
      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /> Loading notes...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '3rem' }}>📚</div>
          <div className="empty-state-title">{notes.length === 0 ? 'No notes yet' : 'No results'}</div>
          <div className="empty-state-description">
            {notes.length === 0
              ? 'Create your first knowledge note to get started.'
              : 'Try adjusting your search or filters.'}
          </div>
          {notes.length === 0 && (
            <button className="btn btn-primary" onClick={openCreate}>+ Create First Note</button>
          )}
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => openEdit(note)}
              onDelete={() => handleDelete(note.id)}
              onFavorite={() => handleFavorite(note)}
            />
          ))}
        </div>
      )}

      {/* Edit/Create Panel */}
      <SlidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={editingNote ? 'Edit Note' : 'New Note'}
      >
        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="input"
            placeholder="Note title..."
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <input
            className="input"
            placeholder="e.g. AI Output, Research, Meeting Notes"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Content (Markdown)</label>
          <MarkdownEditor
            value={draft.contentMarkdown}
            onChange={(v) => setDraft((d) => ({ ...d, contentMarkdown: v }))}
            placeholder="Write your note in Markdown..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tags</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              className="input"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
          </div>
          {draft.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {draft.tags.map((tag) => (
                <span key={tag} className="tag tag-removable">
                  {tag}
                  <button onClick={() => removeTag(tag)}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input
            type="checkbox"
            id="fav"
            checked={draft.isFavorite}
            onChange={(e) => setDraft((d) => ({ ...d, isFavorite: e.target.checked }))}
          />
          <label htmlFor="fav" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>Mark as favorite ★</label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !draft.title.trim()}>
            {saving ? 'Saving...' : '💾 Save Note'}
          </button>
          <button className="btn btn-secondary" onClick={() => setPanelOpen(false)}>Cancel</button>
        </div>
      </SlidePanel>
    </div>
  )
}
