import React, { useState, useEffect, useCallback } from 'react'
import { Search, Globe, ChevronRight, ChevronLeft, Check, Layers, Sparkles, Save, BookOpen } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { CandidateDomain, DomainCatalogItem, SuggestedSkill, ActivityEvent } from '../types'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import { skillStore } from '../stores/skillStore'
import { dbList, dbCreate } from '../stores/db'
import { buildDomainMarkdown } from '../lib/domain/domainMarkdownBuilder'
import { suggestSkillsForDomain } from '../lib/domainSkillRules'
import DomainCandidateCard from '../components/domain/DomainCandidateCard'
import MultiDomainSelector from '../components/domain/MultiDomainSelector'
import SkillSuggestionPanel from '../components/skills/SkillSuggestionPanel'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import SearchBar from '../components/ui/SearchBar'
import EmptyState from '../components/ui/EmptyState'

const STEPS = ['Search & Browse', 'Select Domains', 'Generate Markdown', 'Review Skills', 'Save & Complete']

async function recordActivity(eventType: ActivityEvent['eventType'], metadata?: Record<string, unknown>) {
  const event: ActivityEvent = {
    id: uuid(),
    eventType,
    status: 'success',
    metadata,
    createdAt: new Date().toISOString(),
  }
  try {
    await dbCreate('activityEvents', event)
  } catch {
    // Activity logging is best-effort; never propagate to callers
  }
}

