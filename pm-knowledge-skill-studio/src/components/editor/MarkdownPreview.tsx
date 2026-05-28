import React, { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { FileText } from 'lucide-react'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

// Configure marked for safe rendering
marked.setOptions({
  gfm: true,
  breaks: true,
})

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    if (!content || !content.trim()) return ''
    const rawHtml = marked.parse(content) as string
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'div', 'span',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
      ADD_ATTR: ['target'],
    })
  }, [content])

  if (!html) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'var(--muted)',
          opacity: 0.5,
          gap: '0.5rem',
          textAlign: 'center',
        }}
      >
        <FileText size={28} />
        <span style={{ fontSize: '0.875rem' }}>No content to preview</span>
      </div>
    )
  }

  return (
    <div
      className={`markdown-content${className ? ` ${className}` : ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
