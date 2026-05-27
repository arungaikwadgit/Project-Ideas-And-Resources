import React, { useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
    >
      <Search
        size={15}
        style={{
          position: 'absolute',
          left: '0.75rem',
          color: 'var(--muted)',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      />
      <input
        ref={inputRef}
        type="search"
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          paddingLeft: '2.25rem',
          paddingRight: value ? '2.25rem' : '0.75rem',
        }}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '0.625rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem',
            borderRadius: 'var(--radius-sm)',
            transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
