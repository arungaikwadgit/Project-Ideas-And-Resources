import React, { useState, useRef, useCallback } from 'react'
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react'

interface TagSelectorProps {
  tags: string[]
  selectedTags: string[]
  onToggle: (tag: string) => void
  onAdd?: (tag: string) => void
  maxDisplay?: number
}

export default function TagSelector({
  tags,
  selectedTags,
  onToggle,
  onAdd,
  maxDisplay = 20,
}: TagSelectorProps) {
  const [newTagValue, setNewTagValue] = useState('')
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayedTags = expanded ? tags : tags.slice(0, maxDisplay)
  const hasMore = tags.length > maxDisplay

  const handleAddTag = useCallback(() => {
    const trimmed = newTagValue.trim()
    if (!trimmed) return
    if (onAdd) {
      onAdd(trimmed)
    }
    setNewTagValue('')
    inputRef.current?.focus()
  }, [newTagValue, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Tag pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {displayedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={`tag${isSelected ? ' tag-active' : ''}`}
              style={{ cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}
              aria-pressed={isSelected}
            >
              {tag}
              {isSelected && (
                <X size={10} style={{ marginLeft: '0.15rem', opacity: 0.7 }} />
              )}
            </button>
          )
        })}

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="tag"
            style={{
              cursor: 'pointer',
              border: 'none',
              fontFamily: 'inherit',
              gap: '0.2rem',
            }}
          >
            {expanded ? (
              <>
                Show less <ChevronUp size={11} />
              </>
            ) : (
              <>
                +{tags.length - maxDisplay} more <ChevronDown size={11} />
              </>
            )}
          </button>
        )}
      </div>

      {/* Selected summary */}
      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginRight: '0.25rem' }}>
            Selected:
          </span>
          {selectedTags.map((tag) => (
            <span key={tag} className="tag tag-active tag-removable">
              {tag}
              <button
                type="button"
                onClick={() => onToggle(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add new tag input */}
      {onAdd && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            className="input"
            value={newTagValue}
            onChange={(e) => setNewTagValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add new tag…"
            style={{ maxWidth: 220, fontSize: '0.8125rem', padding: '0.35rem 0.6rem' }}
            aria-label="New tag"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleAddTag}
            disabled={!newTagValue.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      )}
    </div>
  )
}