function catalogToCandidates(items: DomainCatalogItem[]): CandidateDomain[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    relevanceScore: 0.85,
    source: 'curated' as const,
    suggestedWorkflows: item.commonWorkflows,
    suggestedMetrics: item.commonMetrics,
    suggestedRisks: item.commonRisks,
    suggestedIntegrations: item.commonIntegrations,
    suggestedCompliance: item.complianceConsiderations,
    suggestedRoles: item.suggestedRoles,
    whySuggested: `Curated domain from PM Knowledge & Skill Studio catalog.`,
  }))
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: i < current ? 'var(--success)' : i === current ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                color: i <= current ? '#0b1220' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <div style={{ fontSize: '0.6875rem', color: i === current ? 'var(--accent)' : i < current ? 'var(--success)' : 'var(--muted)', fontWeight: i === current ? 600 : 400, whiteSpace: 'nowrap', maxWidth: 80, textAlign: 'center' }}>
              {step}
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ height: 2, width: 36, background: i < current ? 'var(--success)' : 'rgba(255,255,255,0.08)', marginBottom: 18, transition: 'background 0.2s', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function DomainBuilderPage() {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [catalog, setCatalog] = useState<DomainCatalogItem[]>([])
  const [candidates, setCandidates] = useState<CandidateDomain[]>([])
  const [selectedDomains, setSelectedDomains] = useState<CandidateDomain[]>([])
  const [generatedMarkdowns, setGeneratedMarkdowns] = useState<Record<string, string>>({})
  const [suggestedSkills, setSuggestedSkills] = useState<SuggestedSkill[]>([])
  const [acceptedSkillIds, setAcceptedSkillIds] = useState<string[]>([])
  const [rejectedSkillIds, setRejectedSkillIds] = useState<string[]>([])
  const [hasSearchProvider, setHasSearchProvider] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/pm-knowledge-skill-studio/config/domainCatalog.json')
      .then((r) => r.json())
      .then((data: DomainCatalogItem[]) => {
        setCatalog(data)
        setCandidates(catalogToCandidates(data))
      })
      .catch(() => setError('Failed to load domain catalog.'))
      .finally(() => setLoading(false))

    dbList('searchProviderSettings').then((settings) => {
      setHasSearchProvider((settings as unknown[]).length > 0)
    })
  }, [])

  const filteredCandidates = searchQuery.trim()
    ? candidates.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : candidates

  const toggleDomain = useCallback((domain: CandidateDomain) => {
    setSelectedDomains((prev) =>
      prev.some((d) => d.id === domain.id) ? prev.filter((d) => d.id !== domain.id) : [...prev, domain],
    )
  }, [])

  const handleGenerateMarkdown = useCallback(() => {
    const markdowns: Record<string, string> = {}
    for (const domain of selectedDomains) {
      const catalogItem = catalog.find((c) => c.id === domain.id)
      const source = catalogItem ?? domain
      markdowns[domain.id] = buildDomainMarkdown(source, domain.suggestedRoles)
    }
    setGeneratedMarkdowns(markdowns)
    recordActivity('domain_markdown_created', { domainCount: selectedDomains.length })
  }, [selectedDomains, catalog])

  const handleGenerateSkills = useCallback(() => {
    const allSkills: SuggestedSkill[] = []
    for (const domain of selectedDomains) {
      const domainSkills = suggestSkillsForDomain({
        domainKey: domain.id,
        domainName: domain.name,
        selectedRoleIds: domain.suggestedRoles,
        workflows: domain.suggestedWorkflows,
        risks: domain.suggestedRisks,
        complianceItems: domain.suggestedCompliance,
        integrations: domain.suggestedIntegrations,
        selectedDomains: selectedDomains.map((d) => d.name),
      })
      allSkills.push(...domainSkills)
    }
    const deduped = allSkills.filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) === i)
    setSuggestedSkills(deduped)
    recordActivity('skill_suggested', { count: deduped.length })
  }, [selectedDomains])

  const handleSave = useCallback(async () => {
    if (selectedDomains.length === 0) return
    setSaving(true)
    try {
      for (const domain of selectedDomains) {
        const md = generatedMarkdowns[domain.id] ?? ''
        await domainKnowledgeStore.create({
          domainKey: domain.id,
          domainName: domain.name,
          contentMarkdown: md,
          selectedRoleIds: domain.suggestedRoles,
          generatedSkillIds: [],
          linkedPromptPackIds: [],
          linkedPlaybookIds: [],
          tags: [domain.category],
          source: domain.source === 'curated' ? 'curated' : domain.source === 'web_discovered' ? 'web_discovered' : 'manual',
          sourceLinks: domain.sourceLinks ?? [],
        })
        await recordActivity('domain_selected', { domainId: domain.id, domainName: domain.name })
      }

      // Save accepted skills
      for (const skillId of acceptedSkillIds) {
        const skill = suggestedSkills.find((s) => s.id === skillId)
        if (skill) {
          await skillStore.create({
            name: skill.name,
            roleId: skill.roleId,
            category: skill.category,
            description: skill.description,
            maturityLevel: skill.maturityLevel,
            evidenceNotes: '',
            practiceNotes: '',
            reflectionNotes: '',
            linkedDomainIds: [skill.linkedDomainId],
            linkedArtifacts: skill.linkedArtifacts,
            isCrossDomainSkill: skill.isCrossDomainSkill,
            tags: [],
          })
          await recordActivity('skill_accepted', { skillName: skill.name })
        }
      }

      setSaved(true)
      setStep(5)
    } catch (err) {
      console.error(err)
      setError('Failed to save domain knowledge.')
    } finally {
      setSaving(false)
    }
  }, [selectedDomains, generatedMarkdowns, acceptedSkillIds, suggestedSkills])

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ marginBottom: '0.375rem' }}>Domain Builder</h1>
        <p className="text-muted text-sm">Add structured domain knowledge that enriches your AI prompts, skills, and playbooks.</p>
      </div>

      <StepIndicator current={step - 1} />

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Step 1: Search & Browse */}
      {step === 1 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ marginBottom: '0.75rem', fontSize: '1.0625rem' }}>Search & Browse Domains</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, category, or keyword..." />
              </div>
              <button
                className="btn btn-secondary"
                disabled={!hasSearchProvider}
                title={hasSearchProvider ? 'Search the web for domain knowledge' : 'Configure a search provider in Settings first'}
              >
                <Globe size={15} />
                Use Web Search
              </button>
            </div>
            {!hasSearchProvider && (
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                Web search is disabled — configure a search provider in Provider Settings to enable it.
              </p>
            )}
          </div>

          {loading ? (
            <div className="loading-overlay"><div className="loading-spinner" /> Loading catalog...</div>
          ) : filteredCandidates.length === 0 ? (
            <EmptyState title="No domains found" description="Try adjusting your search query." />
          ) : (
            <div className="grid-auto">
              {filteredCandidates.map((domain) => (
                <DomainCandidateCard
                  key={domain.id}
                  domain={domain}
                  selected={selectedDomains.some((d) => d.id === domain.id)}
                  onToggle={toggleDomain}
                />
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-muted">{selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''} selected</span>
            <button className="btn btn-primary" disabled={selectedDomains.length === 0} onClick={() => setStep(2)}>
              Continue <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Domains */}
      {step === 2 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Confirm Your Domain Selection</h2>
            <p className="text-sm text-muted">Review and confirm the domains you want to add to your knowledge library.</p>
          </div>

          <MultiDomainSelector
            candidates={candidates}
            selectedDomains={selectedDomains}
            onRemove={(id) => setSelectedDomains((prev) => prev.filter((d) => d.id !== id))}
            maxSelections={10}
          />

          {selectedDomains.length > 0 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDomains.map((domain) => (
                <div key={domain.id} className="card">
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{domain.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>{domain.description}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {domain.suggestedRoles.slice(0, 4).map((r) => (
                      <span key={r} className="badge badge-default">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" disabled={selectedDomains.length === 0} onClick={() => setStep(3)}>
              Generate Markdown <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generate Markdown */}
      {step === 3 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Generate Domain Markdown</h2>
            <p className="text-sm text-muted">Generate structured markdown documents for each selected domain. You can edit them later in the Domain Library.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleGenerateMarkdown}>
              <Sparkles size={15} /> Generate Markdown for {selectedDomains.length} Domain{selectedDomains.length !== 1 ? 's' : ''}
            </button>
          </div>

          {Object.keys(generatedMarkdowns).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedDomains.map((domain) => (
                <div key={domain.id} className="panel" style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{domain.name}</div>
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <MarkdownPreview content={generatedMarkdowns[domain.id] ?? ''} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" disabled={Object.keys(generatedMarkdowns).length === 0} onClick={() => { handleGenerateSkills(); setStep(4) }}>
              Review Skills <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review Skills */}
      {step === 4 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Review Suggested Skills</h2>
            <p className="text-sm text-muted">These skills were suggested based on your selected domains and associated roles. Accept the ones you want to add to your skills library.</p>
          </div>

          {suggestedSkills.length === 0 ? (
            <EmptyState title="No skills suggested" description="Generate markdown first to get skill suggestions." />
          ) : (
            <SkillSuggestionPanel
              suggestedSkills={suggestedSkills.filter((s) => !rejectedSkillIds.includes(s.id))}
              acceptedSkillIds={acceptedSkillIds}
              onAccept={(skill) => setAcceptedSkillIds((prev) => prev.includes(skill.id) ? prev : [...prev, skill.id])}
              onAcceptAll={() => setAcceptedSkillIds(suggestedSkills.filter((s) => !rejectedSkillIds.includes(s.id)).map((s) => s.id))}
              onReject={(id) => {
                setRejectedSkillIds((prev) => [...prev, id])
                setAcceptedSkillIds((prev) => prev.filter((i) => i !== id))
              }}
            />
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-secondary" onClick={() => setStep(3)}>
              <ChevronLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(5)}>
              Save & Complete <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Save & Complete */}
      {step === 5 && (
        <div>
          <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.0625rem' }}>Save & Complete</h2>
            <p className="text-sm text-muted">Review your selections and save them to your knowledge library.</p>
          </div>

          {saved ? (
            <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                <Check size={48} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Domains Saved!</h3>
              <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
                {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''} and {acceptedSkillIds.length} skill{acceptedSkillIds.length !== 1 ? 's' : ''} have been saved to your library.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <a href="/pm-knowledge-skill-studio/domain-library" className="btn btn-primary">
                  <BookOpen size={15} /> View Domain Library
                </a>
                <button className="btn btn-secondary" onClick={() => { setStep(1); setSelectedDomains([]); setGeneratedMarkdowns({}); setSuggestedSkills([]); setAcceptedSkillIds([]); setRejectedSkillIds([]); setSaved(false) }}>
                  Build Another Domain
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} style={{ color: 'var(--accent)' }} /> Domains to Save
                  </div>
                  {selectedDomains.map((d) => (
                    <div key={d.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--success)' }}><Check size={14} /></span>
                      <strong>{d.name}</strong>
                      <span className="text-muted">— {d.category}</span>
                      {generatedMarkdowns[d.id] && <span className="badge badge-success">Markdown ready</span>}
                    </div>
                  ))}
                </div>

                {acceptedSkillIds.length > 0 && (
                  <div className="card">
                    <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Skills to Save ({acceptedSkillIds.length})</div>
                    {suggestedSkills.filter((s) => acceptedSkillIds.includes(s.id)).map((s) => (
                      <div key={s.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                        <span className="text-success">{s.name}</span> <span className="text-muted">— {s.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-secondary" onClick={() => setStep(4)}>
                  <ChevronLeft size={15} /> Back
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><div className="loading-spinner loading-spinner-sm" /> Saving...</> : <><Save size={15} /> Save All</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
