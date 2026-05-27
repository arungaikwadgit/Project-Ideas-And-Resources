import React, { useEffect, useCallback } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'danger'
  children?: React.ReactNode
}

export default function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  children,
}: ConfirmationDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    },
    [open, onCancel, onConfirm]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!open) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {isDanger && (
              <AlertTriangle
                size={18}
                style={{ color: 'var(--error)', flexShrink: 0 }}
              />
            )}
            <h2
              id="confirm-dialog-title"
              className="modal-title"
              style={{ color: isDanger ? 'var(--error)' : 'var(--text)' }}
            >
              {title}
            </h2>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <p
            id="confirm-dialog-message"
            style={{
              color: 'var(--muted)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {message}
          </p>
          {children}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
            style={
              isDanger
                ? {
                    backgroundColor: 'var(--error)',
                    color: '#fff',
                    borderColor: 'var(--error)',
                  }
                : undefined
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
