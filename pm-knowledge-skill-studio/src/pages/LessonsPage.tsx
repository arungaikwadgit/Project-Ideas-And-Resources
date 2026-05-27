import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Lightbulb, Tag } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import { dbCreate, dbUpdate, dbDelete, dbList } from '../stores/db'
import type { LessonLearned } from '../types'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'

const DEFAULT_CATEGORIES = ['Process Improvement', 'Technical', 'Team & Communication', 'Risk Management', 'Stakeholder Management', 'Delivery', 'Planning', 'Quality', 'Leadership', 'AI & Automation']

interface LessonFormData {
  title: string; situation: string; whatWorked: string
  whatDidNotWork: string; rootCause: string; futureAction: string; category: string; tags: string
}

const BLANK: LessonFormData = { title: '', situation: '', whatWorked: '', whatDidNotWork: '', rootCause: '', futureAction: '', category: DEFAULT_CATEGORIES[0], tags: '' }

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonLearned[]>([])
  const [filterCategory, setFilterCategory] = useState('all')
  const [editing, setEditing] = useState<LessonLearned | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<LessonFormData>(BLANK)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLessons(await dbList<LessonLearned>('lessons'))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filterCategory === 'all' ? lessons : lessons.filter(l => l.category === filterCategory)

  const startCreate = () => { setForm(BLANK); setCreating(true); setEditing(null) }
  const startEdit = (l: LessonLearned) => { setForm({ title: l.title, situation: l.situation, whatWorked: l.whatWorked, whatDidNotWork: l.whatDidNotWork, rootCause: l.rootCause, futureAction: l.futureAction, category: l.category, tags: l.tags.join(', ') }); setEditing(l); setCreating(true) }

  const handleSave = async () => {
    const now = new Date().toISOString()
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (editing) {
      const updated: LessonLearned = { ...editing, ...form, tags, updatedAt: now }
      await dbUpdate('lessons', updated)
    } else {
      await dbCreate('lessons', { id: uuid(), ...form, tags, linkedDomainIds: [], linkedSkillIds: [], createdAt: now, updatedAt: now } as LessonLearned)
    }
    setCreating(false); setEditing(null); load()
  }

  const handleDelete = async () => {
    if (deleteTarget) { await dbDelete('lessons', deleteTarget); setDeleteTarget(null); load() }
  }

  const Field = ({ label, name, multiline = false }: { label: string; name: keyof LessonFormData; multiline?: boolean }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>{label}</label>
      {multiline
        ? <textarea className="textarea" value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} rows={3} style={{ width: '100%', resize: 'vertical' }} />
        : <input className="input" value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} style={{ width: '100%' }} />}
    </div>
  )

  return (
    <div className="page-container">
      <PageHeader title="Lessons Learned" subtitle="Capture what worked, what didn't, and what to do differently"
        actions={<button className="btn btn-primary" onClick={startCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}><Plus size={14} /> Add Lesson</button>}
      />

      {creating && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem' }}>{editing ? 'Edit' : 'New'} Lesson Learned</h3>
          <Field label="Title *" name="title" />
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Category</label>
            <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%' }}>
              {DEFAULT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <Field label="Situation" name="situation" multiline />
          <Field label="What Worked" name="whatWorked" multiline />
          <Field label="What Didn't Work" name="whatDidNotWork" multiline />
          <Field label="Root Cause" name="rootCause" multiline />
          <Field label="Future Action" name="futureAction" multiline />
          <Field label="Tags (comma-separated)" name="tags" />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()} style={{ fontSize: '0.85rem' }}>Save</button>
            <button className="btn btn-secondary" onClick={() => { setCreating(false); setEditing(null) }} style={{ fontSize: '0.85rem' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', ...DEFAULT_CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)} className={filterCategory === cat ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Lightbulb size={32} className="text-accent" />} title="No lessons learned yet" description="Capture what worked, what didn't, and how to improve." action={<button className="btn btn-primary" onClick={startCreate} style={{ fontSize: '0.85rem' }}><Plus size={14} style={{ marginRight: '0.4rem' }} /> Add First Lesson</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(lesson => (
            <div key={lesson.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{lesson.title}</h3>
                  <span className="badge" style={{ fontSize: '0.75rem' }}>{lesson.category}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => startEdit(lesson)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}><Edit2 size={14} /></button>
                  <button onClick={() => setDeleteTarget(lesson.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: '0.25rem' }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
                {lesson.whatWorked && <div><span style={{ color: 'var(--success)', fontWeight: 500 }}>✓ Worked: </span><span className="text-muted">{lesson.whatWorked}</span></div>}
                {lesson.whatDidNotWork && <div><span style={{ color: 'var(--error)', fontWeight: 500 }}>✗ Didn't Work: </span><span className="text-muted">{lesson.whatDidNotWork}</span></div>}
                {lesson.futureAction && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--accent)', fontWeight: 500 }}>→ Action: </span><span className="text-muted">{lesson.futureAction}</span></div>}
              </div>
              {lesson.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                  {lesson.tags.map(tag => <span key={tag} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={10} />{tag}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteTarget && <ConfirmationDialog open={!!deleteTarget} title="Delete Lesson" message="Delete this lesson permanently?" confirmLabel="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  )
}
