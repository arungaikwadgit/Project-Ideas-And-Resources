import React, { useRef, useCallback, useEffect } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  minHeight?: number
  showCharCount?: boolean
}

export default function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown…',
  minHeight = 160,
  showCharCount = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`
  }, [minHeight])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    resize()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 2 spaces instead of focusing next element
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart
      const end = el.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        el.selectionStart = start + 2
        el.selectionEnd = start + 2
      })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {label && (
        <label
          htmlFor="md-editor"
          className="form-label"
        >
          {label}
        </label>
      )}
      <textarea
        id="md-editor"
        ref={textareaRef}
        className="textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck
        style={{
          minHeight,
          resize: 'vertical',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          overflow: 'hidden',
        }}
        aria-label={label ?? 'Markdown editor'}
      />
      {showCharCount && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            fontSize: '0.75rem',
            color: 'var(--muted)',
            opacity: 0.7,
          }}
        >
          {value.length.toLocaleString()} characters
        </div>
      )}
    </div>
  )
}
