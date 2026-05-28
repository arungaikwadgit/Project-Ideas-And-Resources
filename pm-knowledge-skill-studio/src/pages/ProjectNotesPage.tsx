import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, FileText, Tag } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbList } from '../stores/db'
import type { ProjectNote } from '../types'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import MarkdownPreview from '../components/editor/MarkdownPreview'

export default function ProjectNotesPage() {
  const [notes, setNotes] = useState<ProjectNote[]>([])
  const [filterProject, setFilterProject] = useState('all')
  const [editing, setEditing] = useState<ProjectNote | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', projectName: '', content: '', tags: '' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  const load = useCallback(async () => {
    setNotes(await dbList<ProjectNote>('projectNotes'))
  }, [])

  useEffect(() => { load() }, [load])

  const projects = ['all', ...Array.from(new Set(notes.map(n => n.projectName).filter(Boolean)))]
  const filtered = filterProject === 'all' ? notes : notes.filter(n => n.projectName === filterProject)

  const startCreate = () => { setForm({ title: '', projectName: '', content: '', tags: '' }); setEditing(null); setCreating(true); setPreview(false) }
  const startEdit = (n: ProjectNote) => { setForm({ title: n.title, projectName: n.projectName ?? '', content: n.contentMarkdown, tags: n.tags.join(', ') }); setEditing(n); setCreating(true); setPreview(false) }

  const handleSave = async () => {
    const now = new Date().toISOString()
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (editing) {
      await dbUpdate('projectNotes', { ...editing, title: form.title, projectName: form.projectName, contentMarkdown: form.content, tags, updatedAt: now })
    } else {
      await dbCreate('projectNotes', { id: uuid(), title: form.title, projectName: form.projectName, contentMarkdown: form.content, tags, createdAt: now, updatedAt: now } as ProjectNote)
    }
    setCreating(false); setEditing(null); load()
  }

  const handleDelete = async () => {
    if (deleteTarget) { await dbDelete('projectNotes', deleteTarget); setDeleteTarget(null); load() }
  }

  return (
    <div className="page-container">
      <PageHeader title="Project Notes" subtitle="Capture project-specific notes and context"
        actions={<button className="btn btn-primary" onClick={startCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}><Plus size={14} /> New Note</button>}
      />

      {creating && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>{editing ? 'Edit' : 'New'} Project Note</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Project Name</label>
              <input className="input" value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} placeholder="e.g., Q4 Platform Launch" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Content (Markdown)</label>
              <button onClick={() => setPreview(p => !p)} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{preview ? 'Edit' : 'Preview'}</button>
            </div>
            {preview ? <div className="card" style={{ padding: '1rem', minHeight: 200 }}><MarkdownPreview content={form.content} /></div>
              : <MarkdownEditor value={form.content} onChange={v => setForm(f => ({ ...f, content: v }))} minHeight={200} />}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()} style={{ fontSize: '0.85rem' }}>Save</button>
            <button className="btn btn-secondary" onClick={() => { setCreating(false); setEditing(null) }} style={{ fontSize: '0.85rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {projects.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {projects.map(p => (
            <button key={p} onClick={() => setFilterProject(p)} className={filterProject === p ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              {p === 'all' ? 'All Projects' : p}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText size={32} className="text-accent" />} title="No project notes yet" description="Capture project-specific context, decisions, and progress notes." action={<button className="btn btn-primary" onClick={startCreate} style={{ fontSize: '0.85rem' }}><Plus size={14} style={{ marginRight: '0.4rem' }} /> Create First Note</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(note => (
            <div key={note.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{note.title}</h3>
                    {note.projectName && <span className="badge" style={{ fontSize: '0.75rem' }}>{note.projectName}</span>}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {note.contentMarkdown.slice(0, 200).replace(/[#*`]/g, '')}...
                  </div>
                  {note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {note.tags.map(tag => <span key={tag} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}><Tag size={10} />{tag}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button onClick={() => startEdit(note)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && <ConfirmationDialog open={!!deleteTarget} title="Delete Note" message="Delete this project note permanently?" confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}
