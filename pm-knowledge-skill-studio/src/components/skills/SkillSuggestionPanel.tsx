import React from 'react'
import { Check, X, CheckCheck, Lightbulb, Tag, Globe } from 'lucide-react'
import MaturityBadge from '../ui/MaturityBadge'
import type { SuggestedSkill, SkillMaturityLevel } from '../../types'

interface SkillSuggestionPanelProps {
  suggestedSkills: SuggestedSkill[]
  onAccept: (skill: SuggestedSkill) => void
  onAcceptAll: () => void
  onReject: (skillId: string) => void
  acceptedSkillIds: string[]
}

// ---------------------------------------------------------------------------
// Category color map (mirrors SkillBadge)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  Technical: 'var(--accent)',
  Leadership: '#bc82ff',
  Communication: 'var(--success)',
  Strategy: '#ffa040',
  Process: 'var(--warning)',
  Analytics: '#40c8ff',
  'Stakeholder Management': '#ff82b4',
  Other: 'var(--muted)',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? 'var(--muted)'
}

// ---------------------------------------------------------------------------
// Individual skill card
// ---------------------------------------------------------------------------

interface SkillCardProps {
  skill: SuggestedSkill
  isAccepted: boolean
  onAccept: () => void
  onReject: () => void
}

function SkillCard({ skill, isAccepted, onAccept, onReject }: SkillCardProps) {
  const categoryColor = getCategoryColor(skill.category)

  return (
    <div
      style={{
        background: isAccepted
          ? 'linear-gradient(135deg, rgba(126,231,135,0.07), rgba(126,231,135,0.03))'
          : 'var(--panel)',
        border: isAccepted
          ? '1px solid rgba(126,231,135,0.3)'
          : '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'border-color var(--transition), background var(--transition)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {/* Category color dot */}
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: categoryColor,
            flexShrink: 0,
            marginTop: '0.3rem',
          }}
          title={skill.category}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginBottom: '0.2rem',
            }}
          >
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              {skill.name}
            </span>

            {/* Category badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.15rem 0.45rem',
                borderRadius: 99,
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: `${categoryColor}18`,
                color: categoryColor,
                border: `1px solid ${categoryColor}40`,
                whiteSpace: 'nowrap',
              }}
            >
              <Tag size={9} />
              {skill.category}
            </span>

            {/* Maturity badge */}
            <MaturityBadge level={skill.maturityLevel as SkillMaturityLevel} size="sm" />

            {/* Cross-domain indicator */}
            {skill.isCrossDomainSkill && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 99,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  background: 'rgba(255,204,102,0.1)',
                  color: 'var(--warning)',
                  border: '1px solid rgba(255,204,102,0.28)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Globe size={9} />
                Cross-domain
              </span>
            )}
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            {skill.description}
          </p>
        </div>
      </div>

      {/* Why suggested */}
      {skill.whySuggested && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <Lightbulb
            size={13}
            style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '0.1rem' }}
          />
          <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: 'var(--text)', marginRight: '0.25rem' }}>
              Why suggested:
            </span>
            {skill.whySuggested}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
        {isAccepted ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--success)',
            }}
          >
            <Check size={14} />
            Accepted
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onReject}
              className="btn btn-ghost btn-sm"
              aria-label={`Reject skill ${skill.name}`}
              style={{ color: 'var(--error)', borderColor: 'transparent' }}
            >
              <X size={13} />
              Reject
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="btn btn-secondary btn-sm"
              aria-label={`Accept skill ${skill.name}`}
              style={{ borderColor: 'rgba(126,231,135,0.3)', color: 'var(--success)' }}
            >
              <Check size={13} />
              Accept
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export default function SkillSuggestionPanel({
  suggestedSkills,
  onAccept,
  onAcceptAll,
  onReject,
  acceptedSkillIds,
}: SkillSuggestionPanelProps) {
  const pendingCount = suggestedSkills.filter(
    (s) => !acceptedSkillIds.includes(s.id),
  ).length

  if (suggestedSkills.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}
      >
        No skill suggestions available.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            {suggestedSkills.length} suggested
            {pendingCount > 0 && ` · ${pendingCount} pending review`}
            {acceptedSkillIds.length > 0 && ` · ${acceptedSkillIds.length} accepted`}
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            type="button"
            onClick={onAcceptAll}
            className="btn btn-secondary btn-sm"
            style={{ borderColor: 'rgba(126,231,135,0.3)', color: 'var(--success)' }}
          >
            <CheckCheck size={13} />
            Accept All ({pendingCount})
          </button>
        )}
      </div>

      {/* Skill cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {suggestedSkills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            isAccepted={acceptedSkillIds.includes(skill.id)}
            onAccept={() => onAccept(skill)}
            onReject={() => onReject(skill.id)}
          />
        ))}
      </div>
    </div>
  )
}
