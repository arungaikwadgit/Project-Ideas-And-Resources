import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import type { DomainKnowledge } from '../types'

const SOURCE_LABELS: Record<DomainKnowledge['source'], string> = {
  curated: 'Curated',
  ai_assisted: 'AI Assisted',
  manual: 'Manual',
  web_discovered: 'Web Discovered',
}

const SOURCE_BADGE: Record<DomainKnowledge['source'], string> = {
  curated: 'badge-accent',
  ai_assisted: 'badge-success',
  manual: 'badge-default',
  web_discovered: 'badge-warning',
}

function DomainCard({
  domain,
  onOpen,
  onDelete,
}: {
  domain: DomainKnowledge
  onOpen: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="truncate"
            style={{ fontSize: '0.9375rem', cursor: 'pointer', marginBottom: '0.25rem' }}
            onClick={onOpen}
          >
            {domain.domainName}
          </h3>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span className={`badge ${SOURCE_BADGE[domain.source]}`}>
              {SOURCE_LABELS[domain.source]}
            </span>
            {domain.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="badge badge-default">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted line-clamp-3" style={{ marginBottom: '0.75rem' }}>
        {domain.contentMarkdown.replace(/[#*`]/g, '').slice(0, 250)}
      </p>

      {domain.selectedRoleIds.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <div className="text-xs text-muted" style={{ marginBottom: '0.25rem' }}>Applicable roles:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
            {domain.selectedRoleIds.slice(0, 5).map((r) => (
              <span key={r} className="tag">{r}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="text-xs text-muted">
          Created {new Date(domain.createdAt).toLocaleDateString()}
        </span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={onOpen}>View / Edit</button>
          {domain.generatedSkillIds.length > 0 && (
            <Link to="/skills-studio" className="btn btn-ghost btn-sm">
              {domain.generatedSkillIds.length} skills
            </Link>
          )}
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

function DomainModal({
  domain,
  onClose,
  onSave,
}: {
  domain: DomainKnowledge
  onClose: () => void
  onSave: (updated: DomainKnowledge) => void
}) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(domain.contentMarkdown)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await domainKnowledgeStore.update({ ...domain, contentMarkdown: content })
      onSave(updated)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 760, width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title" style={{ flex: 1, minWidth: 0 }}>
            {domain.domainName}
          </h2>
          <span className={`badge ${SOURCE_BADGE[domain.source]}`}>{SOURCE_LABELS[domain.source]}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {editing ? (
            <textarea
              className="textarea"
              style={{ minHeight: 400, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <div
              className="markdown-content"
              style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', lineHeight: 1.7 }}
            >
              {domain.contentMarkdown}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {editing ? (
            <>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>✏️ Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DomainLibrary() {
  const [domains, setDomains] = useState<DomainKnowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSource, setFilterSource] = useState<string>('')
  const [search, setSearch] = useState('')
  const [viewingDomain, setViewingDomain] = useState<DomainKnowledge | null>(null)

  const loadDomains = useCallback(async () => {
    try {
      const all = await domainKnowledgeStore.list()
      setDomains(all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDomains() }, [loadDomains])

  const handleDelete = async (id: string) => {
    await domainKnowledgeStore.delete(id)
    setDomains((prev) => prev.filter((d) => d.id !== id))
  }

  const handleSaveDomain = (updated: DomainKnowledge) => {
    setDomains((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    setViewingDomain(updated)
  }

  const filtered = domains.filter((d) => {
    if (filterSource && d.source !== filterSource) return false
    if (search && !d.domainName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ marginBottom: '0.375rem' }}>Domain Library</h1>
          <p className="text-muted text-sm">Manage your saved domain knowledge files.</p>
        </div>
        <Link to="/domain-builder" className="btn btn-primary">+ Build New Domain</Link>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          className="input"
          placeholder="Search domains..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select className="select" style={{ width: 'auto', minWidth: 180 }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="">All sources</option>
          <option value="curated">Curated</option>
          <option value="ai_assisted">AI Assisted</option>
          <option value="manual">Manual</option>
          <option value="web_discovered">Web Discovered</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-overlay"><div className="loading-spinner" /> Loading domains...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ fontSize: '3rem' }}>🗂️</div>
          <div className="empty-state-title">{domains.length === 0 ? 'No domains yet' : 'No results'}</div>
          <div className="empty-state-description">
            {domains.length === 0
              ? 'Use the Domain Builder to add structured domain knowledge.'
              : 'Try adjusting your search or filters.'}
          </div>
          {domains.length === 0 && (
            <Link to="/domain-builder" className="btn btn-primary">🏗️ Build First Domain</Link>
          )}
        </div>
      ) : (
        <div className="grid-auto">
          {filtered.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              onOpen={() => setViewingDomain(domain)}
              onDelete={() => handleDelete(domain.id)}
            />
          ))}
        </div>
      )}

      {viewingDomain && (
        <DomainModal
          domain={viewingDomain}
          onClose={() => setViewingDomain(null)}
          onSave={handleSaveDomain}
        />
      )}
    </div>
  )
}
