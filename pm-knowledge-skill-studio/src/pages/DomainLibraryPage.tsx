import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Download, BookOpen, ExternalLink } from 'lucide-react'
import type { DomainKnowledge } from '../types'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function SourceBadge({ source }: { source: DomainKnowledge['source'] }) {
  const config: Record<string, { label: string; color: string; bg: string; border: string }> = {
    curated: { label: 'Curated', color: 'var(--success)', bg: 'rgba(126,231,135,0.12)', border: 'rgba(126,231,135,0.28)' },
    manual: { label: 'Manual', color: '#bc82ff', bg: 'rgba(188,130,255,0.12)', border: 'rgba(188,130,255,0.28)' },
    ai_assisted: { label: 'AI Assisted', color: 'var(--accent)', bg: 'rgba(74,163,255,0.12)', border: 'rgba(74,163,255,0.28)' },
    web_discovered: { label: 'Web', color: 'var(--warning)', bg: 'rgba(255,204,102,0.12)', border: 'rgba(255,204,102,0.28)' },
  }
  const c = config[source] ?? config.manual
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.15rem 0.5rem', borderRadius: 99, fontSize: '0.6875rem', fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

function downloadMd(domain: DomainKnowledge) {
  const blob = new Blob([domain.contentMarkdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${domain.domainKey || domain.domainName.toLowerCase().replace(/\s+/g, '-')}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DomainLibraryPage() {
  const [domains, setDomains] = useState<DomainKnowledge[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [selectedDomain, setSelectedDomain] = useState<DomainKnowledge | null>(null)
  const [editMarkdown, setEditMarkdown] = useState('')
  const [splitView, setSplitView] = useState<'editor' | 'preview' | 'split'>('split')
  const [deleteTarget, setDeleteTarget] = useState<DomainKnowledge | null>(null)
  const [saving, setSaving] = useState(false)

  const loadDomains = useCallback(async () => {
    const all = await domainKnowledgeStore.list()
    setDomains(all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, [])

  useEffect(() => { loadDomains() }, [loadDomains])

  const filtered = domains.filter((d) => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || d.domainName.toLowerCase().includes(q) || d.contentMarkdown.toLowerCase().includes(q)
    const matchSource = !filterSource || d.source === filterSource
    return matchSearch && matchSource
  })

  const openDomain = (domain: DomainKnowledge) => {
    setSelectedDomain(domain)
    setEditMarkdown(domain.contentMarkdown)
  }

  const handleSave = async () => {
    if (!selectedDomain) return
    setSaving(true)
    try {
      const updated = await domainKnowledgeStore.update({ ...selectedDomain, contentMarkdown: editMarkdown })
      setSelectedDomain(updated)
      await loadDomains()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await domainKnowledgeStore.delete(deleteTarget.id)
    setDeleteTarget(null)
    if (selectedDomain?.id === deleteTarget.id) setSelectedDomain(null)
    await loadDomains()
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Domain Library</h1>
          <p className="text-muted text-sm">{domains.length} domain{domains.length !== 1 ? 's' : ''} saved</p>
        </div>
        <a href="/pm-knowledge-skill-studio/domain-builder" className="btn btn-primary">
          <Plus size={15} /> Build New Domain
        </a>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search domains..." />
        </div>
        <select className="select" style={{ width: 'auto' }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="curated">Curated</option>
          <option value="manual">Manual</option>
          <option value="ai_assisted">AI Assisted</option>
          <option value="web_discovered">Web Discovered</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDomain ? '280px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* List */}
        <div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={40} />}
              title="No domains yet"
              description="Use the Domain Builder to add structured domain knowledge."
              action={<a href="/pm-knowledge-skill-studio/domain-builder" className="btn btn-primary"><Plus size={14} /> Domain Builder</a>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filtered.map((d) => (
                <div
                  key={d.id}
                  className="card card-clickable"
                  style={{ borderColor: selectedDomain?.id === d.id ? 'rgba(74,163,255,0.5)' : undefined, background: selectedDomain?.id === d.id ? 'rgba(74,163,255,0.06)' : undefined }}
                  onClick={() => openDomain(d)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1 }} className="truncate">{d.domainName}</span>
                    <SourceBadge source={d.source} />
                  </div>
                  <div className="text-xs text-muted" style={{ marginBottom: '0.375rem' }}>{formatDate(d.updatedAt)}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {d.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.625rem' }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm" onClick={() => downloadMd(d)}><Download size={12} /> Export</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)}><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor/Preview */}
        {selectedDomain && (
          <div className="panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{selectedDomain.domainName}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem', alignItems: 'center' }}>
                  <SourceBadge source={selectedDomain.source} />
                  <span className="text-xs text-muted">Updated {formatDate(selectedDomain.updatedAt)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div className="tab-list" style={{ marginBottom: 0, borderBottom: 'none' }}>
                  {(['editor', 'split', 'preview'] as const).map((v) => (
                    <button key={v} className={`tab-item${splitView === v ? ' tab-item-active' : ''}`} onClick={() => setSplitView(v)}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => downloadMd({ ...selectedDomain, contentMarkdown: editMarkdown })}><Download size={13} /> Export</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDomain(null)}>Close</button>
              </div>
            </div>

            {selectedDomain.sourceLinks && selectedDomain.sourceLinks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {selectedDomain.sourceLinks.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                    <ExternalLink size={12} /> Source {i + 1}
                  </a>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: splitView === 'split' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              {(splitView === 'editor' || splitView === 'split') && (
                <div>
                  {splitView === 'split' && <div className="form-label" style={{ marginBottom: '0.5rem' }}>Editor</div>}
                  <MarkdownEditor value={editMarkdown} onChange={setEditMarkdown} minHeight={400} showCharCount />
                </div>
              )}
              {(splitView === 'preview' || splitView === 'split') && (
                <div>
                  {splitView === 'split' && <div className="form-label" style={{ marginBottom: '0.5rem' }}>Preview</div>}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', minHeight: 400, maxHeight: 600, overflowY: 'auto' }}>
                    <MarkdownPreview content={editMarkdown} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete Domain"
        message={`Are you sure you want to delete "${deleteTarget?.domainName}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
