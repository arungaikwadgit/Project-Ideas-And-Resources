import React from 'react'
import { X, Layers } from 'lucide-react'
import type { CandidateDomain } from '../../types'

interface MultiDomainSelectorProps {
  /** All candidate domains available for selection */
  candidates: CandidateDomain[]
  /** Currently selected domains */
  selectedDomains: CandidateDomain[]
  /** Called when the user removes a domain by clicking its pill's X button */
  onRemove: (domainId: string) => void
  /** Optional: called when the user clicks a pill label (e.g. to open preview) */
  onPillClick?: (domain: CandidateDomain) => void
  /** Max number of domains that can be selected simultaneously */
  maxSelections?: number
}

/**
 * Displays the currently-selected domains as removable pills and shows a
 * summary line listing their names.
 */
export default function MultiDomainSelector({
  selectedDomains,
  onRemove,
  onPillClick,
  maxSelections,
}: MultiDomainSelectorProps) {
  const count = selectedDomains.length
  const atMax = maxSelections !== undefined && count >= maxSelections

  if (count === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.75rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}
      >
        <Layers size={15} style={{ flexShrink: 0, opacity: 0.5 }} />
        <span>No domains selected — select one or more from the list below.</span>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Summary header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            {count} domain{count !== 1 ? 's' : ''} selected
          </span>
        </div>

        {maxSelections !== undefined && (
          <span
            style={{
              fontSize: '0.75rem',
              color: atMax ? 'var(--warning)' : 'var(--muted)',
              fontWeight: atMax ? 600 : 400,
            }}
          >
            {count} / {maxSelections}
            {atMax && ' — maximum reached'}
          </span>
        )}
      </div>

      {/* Pills */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        {selectedDomains.map((domain) => (
          <DomainPill
            key={domain.id}
            domain={domain}
            onRemove={() => onRemove(domain.id)}
            onClick={onPillClick ? () => onPillClick(domain) : undefined}
          />
        ))}
      </div>

      {/* Combined names summary */}
      {count > 1 && (
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
            margin: 0,
            borderTop: '1px solid var(--border)',
            paddingTop: '0.625rem',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>Combined: </span>
          {selectedDomains.map((d) => d.name).join(', ')}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal domain pill component
// ---------------------------------------------------------------------------

interface DomainPillProps {
  domain: CandidateDomain
  onRemove: () => void
  onClick?: () => void
}

function DomainPill({ domain, onRemove, onClick }: DomainPillProps) {
  const sourceColor =
    domain.source === 'curated'
      ? 'var(--success)'
      : domain.source === 'web_discovered'
      ? 'var(--accent)'
      : '#bc82ff'

  const sourceBorder =
    domain.source === 'curated'
      ? 'rgba(126,231,135,0.3)'
      : domain.source === 'web_discovered'
      ? 'rgba(74,163,255,0.3)'
      : 'rgba(188,130,255,0.3)'

  const sourceBg =
    domain.source === 'curated'
      ? 'rgba(126,231,135,0.1)'
      : domain.source === 'web_discovered'
      ? 'rgba(74,163,255,0.1)'
      : 'rgba(188,130,255,0.1)'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        background: sourceBg,
        border: `1px solid ${sourceBorder}`,
        borderRadius: 99,
        overflow: 'hidden',
        maxWidth: '100%',
        flexShrink: 0,
      }}
    >
      {/* Label (optionally clickable) */}
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={onClick ? `View details for ${domain.name}` : undefined}
        style={{
          background: 'none',
          border: 'none',
          cursor: onClick ? 'pointer' : 'default',
          padding: '0.25rem 0.625rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: sourceColor,
          fontSize: '0.8125rem',
          fontWeight: 500,
          maxWidth: 220,
          minWidth: 0,
          transition: 'opacity var(--transition)',
        }}
        onMouseEnter={(e) => {
          if (onClick) (e.currentTarget as HTMLButtonElement).style.opacity = '0.75'
        }}
        onMouseLeave={(e) => {
          if (onClick) (e.currentTarget as HTMLButtonElement).style.opacity = '1'
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {domain.name}
        </span>
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove ${domain.name}`}
        style={{
          background: 'none',
          border: 'none',
          borderLeft: `1px solid ${sourceBorder}`,
          cursor: 'pointer',
          padding: '0.25rem 0.4rem',
          display: 'flex',
          alignItems: 'center',
          color: sourceColor,
          opacity: 0.6,
          transition: 'opacity var(--transition), background var(--transition)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.opacity = '1'
          btn.style.background = `${sourceBorder}`
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.opacity = '0.6'
          btn.style.background = 'none'
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}
