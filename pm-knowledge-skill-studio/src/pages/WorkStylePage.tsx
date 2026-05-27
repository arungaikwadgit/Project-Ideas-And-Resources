import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Download, HelpCircle, CheckCircle } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { WorkStyle, WorkStyleSection } from '../types'
import { settingsStore } from '../stores/settingsStore'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import EmptyState from '../components/ui/EmptyState'

interface StarterSection {
  id: string
  title: string
  placeholder: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function downloadWorkStyle(workStyle: WorkStyle) {
  const content = [
    `# Work Style: ${workStyle.title}`,
    '',
    ...workStyle.sections
      .filter((s) => s.contentMarkdown.trim())
      .flatMap((s) => [`## ${s.title}`, '', s.contentMarkdown, '']),
    `---`,
    `_Last updated: ${new Date(workStyle.updatedAt).toLocaleDateString()}_`,
  ].join('\n')
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'work-style.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function WorkStylePage() {
  const [starterSections, setStarterSections] = useState<StarterSection[]>([])
  const [workStyle, setWorkStyle] = useState<WorkStyle | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    fetch('/pm-knowledge-skill-studio/config/starterWorkStyleSections.json')
      .then((r) => r.json())
      .then(async (starters: StarterSection[]) => {
        setStarterSections(starters)
        const saved = await settingsStore.get<WorkStyle>('workStyle')
        if (saved) {
          // Merge saved with starters to add any new sections
          const mergedSections = starters.map((s) => {
            const existing = saved.sections.find((sec) => sec.id === s.id)
            return existing ?? { id: s.id, title: s.title, contentMarkdown: '', placeholder: s.placeholder, updatedAt: new Date().toISOString() }
          })
          setWorkStyle({ ...saved, sections: mergedSections })
        } else {
          const now = new Date().toISOString()
          const newWs: WorkStyle = {
            id: uuid(),
            title: 'My Work Style',
            sections: starters.map((s) => ({ id: s.id, title: s.title, contentMarkdown: '', placeholder: s.placeholder, updatedAt: now })),
            createdAt: now,
            updatedAt: now,
          }
          setWorkStyle(newWs)
        }
      })
      .catch(() => {
        const now = new Date().toISOString()
        setWorkStyle({ id: uuid(), title: 'My Work Style', sections: [], createdAt: now, updatedAt: now })
      })
      .finally(() => setLoading(false))
  }, [])

  const saveWorkStyle = useCallback(async (ws: WorkStyle) => {
    const updated = { ...ws, updatedAt: new Date().toISOString() }
    await settingsStore.set('workStyle', updated)
    setLastSavedAt(new Date().toISOString())
    return updated
  }, [])

  const handleSectionChange = useCallback((sectionId: string, value: string) => {
    setWorkStyle((prev) => {
      if (!prev) return prev
      const updated = {
        ...prev,
        sections: prev.sections.map((s) => s.id === sectionId ? { ...s, contentMarkdown: value, updatedAt: new Date().toISOString() } : s),
      }
      return updated
    })

    // Debounce auto-save
    if (debounceTimers.current[sectionId]) clearTimeout(debounceTimers.current[sectionId])
    debounceTimers.current[sectionId] = setTimeout(async () => {
      setWorkStyle((prev) => {
        if (!prev) return prev
        saveWorkStyle(prev)
        return prev
      })
    }, 500)
  }, [saveWorkStyle])

  const filledCount = workStyle?.sections.filter((s) => s.contentMarkdown.trim()).length ?? 0
  const totalCount = workStyle?.sections.length ?? 0
  const progressPct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0

  if (loading) {
    return <div className="page-container"><div className="loading-overlay"><div className="loading-spinner" /> Loading...</div></div>
  }

  if (!workStyle) return null

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Work Style</h1>
          <p className="text-muted text-sm">Document your leadership principles, communication preferences, and delivery style for AI-assisted work.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => downloadWorkStyle(workStyle)}>
            <Download size={15} /> Export Markdown
          </button>
          <a href="/pm-knowledge-skill-studio/help" className="btn btn-ghost">
            <HelpCircle size={15} /> Guide
          </a>
        </div>
      </div>

      {/* Progress */}
      <div className="panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Profile Completion</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {filledCount === totalCount && totalCount > 0 && <CheckCircle size={14} style={{ color: 'var(--success)' }} />}
            <span style={{ fontSize: '0.875rem', color: filledCount === totalCount ? 'var(--success)' : 'var(--muted)' }}>
              {filledCount} / {totalCount} sections complete
            </span>
          </div>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? 'var(--success)' : 'var(--accent)', borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
        {lastSavedAt && (
          <div className="text-xs text-muted" style={{ marginTop: '0.375rem' }}>Last saved: {formatDate(lastSavedAt)}</div>
        )}
      </div>

      {workStyle.sections.length === 0 ? (
        <EmptyState title="No sections configured" description="Could not load work style sections configuration." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {workStyle.sections.map((section, i) => {
            const starter = starterSections.find((s) => s.id === section.id)
            return (
              <div key={section.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: section.contentMarkdown.trim() ? 'var(--success)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: section.contentMarkdown.trim() ? '#0b1220' : 'var(--muted)', flexShrink: 0 }}>
                    {section.contentMarkdown.trim() ? '✓' : i + 1}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>{section.title}</h3>
                  {section.contentMarkdown.trim() && <CheckCircle size={14} style={{ color: 'var(--success)', marginLeft: 'auto' }} />}
                </div>
                <MarkdownEditor
                  value={section.contentMarkdown}
                  onChange={(v) => handleSectionChange(section.id, v)}
                  placeholder={starter?.placeholder ?? `Write about your ${section.title.toLowerCase()}...`}
                  minHeight={120}
                />
                {section.updatedAt && section.contentMarkdown.trim() && (
                  <div className="text-xs text-muted" style={{ marginTop: '0.375rem', textAlign: 'right' }}>Saved {formatDate(section.updatedAt)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
