import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import { dbList, dbCreate } from '../stores/db'
import type { DomainCatalogItem, DomainKnowledge, ActivityEvent } from '../types'
import { v4 as uuid } from 'uuid'

// ─── Domain markdown builder (inline) ───────────────────────────────────────

function buildDomainMarkdown(domain: DomainCatalogItem): string {
  return `# ${domain.name}

## Overview
${domain.description}

## Common Users
${domain.commonUsers.map((u) => `- ${u}`).join('\n')}

## Common Workflows
${domain.commonWorkflows.map((w) => `- ${w}`).join('\n')}

## Key Metrics
${domain.commonMetrics.map((m) => `- ${m}`).join('\n')}

## Common Risks
${domain.commonRisks.map((r) => `- ${r}`).join('\n')}

## Common Integrations
${domain.commonIntegrations.map((i) => `- ${i}`).join('\n')}

## Compliance Considerations
${domain.complianceConsiderations.map((c) => `- ${c}`).join('\n')}

## Related Skills
${domain.relatedSkills.map((s) => `- ${s}`).join('\n')}

## AI Prompt Context
${domain.starterPromptContext}
`
}

function buildCombinedDomainMarkdown(domains: DomainCatalogItem[]): string {
  const names = domains.map((d) => d.name).join(' + ')
  const allWorkflows = [...new Set(domains.flatMap((d) => d.commonWorkflows))]
  const allMetrics = [...new Set(domains.flatMap((d) => d.commonMetrics))]
  const allRisks = [...new Set(domains.flatMap((d) => d.commonRisks))]
  const allCompliance = [...new Set(domains.flatMap((d) => d.complianceConsiderations))]

  return `# Combined Domain: ${names}

## Overview
This domain knowledge file combines context from multiple domains: ${names}.

${domains.map((d) => `### ${d.name}\n${d.description}`).join('\n\n')}

## Combined Workflows
${allWorkflows.map((w) => `- ${w}`).join('\n')}

## Combined Metrics
${allMetrics.map((m) => `- ${m}`).join('\n')}

## Combined Risks
${allRisks.map((r) => `- ${r}`).join('\n')}

## Compliance Considerations
${allCompliance.map((c) => `- ${c}`).join('\n')}

## AI Prompt Context
${domains.map((d) => d.starterPromptContext).join('\n\n')}
`
}

// ─── Activity recording ──────────────────────────────────────────────────────

async function recordActivity(eventType: ActivityEvent['eventType'], metadata?: Record<string, unknown>) {
  const event: ActivityEvent = {
    id: uuid(),
    eventType,
    status: 'success',
    metadata,
    createdAt: new Date().toISOString(),
  }
  await dbCreate('activityEvents', event)
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  'Search Domain',
  'Review Candidates',
  'Confirm Selection',
  'Generate Markdown',
  'Review Skills',
  'Save & Complete',
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', overflowX: 'auto' }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                background:
                  i < current
                    ? 'var(--success)'
                    : i === current
                    ? 'var(--accent)'
                    : 'rgba(255,255,255,0.08)',
                color: i <= current ? '#0b1220' : 'var(--muted)',
                border: `2px solid ${i === current ? 'var(--accent)' : 'transparent'}`,
                transition: 'all 0.2s',
              }}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: i === current ? 'var(--accent)' : i < current ? 'var(--success)' : 'var(--muted)',
                fontWeight: i === current ? 600 : 400,
                whiteSpace: 'nowrap',
                maxWidth: 80,
                textAlign: 'center',
              }}
            >
              {step}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                height: 2,
                width: 40,
                background: i < current ? 'var(--success)' : 'rgba(255,255,255,0.08)',
                marginBottom: 18,
                transition: 'background 0.2s',
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DomainBuilder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [catalog, setCatalog] = useState<DomainCatalogItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedDomains, setSelectedDomains] = useState<DomainCatalogItem[]>([])
  const [generatedMarkdown, setGeneratedMarkdown] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasSearchProvider, setHasSearchProvider] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/config/domainCatalog.json')
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setError('Failed to load domain catalog.'))

    dbList('searchProviderSettings').then((settings) => {
      setHasSearchProvider((settings as unknown[]).length > 0)
    })
  }, [])

  const filteredCatalog = searchText.trim()
    ? catalog.filter(
        (d) =>
          d.name.toLowerCase().includes(searchText.toLowerCase()) ||
          d.category.toLowerCase().includes(searchText.toLowerCase()) ||
          d.description.toLowerCase().includes(searchText.toLowerCase())
      )
    : catalog

  const toggleDomain = useCallback((domain: DomainCatalogItem) => {
    setSelectedDomains((prev) =>
      prev.some((d) => d.id === domain.id)
        ? prev.filter((d) => d.id !== domain.id)
        : [...prev, domain]
    )
  }, [])

  const handleGenerate = useCallback(() => {
    if (selectedDomains.length === 0) return
    const md =
      selectedDomains.length === 1
        ? buildDomainMarkdown(selectedDomains[0])
        : buildCombinedDomainMarkdown(selectedDomains)
    setGeneratedMarkdown(md)
    recordActivity('domain_markdown_created', { domainCount: selectedDomains.length })
    setStep(4)
  }, [selectedDomains])

  const handleSave = useCallback(async () => {
    if (!generatedMarkdown || selectedDomains.length === 0) return
    setSaving(true)
    try {
      const domainName =
        selectedDomains.length === 1
          ? selectedDomains[0].name
          : selectedDomains.map((d) => d.name).join(' + ')
      const domainKey = selectedDomains.map((d) => d.id).join('_')

      await domainKnowledgeStore.create({
        domainKey,
        domainName,
        contentMarkdown: generatedMarkdown,
        selectedRoleIds: [...new Set(selectedDomains.flatMap((d) => d.suggestedRoles))],
        generatedSkillIds: [],
        linkedPromptPackIds: [],
        linkedPlaybookIds: [],
        tags: [...new Set(selectedDomains.map((d) => d.category))],
        source: 'curated',
        sourceLinks: [],
      })
      await recordActivity('domain_selected', { domainKey, domainName })
      setSaved(true)
      setStep(5)
    } catch (err) {
      console.error(err)
      setError('Failed to save domain.')
    } finally {
      setSaving(false)
    }
  }, [generatedMarkdown, selectedDomains])

  const canGoNext = () => {
    if (step === 0) return true
    if (step === 1) return selectedDomains.length > 0
    if (step === 2) return selectedDomains.length > 0
    if (step === 3) return selectedDomains.length > 0
    return false
  }

  const next = () => {
    if (step === 3) {
      handleGenerate()
      return
    }
    if (step === 4) {
      handleSave()
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.375rem' }}>Domain Builder</h1>
        <p className="text-muted text-sm">
          Add structured domain knowledge that enriches your AI prompts, skills, and playbooks.
        </p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Step 0: Search / Select */}
      {step === 0 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.0625rem' }}>Search or select a domain</h2>
            {!hasSearchProvider && (
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                <span>🔍</span>
                <div>
                  <strong>No search provider configured.</strong> You can browse curated domains below, or{' '}
                  <a href="/provider-settings">configure a search provider</a> for AI-powered web discovery.
                </div>
              </div>
            )}
            <input
              className="input"
              placeholder="Search domains by name, category, or keywords..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
              {filteredCatalog.length} curated domains available
            </div>
          </div>

          <div className="grid-auto">
            {filteredCatalog.map((domain) => {
              const selected = selectedDomains.some((d) => d.id === domain.id)
              return (
                <div
                  key={domain.id}
                  className="card card-clickable"
                  style={{
                    borderColor: selected ? 'rgba(74,163,255,0.5)' : undefined,
                    background: selected ? 'rgba(74,163,255,0.07)' : undefined,
                  }}
                  onClick={() => toggleDomain(domain)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{domain.name}</div>
                      <div className="text-xs" style={{ color: 'var(--accent)', marginTop: '0.125rem' }}>
                        {domain.category}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: selected ? 'var(--accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    >
                      {selected && <span style={{ fontSize: '0.7rem', color: '#0b1220', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                  <p className="text-sm text-muted line-clamp-2">{domain.description}</p>
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {domain.suggestedRoles.slice(0, 4).map((r) => (
                      <span key={r} className="badge badge-default">{r}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {selectedDomains.length > 0 && (
            <div
              className="panel"
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(74,163,255,0.08)',
                borderColor: 'rgba(74,163,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span className="text-sm" style={{ color: 'var(--accent)' }}>
                {selectedDomains.length} domain{selectedDomains.length > 1 ? 's' : ''} selected:{' '}
                {selectedDomains.map((d) => d.name).join(', ')}
              </span>
              <button className="btn btn-primary btn-sm" onClick={() => setStep(1)}>
                Continue →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Review Candidates */}
      {step === 1 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Review your selected domains</h2>
            <p className="text-sm text-muted">
              Review the details below. You can deselect domains you don't need.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedDomains.map((domain) => (
              <div key={domain.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem' }}>{domain.name}</h3>
                    <span className="badge badge-accent" style={{ marginTop: '0.25rem' }}>{domain.category}</span>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setSelectedDomains((prev) => prev.filter((d) => d.id !== domain.id))}
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{domain.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                  <div>
                    <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                      Common Workflows
                    </div>
                    <ul style={{ paddingLeft: '1rem', color: 'var(--text)' }}>
                      {domain.commonWorkflows.slice(0, 4).map((w) => <li key={w} style={{ marginBottom: '0.2rem' }}>{w}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-muted" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                      Key Metrics
                    </div>
                    <ul style={{ paddingLeft: '1rem', color: 'var(--text)' }}>
                      {domain.commonMetrics.slice(0, 4).map((m) => <li key={m} style={{ marginBottom: '0.2rem' }}>{m}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedDomains.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-title">No domains selected</div>
              <button className="btn btn-secondary" onClick={() => setStep(0)}>Go back to select</button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Confirm Multi-domain Selection */}
      {step === 2 && (
        <div className="panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.0625rem' }}>Confirm your selection</h2>
          {selectedDomains.length > 1 && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <span>ℹ️</span>
              <div>
                You've selected <strong>{selectedDomains.length} domains</strong>. They will be combined into a
                single domain knowledge file.
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {selectedDomains.map((d) => (
              <div key={d.id} className="panel" style={{ padding: '0.75rem 1rem' }}>
                <div style={{ fontWeight: 600 }}>{d.name}</div>
                <div className="text-xs text-muted">{d.category}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Click <strong style={{ color: 'var(--text)' }}>Generate Markdown</strong> to create the domain
            knowledge file, or go back to change your selection.
          </div>
        </div>
      )}

      {/* Step 3: Generate domain markdown */}
      {step === 3 && (
        <div className="panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Generate Domain Markdown</h2>
          <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
            Click the button below to generate structured domain knowledge markdown from your selected domains.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {selectedDomains.map((d) => (
              <span key={d.id} className="badge badge-accent">{d.name}</span>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleGenerate}>
            ⚡ Generate Domain Markdown
          </button>
        </div>
      )}

      {/* Step 4: Preview generated markdown */}
      {step === 4 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Review generated markdown</h2>
            <p className="text-sm text-muted">
              Review the generated domain knowledge below. You can edit it after saving.
            </p>
          </div>
          <div className="panel" style={{ padding: '1rem' }}>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.8125rem',
                color: 'var(--text)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                maxHeight: 500,
                overflowY: 'auto',
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              {generatedMarkdown}
            </pre>
          </div>
        </div>
      )}

      {/* Step 5: Suggested skills */}
      {step === 4 && (
        <div className="panel" style={{ padding: '1.5rem', marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Suggested Skills</h3>
          <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
            Based on your selected domains, the following skills are commonly required:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[...new Set(selectedDomains.flatMap((d) => d.relatedSkills))].map((skill) => (
              <span key={skill} className="tag">{skill}</span>
            ))}
          </div>
          <p className="text-sm text-muted" style={{ marginTop: '1rem' }}>
            You can add these skills to your Skills Studio after saving the domain.
          </p>
        </div>
      )}

      {/* Step 5 Complete */}
      {step === 5 && (
        <div className="panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Domain saved successfully!</h2>
          <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
            Your domain knowledge has been saved to the Domain Library. You can now use it in Prompt Packs and
            AI prompts.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/domain-library')}>
              View Domain Library
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setStep(0)
                setSelectedDomains([])
                setGeneratedMarkdown('')
                setSaved(false)
              }}
            >
              Build Another Domain
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/skills-studio')}>
              Go to Skills Studio
            </button>
          </div>
        </div>
      )}

      {/* Nav buttons */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={back} disabled={step === 0}>
            ← Back
          </button>
          {step < 4 && (
            <button className="btn btn-primary" onClick={next} disabled={!canGoNext()}>
              {step === 3 ? 'Generate →' : 'Next →'}
            </button>
          )}
          {step === 4 && (
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || saved}>
              {saving ? 'Saving...' : saved ? 'Saved ✓' : '💾 Save Domain'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
