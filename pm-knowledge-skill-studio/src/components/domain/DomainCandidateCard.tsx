import React from 'react'
import { ExternalLink, Eye, CheckSquare, Square, Globe, BookOpen, Wand2 } from 'lucide-react'
import type { CandidateDomain } from '../../types'

interface DomainCandidateCardProps {
  domain: CandidateDomain
  selected: boolean
  onToggle: (domain: CandidateDomain) => void
  onPreview?: (domain: CandidateDomain) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  'Finance': '#ffa040',
  'Healthcare': '#7ee787',
  'Technology': '#4aa3ff',
  'E-commerce': '#ff82b4',
  'Education': '#bc82ff',
  'Logistics': '#ffcc66',
  'Manufacturing': '#40c8ff',
  'Real Estate': '#ff6b6b',
  'Media': '#a9b4c9',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'var(--accent)'
}

function SourceBadge({ source }: { source: CandidateDomain['source'] }) {
  if (source === 'curated') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.5rem',
          borderRadius: 99,
          fontSize: '0.6875rem',
          fontWeight: 600,
          background: 'rgba(126,231,135,0.12)',
          color: 'var(--success)',
          border: '1px solid rgba(126,231,135,0.28)',
          whiteSpace: 'nowrap',
        }}
      >
        <BookOpen size={10} />
        Curated
      </span>
    )
  }

  if (source === 'web_discovered') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.5rem',
          borderRadius: 99,
          fontSize: '0.6875rem',
          fontWeight: 600,
          background: 'rgba(74,163,255,0.12)',
          color: 'var(--accent)',
          border: '1px solid rgba(74,163,255,0.28)',
          whiteSpace: 'nowrap',
        }}
      >
        <Globe size={10} />
        Web
      </span>
    )
  }

  // custom
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.15rem 0.5rem',
        borderRadius: 99,
        fontSize: '0.6875rem',
        fontWeight: 600,
        background: 'rgba(188,130,255,0.12)',
        color: '#bc82ff',
        border: '1px solid rgba(188,130,255,0.28)',
        whiteSpace: 'nowrap',
      }}
    >
      <Wand2 size={10} />
      Custom
    </span>
  )
}

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--warning)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color,
          minWidth: '2.5rem',
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  )
}

export default function DomainCandidateCard({
  domain,
  selected,
  onToggle,
  onPreview,
}: DomainCandidateCardProps) {
  const categoryColor = getCategoryColor(domain.category)

  return (
    <div
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(74,163,255,0.08), rgba(74,163,255,0.04))'
          : 'var(--panel)',
        border: selected
          ? '1px solid rgba(74,163,255,0.4)'
          : '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'border-color var(--transition), background var(--transition)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Checkbox toggle */}
        <button
          type="button"
          onClick={() => onToggle(domain)}
          aria-label={selected ? `Deselect ${domain.name}` : `Select ${domain.name}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: selected ? 'var(--accent)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '0.1rem',
            flexShrink: 0,
            marginTop: '0.125rem',
            transition: 'color var(--transition)',
          }}
        >
          {selected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>

        {/* Title and badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--text)',
                lineHeight: 1.3,
              }}
            >
              {domain.name}
            </span>

            {/* Category badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.15rem 0.5rem',
                borderRadius: 99,
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: `${categoryColor}18`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`,
                whiteSpace: 'nowrap',
              }}
            >
              {domain.category}
            </span>

            <SourceBadge source={domain.source} />
          </div>

          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {domain.description}
          </p>
        </div>

        {/* Preview button */}
        {onPreview && (
          <button
            type="button"
            onClick={() => onPreview(domain)}
            aria-label={`Preview ${domain.name}`}
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0, padding: '0.35rem 0.5rem' }}
          >
            <Eye size={14} />
            Preview
          </button>
        )}
      </div>

      {/* Relevance score bar */}
      <div>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            marginBottom: '0.3rem',
          }}
        >
          Relevance
        </div>
        <RelevanceBar score={domain.relevanceScore} />
      </div>

      {/* Why suggested */}
      {domain.whySuggested && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: '0.25rem' }}>
            Why suggested:
          </span>
          {domain.whySuggested}
        </div>
      )}

      {/* Source links */}
      {domain.sourceLinks && domain.sourceLinks.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {domain.sourceLinks.map((link, i) => (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.75rem',
                color: 'var(--accent)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'
              }}
            >
              <ExternalLink size={10} />
              Source {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
