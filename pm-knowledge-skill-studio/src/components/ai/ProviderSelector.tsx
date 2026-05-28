import React from 'react'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { useConfig } from '../../hooks/useConfig'
import type { AIProviderConfig } from '../../types'

interface ProviderSelectorProps {
  /** Currently selected provider ID */
  selectedProviderId: string | null
  /** Called when the user changes the provider */
  onChange: (provider: AIProviderConfig) => void
  /** Optional: disable the selector */
  disabled?: boolean
  /** Optional: show inline descriptions */
  showDescription?: boolean
}

/**
 * Dropdown that loads the list of AI providers from `aiProviders.json` and
 * lets the user select one. Shows the selected provider's metadata (docs link,
 * whether an API key is required) below the dropdown.
 */
export default function ProviderSelector({
  selectedProviderId,
  onChange,
  disabled = false,
  showDescription = true,
}: ProviderSelectorProps) {
  const { data: providers, loading, error } = useConfig<AIProviderConfig[]>('aiProviders.json')

  const selectedProvider =
    providers?.find((p) => p.id === selectedProviderId) ?? null

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const provider = providers?.find((p) => p.id === e.target.value)
    if (provider) onChange(provider)
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--muted)',
          fontSize: '0.875rem',
        }}
      >
        <div className="loading-spinner loading-spinner-sm" />
        Loading providers…
      </div>
    )
  }

  if (error || !providers) {
    return (
      <div className="alert alert-error" style={{ fontSize: '0.875rem' }}>
        <AlertCircle size={14} />
        Failed to load AI providers: {error ?? 'Unknown error'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {/* Dropdown */}
      <select
        className="select"
        value={selectedProviderId ?? ''}
        onChange={handleChange}
        disabled={disabled || providers.length === 0}
        aria-label="Select AI provider"
      >
        <option value="" disabled>
          — Select a provider —
        </option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.displayName}
          </option>
        ))}
      </select>

      {/* Selected provider metadata */}
      {showDescription && selectedProvider && (
        <div
          style={{
            padding: '0.625rem 0.75rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {selectedProvider.description}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.625rem',
              marginTop: '0.25rem',
            }}
          >
            {/* Requires API key */}
            {selectedProvider.requiresApiKey ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <AlertCircle size={11} />
                Requires API key
                {selectedProvider.keyEnvHint && (
                  <code
                    style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255,204,102,0.1)',
                      color: 'var(--warning)',
                      border: '1px solid rgba(255,204,102,0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.05rem 0.3rem',
                    }}
                  >
                    {selectedProvider.keyEnvHint}
                  </code>
                )}
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                No API key required
              </span>
            )}

            {/* Docs link */}
            {selectedProvider.docsUrl && (
              <a
                href={selectedProvider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'
                }}
              >
                <ExternalLink size={10} />
                Docs
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
