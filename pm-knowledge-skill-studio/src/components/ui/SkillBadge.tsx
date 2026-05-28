import React from 'react'
import { X } from 'lucide-react'
import MaturityBadge from './MaturityBadge'
import type { SkillMaturityLevel } from '../../types'

interface SkillBadgeSkill {
  name: string
  category: string
  maturityLevel: string
}

interface SkillBadgeProps {
  skill: SkillBadgeSkill
  onRemove?: () => void
  onClick?: () => void
}

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

export default function SkillBadge({ skill, onRemove, onClick }: SkillBadgeProps) {
  const categoryColor = getCategoryColor(skill.category)
  const isClickable = !!onClick

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.625rem',
        background: 'var(--panel)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius)',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'border-color var(--transition), background var(--transition)',
        maxWidth: '100%',
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = categoryColor
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        }
      }}
    >
      {/* Category color dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: categoryColor,
          flexShrink: 0,
        }}
        title={skill.category}
      />

      {/* Skill name */}
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          minWidth: 0,
        }}
      >
        {skill.name}
      </span>

      {/* Maturity badge */}
      <MaturityBadge
        level={skill.maturityLevel as SkillMaturityLevel}
        size="sm"
      />

      {/* Remove button */}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove skill ${skill.name}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '0.1rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--error)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
