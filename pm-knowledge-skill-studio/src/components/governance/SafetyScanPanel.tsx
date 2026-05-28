import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { GovernanceResult, GovernanceCheck } from '../../types'

interface SafetyScanPanelProps {
  result: GovernanceResult
  onProceedWithCaution?: () => void
  loading?: boolean
}

function CheckRow({ check }: { check: GovernanceCheck }) {
  const [expanded, setExpanded] = React.useState(false)
  const hasEvidence = !!check.evidenceSnippet

  const iconProps = { size: 15, style: { flexShrink: 0 } }
  const StatusIcon =
    check.status === 'passed'
      ? () => <CheckCircle2 {...iconProps} style={{ ...iconProps.style, color: 'var(--success)' }} />
      : check.status === 'warning'
      ? () => <AlertTriangle {...iconProps} style={{ ...iconProps.style, color: 'var(--warning)' }} />
      : () => <XCircle {...iconProps} style={{ ...iconProps.style, color: 'var(--error)' }} />

  const textColor =
    check.status === 'passed'
      ? 'var(--success)'
      : check.status === 'warning'
      ? 'var(--warning)'
      : 'var(--error)'

  return (
    <div
      style={{
        padding: '0.625rem 0.75rem',
        borderRadius: 'var(--radius)',
        background:
          check.status === 'passed'
            ? 'rgba(126,231,135,0.05)'
            : check.status === 'warning'
            ? 'rgba(255,204,102,0.05)'
            : 'rgba(255,107,107,0.07)',
        border: `1px solid ${
          check.status === 'passed'
            ? 'rgba(126,231,135,0.15)'
            : check.status === 'warning'
            ? 'rgba(255,204,102,0.2)'
            : 'rgba(255,107,107,0.25)'
        }`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <StatusIcon />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: textColor,
              }}
            >
              {check.name}
            </span>
            {hasEvidence && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  flexShrink: 0,
                }}
                aria-label={expanded ? 'Hide evidence' : 'Show evidence'}
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              margin: '0.2rem 0 0',
              lineHeight: 1.4,
            }}
          >
            {check.message}
          </p>
          {expanded && check.evidenceSnippet && (
            <pre
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.5,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {check.evidenceSnippet}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SafetyScanPanel({
  result,
  onProceedWithCaution,
  loading = false,
}: SafetyScanPanelProps) {
  const blockedChecks = result.checks.filter((c) => c.status === 'blocked')
  const warningChecks = result.checks.filter((c) => c.status === 'warning')
  const passedChecks = result.checks.filter((c) => c.status === 'passed')

  if (loading) {
    return (
      <div
        className="panel"
        style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        <div className="loading-spinner loading-spinner-sm" />
        <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
          Running governance scan…
        </span>
      </div>
    )
  }

  return (
    <div
      className="panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        borderColor:
          result.severity === 'blocked'
            ? 'rgba(255,107,107,0.35)'
            : result.severity === 'warning'
            ? 'rgba(255,204,102,0.3)'
            : 'rgba(126,231,135,0.2)',
      }}
    >
      {/* Header status banner */}
      {result.severity === 'none' && (
        <div
          className="alert alert-success"
          style={{ alignItems: 'center' }}
        >
          <ShieldCheck size={16} />
          <strong>All Clear</strong> — All governance checks passed. Safe to proceed.
        </div>
      )}

      {result.severity === 'warning' && (
        <div
          className="alert alert-warning"
          style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.375rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} />
            <strong>Warnings Detected</strong>
          </div>
          <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {result.warningReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {result.severity === 'blocked' && (
        <div
          className="alert alert-error"
          style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.375rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <XCircle size={16} />
            <strong>Execution Blocked</strong>
          </div>
          <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {result.blockedReasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Check groups */}
      {blockedChecks.length > 0 && (
        <section>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--error)',
              marginBottom: '0.5rem',
            }}
          >
            Blocked ({blockedChecks.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {blockedChecks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </div>
        </section>
      )}

      {warningChecks.length > 0 && (
        <section>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--warning)',
              marginBottom: '0.5rem',
            }}
          >
            Warnings ({warningChecks.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {warningChecks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </div>
        </section>
      )}

      {passedChecks.length > 0 && (
        <section>
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--success)',
              marginBottom: '0.5rem',
            }}
          >
            Passed ({passedChecks.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {passedChecks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended fixes */}
      {result.recommendedFixes.length > 0 && (
        <section
          style={{
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.5rem',
            }}
          >
            <Wrench size={13} style={{ color: 'var(--muted)' }} />
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--muted)',
              }}
            >
              Recommended Fixes
            </span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {result.recommendedFixes.map((fix, i) => (
              <li
                key={i}
                style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.2rem' }}
              >
                {fix}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Action buttons */}
      {result.severity === 'warning' && onProceedWithCaution && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onProceedWithCaution}
            style={{
              borderColor: 'rgba(255,204,102,0.4)',
              color: 'var(--warning)',
            }}
          >
            <AlertTriangle size={14} />
            Proceed with Caution
          </button>
        </div>
      )}

      {result.severity === 'blocked' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              fontSize: '0.8125rem',
              color: 'var(--error)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <XCircle size={14} />
            Execution Blocked — resolve issues above to continue
          </span>
        </div>
      )}
    </div>
  )
}
