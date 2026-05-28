import React from 'react'
import { AlertCircle, Cpu } from 'lucide-react'
import type { AIProviderConfig } from '../../types'

interface ModelOption {
  id: string
  displayName: string
  maxTokens: number
  contextWindow: number
}

interface ModelSelectorProps {
  /** The currently selected provider config (loaded from aiProviders.json) */
  provider: AIProviderConfig | null
  /** Currently selected model ID */
  selectedModelId: string | null
  /** Called when the user picks a model */
  onChange: (modelId: string) => void
  /** Optional: disable the selector */
  disabled?: boolean
  /** Show context window / max token info beneath the dropdown */
  showModelInfo?: boolean
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

/**
 * Dropdown that lists the supported models for the currently selected AI
 * provider. Shows context window and max output token info for the chosen
 * model.
 */
export default function ModelSelector({
  provider,
  selectedModelId,
  onChange,
  disabled = false,
  showModelInfo = true,
}: ModelSelectorProps) {
  if (!provider) {
    return (
      <select className="select" disabled aria-label="Select model">
        <option>— Select a provider first —</option>
      </select>
    )
  }

  const models: ModelOption[] = provider.supportedModels

  // For generic providers (no models listed), show a free-text input
  if (models.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <input
          type="text"
          className="input"
          placeholder="Enter model ID (e.g. gpt-4o)"
          value={selectedModelId ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label="Model ID"
        />
        <p className="form-hint">
          Enter the model identifier for your custom endpoint.
        </p>
      </div>
    )
  }

  const selectedModel = models.find((m) => m.id === selectedModelId) ?? null

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Dropdown */}
      <select
        className="select"
        value={selectedModelId ?? ''}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Select model"
      >
        <option value="" disabled>
          — Select a model —
        </option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.displayName}
          </option>
        ))}
      </select>

      {/* Model info card */}
      {showModelInfo && selectedModel && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Cpu size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>
              Model:
            </span>
            <code
              style={{
                fontSize: '0.75rem',
                background: 'rgba(74,163,255,0.1)',
                color: 'var(--accent)',
                border: '1px solid rgba(74,163,255,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.05rem 0.35rem',
              }}
            >
              {selectedModel.id}
            </code>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ModelStat
              label="Context window"
              value={`${formatNumber(selectedModel.contextWindow)} tokens`}
            />
            <ModelStat
              label="Max output"
              value={`${formatNumber(selectedModel.maxTokens)} tokens`}
            />
          </div>
        </div>
      )}

      {/* Fallback: no model selected but provider has models */}
      {!selectedModel && models.length > 0 && (
        <div
          className="alert alert-warning"
          style={{ fontSize: '0.8125rem', padding: '0.5rem 0.75rem' }}
        >
          <AlertCircle size={13} />
          Select a model to continue.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tiny stat label
// ---------------------------------------------------------------------------

function ModelStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{label}:</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
