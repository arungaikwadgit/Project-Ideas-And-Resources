import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: string
  onClick?: () => void
  trend?: { value: number; label: string }
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = 'var(--accent)',
  onClick,
  trend,
}: DashboardCardProps) {
  const isClickable = !!onClick

  const TrendIcon =
    trend === undefined
      ? null
      : trend.value > 0
      ? TrendingUp
      : trend.value < 0
      ? TrendingDown
      : Minus

  const trendColor =
    trend === undefined
      ? undefined
      : trend.value > 0
      ? 'var(--success)'
      : trend.value < 0
      ? 'var(--error)'
      : 'var(--muted)'

  return (
    <div
      className={`card${isClickable ? ' card-clickable' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
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
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              color,
              display: 'flex',
              alignItems: 'center',
              opacity: 0.85,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>

      {/* Subtitle / Trend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.25rem',
          flexWrap: 'wrap',
        }}
      >
        {subtitle && (
          <span style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
            {subtitle}
          </span>
        )}
        {trend && TrendIcon && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.75rem',
              color: trendColor,
              fontWeight: 500,
            }}
          >
            <TrendIcon size={13} />
            {trend.value > 0 ? '+' : ''}
            {trend.value} {trend.label}
          </span>
        )}
      </div>

      {/* Color accent bar at bottom */}
      <div
        style={{
          height: 3,
          borderRadius: 2,
          background: color,
          opacity: 0.35,
          marginTop: '0.75rem',
        }}
      />
    </div>
  )
}
