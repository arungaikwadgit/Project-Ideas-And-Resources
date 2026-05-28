import React from 'react'
import type { SkillMaturityLevel } from '../../types'

interface MaturityBadgeProps {
  level: SkillMaturityLevel
  size?: 'sm' | 'md'
}

const MATURITY_CONFIG: Record<
  SkillMaturityLevel,
  { bg: string; color: string; border: string }
> = {
  Beginner: {
    bg: 'rgba(169, 180, 201, 0.12)',
    color: '#a9b4c9',
    border: 'rgba(169, 180, 201, 0.25)',
  },
  Developing: {
    bg: 'rgba(74, 163, 255, 0.12)',
    color: '#4aa3ff',
    border: 'rgba(74, 163, 255, 0.28)',
  },
  Proficient: {
    bg: 'rgba(126, 231, 135, 0.12)',
    color: '#7ee787',
    border: 'rgba(126, 231, 135, 0.28)',
  },
  Advanced: {
    bg: 'rgba(255, 160, 64, 0.12)',
    color: '#ffa040',
    border: 'rgba(255, 160, 64, 0.28)',
  },
  Expert: {
    bg: 'rgba(188, 130, 255, 0.12)',
    color: '#bc82ff',
    border: 'rgba(188, 130, 255, 0.28)',
  },
}

export default function MaturityBadge({ level, size = 'md' }: MaturityBadgeProps) {
  const config = MATURITY_CONFIG[level]
  const fontSize = size === 'sm' ? '0.6875rem' : '0.75rem'
  const padding = size === 'sm' ? '0.15rem 0.45rem' : '0.2rem 0.55rem'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding,
        borderRadius: 99,
        fontSize,
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {level}
    </span>
  )
}
