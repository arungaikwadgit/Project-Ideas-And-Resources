import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw, BookOpen, Eye, EyeOff, Filter } from 'lucide-react'
import { aiRunStore } from '../stores/aiRunStore'
import { knowledgeStore } from '../stores/knowledgeStore'
import type { AIRun } from '../types'
import PageHeader from '../components/layout/PageHeader'
import EmptyState from '../components/ui/EmptyState'
import MarkdownPreview from '../components/editor/MarkdownPreview'

type StatusFilter = 'all' | 'success' | 'failed' | 'blocked' | 'running'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadgeStyle(status: AIRun['status']): React.CSSProperties {
  switch (status) {
    case 'success':
      return { background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(126,231,135,0.3)' }
    case 'failed':
      return { background: 'var(--error-dim)', color: 'var(--error)', border: '1px solid rgba(255,107,107,0.3)' }
    case 'blocked':
      return { background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(255,204,102,0.3)' }
    case 'running':
      return { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(74,163,255,0.3)' }
    case 'draft':
    default:
      return { background: 'rgba(169,180,201,0.12)', color: 'var(--muted)', border: '1px solid rgba(169,180,201,0.25)' }
  }
}

interface RunCardProps {
  run: AIRun
  expanded: boolean
  onToggle: () => void
  onSaveAsKnowledge: (run: AIRun) => void
  onDownload: (run: AIRun) => void
  saving: boolean
}

function RunCard({ run, expanded, onToggle, onSaveAsKnowledge, onDownload, saving }: RunCardProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const truncatedPrompt = run.promptSnapshotMarkdown.replace(/[#*_`>\[\]]/g, '').slice(0, 100)

  return (
    <div
      className="card"
      style={{ cursor: 'default' }}
    >
      {/* Card header — clickable to expand */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          cursor: 'pointer',
        }}
      >
        {/* Status badge */}
        <span
          style={{
            ...statusBadgeStyle(run.status),
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            borderRadius: 'var(--radius-sm)',
            flexShrink: 0,
            marginTop: '0.1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {run.status}
        </span>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{run.providerId}</span>
            <span className="text-muted" style={{ fontSize: '0.8125rem' }}>/</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{run.model}</span>
          </div>
          <p
            className="text-sm text-muted"
            style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {truncatedPrompt}
            {run.promptSnapshotMarkdown.replace(/[#*_`>\[\]]/g, '').length > 100 ? '…' : ''}
          </p>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-muted" style={{ flexShrink: 0, marginTop: '0.125rem' }}>
          {formatDateTime(run.createdAt)}
        </span>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          {/* Prompt Snapshot accordion */}
          <div style={{ marginBottom: '1rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPrompt((p) => !p)}
              style={{ marginBottom: showPrompt ? '0.75rem' : 0 }}
            >
              {showPrompt ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPrompt ? 'Hide' : 'Show'} Prompt Snapshot
            </button>
            {showPrompt && (
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                <MarkdownPreview content={run.promptSnapshotMarkdown} />
              </div>
            )}
          </div>

          {/* Result */}
          {run.resultMarkdown ? (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Result
              </div>
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.15)',
                  maxHeight: 400,
                  overflowY: 'auto',
                }}
              >
                <MarkdownPreview content={run.resultMarkdown} />
              </div>
            </div>
          ) : run.errorSummary ? (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'var(--error-dim)',
                borderRadius: 'var(--radius)',
                border: '1px solid rgba(255,107,107,0.2)',
                fontSize: '0.875rem',
                color: 'var(--error)',
              }}
            >
              <strong>Error:</strong> {run.errorSummary}
            </div>
          ) : null}

          {/* Token usage */}
          {run.usageEstimate && (
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {run.usageEstimate.inputTokens !== undefined && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{run.usageEstimate.inputTokens.toLocaleString()}</span> input tokens
                </div>
              )}
              {run.usageEstimate.outputTokens !== undefined && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{run.usageEstimate.outputTokens.toLocaleString()}</span> output tokens
                </div>
              )}
              {run.usageEstimate.totalTokens !== undefined && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{run.usageEstimate.totalTokens.toLocaleString()}</span> total tokens
                </div>
              )}
              {run.usageEstimate.estimatedCostUsd !== undefined && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>${run.usageEstimate.estimatedCostUsd.toFixed(4)}</span> estimated cost
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {run.status === 'success' && run.resultMarkdown && !run.savedAsKnowledgeId && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onSaveAsKnowledge(run)}
                disabled={saving}
              >
                <BookOpen size={14} />
                {saving ? 'Saving…' : 'Save as Knowledge'}
              </button>
            )}
            {run.savedAsKnowledgeId && (
              <span style={{ fontSize: '0.8125rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ✓ Saved to Knowledge Library
              </span>
            )}
            {run.resultMarkdown && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onDownload(run)}
              >
                <Download size={14} />
                Download Result
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'running', label: 'Running' },
]

export default function AIRunsPage() {
  const [runs, setRuns] = useState<AIRun[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const loadRuns = useCallback(async () => {
    setLoading(true)
    try {
      const all = await aiRunStore.list()
      setRuns(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

  const filteredRuns = runs.filter((r) => statusFilter === 'all' || r.status === statusFilter)

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleSaveAsKnowledge = async (run: AIRun) => {
    setSavingId(run.id)
    try {
      const note = await knowledgeStore.create({
        title: `AI Run — ${run.providerId}/${run.model} (${new Date(run.createdAt).toLocaleDateString()})`,
        contentMarkdown: run.resultMarkdown,
        category: 'AI Run',
        tags: ['ai-run', run.providerId, run.model],
        isFavorite: false,
        linkedSkillIds: run.linkedSkillIds,
        linkedDomainIds: run.linkedDomainIds,
        linkedPlaybookIds: run.linkedPlaybookIds,
        linkedAiRunIds: [run.id],
        linkedProjectIds: run.linkedProjectId ? [run.linkedProjectId] : [],
      })
      await aiRunStore.update({ ...run, savedAsKnowledgeId: note.id })
      await loadRuns()
    } finally {
      setSavingId(null)
    }
  }

  const handleDownload = (run: AIRun) => {
    const filename = `ai-run-${run.id.slice(0, 8)}-${new Date(run.createdAt).toISOString().slice(0, 10)}.md`
    const content = `# AI Run — ${run.providerId}/${run.model}\n\n**Status:** ${run.status}  \n**Date:** ${formatDateTime(run.createdAt)}\n\n---\n\n## Result\n\n${run.resultMarkdown}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const successCount = runs.filter((r) => r.status === 'success').length
  const failedCount = runs.filter((r) => r.status === 'failed').length
  const blockedCount = runs.filter((r) => r.status === 'blocked').length

  return (
    <div className="page-container">
      <PageHeader
        title="AI Runs"
        subtitle="History of all AI prompt executions"
        actions={
          <button className="btn btn-secondary" onClick={loadRuns} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Summary stats */}
      {runs.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{runs.length}</div>
            <div className="text-sm text-muted">Total Runs</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{successCount}</div>
            <div className="text-sm text-muted">Successful</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{failedCount}</div>
            <div className="text-sm text-muted">Failed</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: 120, padding: '0.875rem 1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{blockedCount}</div>
            <div className="text-sm text-muted">Blocked</div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <Filter size={14} style={{ color: 'var(--muted)' }} />
        <span className="text-sm text-muted">Filter:</span>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${statusFilter === f.value ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Run list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : filteredRuns.length === 0 ? (
        <EmptyState
          title={
            statusFilter === 'all'
              ? 'No AI runs yet'
              : `No ${statusFilter} runs`
          }
          description={
            statusFilter === 'all'
              ? 'No AI runs yet. Run a prompt from SDLC Workspace or Prompt Packs.'
              : `No runs with status "${statusFilter}". Try a different filter.`
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {filteredRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              expanded={expandedId === run.id}
              onToggle={() => handleToggle(run.id)}
              onSaveAsKnowledge={handleSaveAsKnowledge}
              onDownload={handleDownload}
              saving={savingId === run.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
