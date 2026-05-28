import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Star, Trash2, FileText, Tag } from 'lucide-react'
import type { KnowledgeNote } from '../types'
import { knowledgeStore } from '../stores/knowledgeStore'
import SearchBar from '../components/ui/SearchBar'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import EmptyState from '../components/ui/EmptyState'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function NoteCard({ note, selected, onClick }: { note: KnowledgeNote; selected: boolean; onClick: () => void }) {
  const preview = note.contentMarkdown.replace(/[#*_`>\[\]]/g, '').slice(0, 120)
  return (
    <div
      onClick={onClick}
      className="card card-clickable"
      style={{
        borderColor: selected ? 'rgba(74,163,255,0.5)' : undefined,
        background: selected ? 'rgba(74,163,255,0.06)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1, minWidth: 0 }} className="truncate">{note.title || 'Untitled'}</span>
        {note.isFavorite && <Star size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} fill="currentColor" />}
      </div>
      {preview && <p className="text-sm text-muted line-clamp-2" style={{ margin: 0 }}>{preview}</p>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
        {note.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
        <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{formatDate(note.updatedAt)}</span>
      </div>
      <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{note.contentMarkdown.length.toLocaleString()} chars</div>
    </div>
  )
}

const EMPTY_NOTE = (): Partial<KnowledgeNote> => ({
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

export default function KnowledgePage() {
  const [notes, setNotes] = useState<KnowledgeNote[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null)
  const [editingNote, setEditingNote] = useState<Partial<KnowledgeNote> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeNote | null>(null)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  const loadNotes = useCallback(async () => {
    const all = await knowledgeStore.list()
    setNotes(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  useEffect(() => { loadNotes() }, [loadNotes])

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort()

  const filteredNotes = notes.filter((n) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.contentMarkdown.toLowerCase().includes(q)
    const matchTag = !filterTag || n.tags.includes(filterTag)
    return matchSearch && matchTag
  })

  const openCreate = () => {
    setIsNew(true)
    setSelectedNote(null)
    setEditingNote(EMPTY_NOTE())
    setPreviewMode(false)
  }

  const openEdit = (note: KnowledgeNote) => {
    setIsNew(false)
    setSelectedNote(note)
    setEditingNote({ ...note })
    setPreviewMode(false)
  }

  const handleSave = async () => {
    if (!editingNote) return
    setSaving(true)
    try {
      if (isNew) {
        const created = await knowledgeStore.create({
          title: editingNote.title ?? 'Untitled',
          contentMarkdown: editingNote.contentMarkdown ?? '',
          category: editingNote.category ?? '',
          tags: editingNote.tags ?? [],
          isFavorite: editingNote.isFavorite ?? false,
          linkedSkillIds: [],
          linkedDomainIds: [],
          linkedPlaybookIds: [],
          linkedAiRunIds: [],
          linkedProjectIds: [],
        })
        setSelectedNote(created)
        setIsNew(false)
        setEditingNote({ ...created })
      } else if (selectedNote) {
        const updated = await knowledgeStore.update({ ...selectedNote, ...editingNote } as KnowledgeNote)
        setSelectedNote(updated)
        setEditingNote({ ...updated })
      }
      await loadNotes()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await knowledgeStore.delete(deleteTarget.id)
    setDeleteTarget(null)
    if (selectedNote?.id === deleteTarget.id) {
      setSelectedNote(null)
      setEditingNote(null)
    }
    await loadNotes()
  }

  const toggleFavorite = async (note: KnowledgeNote, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = await knowledgeStore.update({ ...note, isFavorite: !note.isFavorite })
    if (selectedNote?.id === note.id) {
      setSelectedNote(updated)
      setEditingNote((prev) => prev ? { ...prev, isFavorite: updated.isFavorite } : prev)
    }
    await loadNotes()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || editingNote?.tags?.includes(t)) return
    setEditingNote((prev) => prev ? { ...prev, tags: [...(prev.tags ?? []), t] } : prev)
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setEditingNote((prev) => prev ? { ...prev, tags: (prev.tags ?? []).filter((t) => t !== tag) } : prev)
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Knowledge Library</h1>
          <p className="text-muted text-sm">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> New Note
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editingNote ? '320px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left: List */}
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search notes..." />
            </div>
            {allTags.length > 0 && (
              <select className="select" style={{ width: 'auto' }} value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="">All tags</option>
                {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {filteredNotes.length === 0 ? (
            <EmptyState
              icon={<FileText size={40} />}
              title="No notes found"
              description="Create your first note to start building your knowledge library."
              action={<button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> New Note</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredNotes.map((note) => (
                <div key={note.id} style={{ position: 'relative' }}>
                  <NoteCard note={note} selected={selectedNote?.id === note.id} onClick={() => openEdit(note)} />
                  <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', display: 'flex', gap: '0.2rem' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={(e) => toggleFavorite(note, e)} title="Toggle favorite">
                      <Star size={12} style={{ color: note.isFavorite ? 'var(--warning)' : 'var(--muted)' }} fill={note.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--error)' }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(note) }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Editor */}
        {editingNote && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{isNew ? 'New Note' : 'Edit Note'}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewMode((p) => !p)}>{previewMode ? 'Edit' : 'Preview'}</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditingNote(null); setSelectedNote(null); setIsNew(false) }}>Cancel</button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="input" value={editingNote.title ?? ''} onChange={(e) => setEditingNote((p) => p ? { ...p, title: e.target.value } : p)} placeholder="Note title" />
            </div>

            <div className="form-group">
              <label className="form-label">Content (Markdown)</label>
              {previewMode ? (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', minHeight: 200 }}>
                  <MarkdownPreview content={editingNote.contentMarkdown ?? ''} />
                </div>
              ) : (
                <MarkdownEditor value={editingNote.contentMarkdown ?? ''} onChange={(v) => setEditingNote((p) => p ? { ...p, contentMarkdown: v } : p)} showCharCount minHeight={200} />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="input" value={editingNote.category ?? ''} onChange={(e) => setEditingNote((p) => p ? { ...p, category: e.target.value } : p)} placeholder="e.g. Strategy, Technical, Research" />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input className="input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag and press Enter" style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={addTag}><Tag size={13} /> Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {(editingNote.tags ?? []).map((t) => (
                  <span key={t} className="tag tag-removable">
                    {t}
                    <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this note'}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
