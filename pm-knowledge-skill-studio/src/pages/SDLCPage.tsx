import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRight, FileText, Zap, Save, RotateCcw, User, CheckCircle, AlertTriangle, XCircle, FolderOpen, BookOpen, Star } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { SDLCPhase, SDLCTask, PreloadedPrompt, CustomPrompt, ActivityEvent, Project, DomainKnowledge, Skill } from '../types'
import type { Role } from '../types/role'
import type { StoredAIProviderSettings, AIProviderSettings } from '../types/provider'
import { dbCreate, dbList } from '../stores/db'
import { customPromptStore } from '../stores/customPromptStore'
import { settingsStore } from '../stores/settingsStore'
import { providerSettingsStore } from '../stores/providerSettingsStore'
import { aiRunStore } from '../stores/aiRunStore'
import { projectStore } from '../stores/projectStore'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import { skillStore } from '../stores/skillStore'
import { executePrompt } from '../lib/ai/aiRuntime'
import { runGovernanceCheck } from '../lib/governance/governanceEngine'
import { canExecute } from '../lib/governance/executionPolicy'
import MarkdownEditor from '../components/editor/MarkdownEditor'
import MarkdownPreview from '../components/editor/MarkdownPreview'
import EmptyState from '../components/ui/EmptyState'

async function recordActivity(eventType: ActivityEvent['eventType'], metadata?: Record<string, unknown>) {
  try {
    await dbCreate('activityEvents', { id: uuid(), eventType, status: 'success', metadata, createdAt: new Date().toISOString() } as ActivityEvent)
  } catch {
    // Best-effort; never propagate to callers
  }
}

function buildContextPreamble(project: Project | undefined, selectedDomains: DomainKnowledge[], selectedSkills: Skill[]): string {
  const sections: string[] = []

  if (project) {
    const lines = ['## Project Context', `**Project:** ${project.name}`]
    if (project.description) lines.push(`**Description:** ${project.description}`)
    if (project.goals) lines.push(`**Goals:** ${project.goals}`)
    if (project.techStack) lines.push(`**Tech Stack:** ${project.techStack}`)
    if (project.team) lines.push(`**Team:** ${project.team}`)
    sections.push(lines.join('\n'))
  }

  if (selectedDomains.length > 0) {
    const domainContent = selectedDomains
      .map(d => `### ${d.domainName}\n${d.contentMarkdown}`)
      .join('\n\n')
    sections.push(`## Domain Knowledge\n${domainContent}`)
  }

  if (selectedSkills.length > 0) {
    const skillLines = selectedSkills.map(s => {
      const parts = [`### ${s.name} (${s.maturityLevel})`]
      if (s.description) parts.push(s.description)
      if (s.evidenceNotes) parts.push(`**Evidence:** ${s.evidenceNotes}`)
      return parts.join('\n')
    })
    sections.push(`## Skills & Competencies\n${skillLines.join('\n\n')}`)
  }

  return sections.join('\n\n')
}

function injectContext(basePrompt: string, project: Project | undefined, selectedDomains: DomainKnowledge[], selectedSkills: Skill[]): string {
  let enriched = basePrompt

  if (project) {
    enriched = enriched
      .replace(/\[PROJECT_NAME\]/g, project.name)
      .replace(/\[INITIATIVE_NAME\]/g, project.name)
      .replace(/\[PRODUCT_OR_FEATURE_NAME\]/g, project.name)
      .replace(/\[BRIEF_CONTEXT\]/g, project.description || project.name)
  }

  const preamble = buildContextPreamble(project, selectedDomains, selectedSkills)
  if (preamble) {
    return `${preamble}\n\n---\n\n${enriched}`
  }

  return enriched
}

export default function SDLCPage() {
  const [phases, setPhases] = useState<SDLCPhase[]>([])
  const [tasks, setTasks] = useState<SDLCTask[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [preloadedPrompts, setPreloadedPrompts] = useState<PreloadedPrompt[]>([])
  const [selectedPhase, setSelectedPhase] = useState<SDLCPhase | null>(null)
  const [selectedTask, setSelectedTask] = useState<SDLCTask | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('all')
  const [loadedPrompt, setLoadedPrompt] = useState<PreloadedPrompt | null>(null)
  const [promptMarkdown, setPromptMarkdown] = useState('')
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([])
  const [aiProviderList, setAiProviderList] = useState<StoredAIProviderSettings[]>([])
  // Project, domain & skills context
  const [projects, setProjects] = useState<Project[]>([])
  const [domainKnowledge, setDomainKnowledge] = useState<DomainKnowledge[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedDomainIds, setSelectedDomainIds] = useState<string[]>([])
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  // Page state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  // Run Prompt state
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState('')
  const [runError, setRunError] = useState('')
  const [runProviderId, setRunProviderId] = useState('')
  const [runModel, setRunModel] = useState('')
  const [runTokens, setRunTokens] = useState<{ input?: number; output?: number } | null>(null)
  const [governanceWarnings, setGovernanceWarnings] = useState<string[]>([])

  useEffect(() => {
    const fetchJson = (path: string) =>
      fetch(path).then((r) => { if (!r.ok) return []; return r.json() }).catch(() => [])

    Promise.all([
      fetchJson('/pm-knowledge-skill-studio/config/sdlcPhases.json'),
      fetchJson('/pm-knowledge-skill-studio/config/sdlcTasks.json'),
      fetchJson('/pm-knowledge-skill-studio/config/preloadedPrompts.json'),
      fetchJson('/pm-knowledge-skill-studio/config/roles.json'),
      dbList<StoredAIProviderSettings>('aiProviderSettings').catch(() => [] as StoredAIProviderSettings[]),
      settingsStore.get<string>('primaryRole').catch(() => undefined),
      projectStore.list().catch(() => [] as Project[]),
      domainKnowledgeStore.list().catch(() => [] as DomainKnowledge[]),
      skillStore.list().catch(() => [] as Skill[]),
    ]).then(([phasesData, tasksData, promptsData, rolesData, aiSettings, primaryRoleName, projectList, domainList, skillList]) => {
      const phaseList = Array.isArray(phasesData) ? phasesData as SDLCPhase[] : []
      const roleList = Array.isArray(rolesData) ? rolesData as Role[] : []
      const providerList = Array.isArray(aiSettings) ? aiSettings as StoredAIProviderSettings[] : []
      setPhases(phaseList)
      setTasks(Array.isArray(tasksData) ? tasksData as SDLCTask[] : [])
      setPreloadedPrompts(Array.isArray(promptsData) ? promptsData as PreloadedPrompt[] : [])
      setRoles(roleList)
      setAiProviderList(providerList)
      setProjects(Array.isArray(projectList) ? (projectList as Project[]).filter(p => p.status === 'active') : [])
      setDomainKnowledge(Array.isArray(domainList) ? domainList as DomainKnowledge[] : [])
      setSkills(Array.isArray(skillList) ? skillList as Skill[] : [])
      if (phaseList.length > 0) setSelectedPhase(phaseList[0])

      if (primaryRoleName && roleList.length > 0) {
        const match = roleList.find((r) => r.name === primaryRoleName)
        if (match) setSelectedRoleId(match.id)
      }
    }).catch((err) => {
      console.error('SDLC load error:', err)
      setError('Failed to load SDLC workspace data. Please refresh the page.')
    }).finally(() => setLoading(false))

    dbList<CustomPrompt>('customPrompts').catch(() => [] as CustomPrompt[]).then((list) => setCustomPrompts(list ?? []))
  }, [])

  // Check real-time: a provider has a key in sessionStorage or was saved with one
  const hasAIProvider = aiProviderList.some(p =>
    providerSettingsStore.hasAIKey(p.providerId) || p.hasApiKey
  )

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const activeDomains = domainKnowledge.filter(d => selectedDomainIds.includes(d.id))
  const activeSkills = skills.filter(s => selectedSkillIds.includes(s.id))
  const contextActive = !!selectedProjectId || selectedDomainIds.length > 0 || selectedSkillIds.length > 0
  // Mandatory context check — all three must be present before running
  const missingContext: string[] = []
  if (!selectedProjectId) missingContext.push('project')
  if (selectedDomainIds.length === 0) missingContext.push('domain knowledge')
  if (selectedSkillIds.length === 0) missingContext.push('skills')
  const contextComplete = missingContext.length === 0

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    if (projectId) {
      const proj = projects.find(p => p.id === projectId)
      setSelectedDomainIds(proj?.linkedDomainIds ?? [])
    } else {
      setSelectedDomainIds([])
    }
  }

  const toggleDomain = (id: string) => {
    setSelectedDomainIds(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const toggleSkill = (id: string) => {
    setSelectedSkillIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const phaseTasks = tasks.filter((t) => {
    if (t.phaseId !== selectedPhase?.id) return false
    if (selectedRoleId === 'all') return true
    return t.roleIds.includes(selectedRoleId)
  })

  const handlePhaseSelect = (phase: SDLCPhase) => {
    setSelectedPhase(phase)
    setSelectedTask(null)
    setLoadedPrompt(null)
    setPromptMarkdown('')
    setRunResult('')
    setRunError('')
    recordActivity('sdlc_phase_selected', { phaseId: phase.id, phaseName: phase.name })
  }

  const handleTaskSelect = (task: SDLCTask) => {
    setSelectedTask(task)
    setLoadedPrompt(null)
    setPromptMarkdown('')
    setRunResult('')
    setRunError('')
    recordActivity('sdlc_task_selected', { taskId: task.id, phaseId: task.phaseId })
  }

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId)
    setSelectedTask(null)
    setLoadedPrompt(null)
    setPromptMarkdown('')
    setRunResult('')
    setRunError('')
  }

  const handleLoadPrompt = useCallback(async () => {
    if (!selectedTask) return
    setPromptLoading(true)
    setRunResult('')
    setRunError('')
    try {
      const existingCustom = customPrompts.find((cp) => cp.taskId === selectedTask.id && cp.phaseId === selectedTask.phaseId)
      if (existingCustom) {
        const combined = `# ${existingCustom.title}\n\n## System Prompt\n${existingCustom.systemPromptMarkdown}\n\n## User Prompt\n${existingCustom.userPromptMarkdown}\n\n## Input Guidance\n${existingCustom.inputGuidanceMarkdown}\n\n## Expected Output\n${existingCustom.expectedOutputMarkdown}`
        setPromptMarkdown(combined)
        recordActivity('prompt_loaded', { taskId: selectedTask.id, source: 'custom' })
        return
      }

      const found = preloadedPrompts.find((p) => p.taskId === selectedTask.id && p.phaseId === selectedTask.phaseId) ??
        preloadedPrompts.find((p) => p.phaseId === selectedTask.phaseId)
      if (found) {
        setLoadedPrompt(found)
        const combined = `# ${found.title}\n\n## System Prompt\n${found.systemPromptMarkdown}\n\n## User Prompt\n${found.userPromptMarkdown}\n\n## Input Guidance\n${found.inputGuidanceMarkdown}\n\n## Expected Output\n${found.expectedOutputMarkdown}`
        setPromptMarkdown(combined)
        recordActivity('prompt_loaded', { taskId: selectedTask.id, promptId: found.id })
      } else {
        const starter = `# ${selectedTask.title}\n\n## Goal\n${selectedTask.description}\n\n## Inputs Needed\n${selectedTask.inputsNeeded.map((i) => `- ${i}`).join('\n')}\n\n## Expected Outputs\n${selectedTask.expectedOutputs.map((o) => `- ${o}`).join('\n')}\n\n## Your Prompt\n_Write your prompt here..._`
        setPromptMarkdown(starter)
        recordActivity('prompt_loaded', { taskId: selectedTask.id, source: 'generated' })
      }
    } finally {
      setPromptLoading(false)
    }
  }, [selectedTask, preloadedPrompts, customPrompts])

  const handleRunPrompt = useCallback(async () => {
    if (!selectedTask || !promptMarkdown || running) return
    setRunning(true)
    setRunResult('')
    setRunError('')
    setRunTokens(null)
    setGovernanceWarnings([])

    try {
      // Build enriched prompt with project + domain + skills context injected
      const enrichedPrompt = injectContext(promptMarkdown, selectedProject, activeDomains, activeSkills)
      const contextSnapshot = buildContextPreamble(selectedProject, activeDomains, activeSkills)

      // Governance check — block on PII / injections
      const gov = runGovernanceCheck(enrichedPrompt, 'sdlc-workspace')
      if (!canExecute(gov)) {
        setRunError(`Execution blocked by governance: ${gov.blockedReasons.join('; ')}`)
        await aiRunStore.create({
          providerId: 'blocked', model: '', promptSnapshotMarkdown: enrichedPrompt,
          inputContextSnapshot: contextSnapshot, resultMarkdown: '', status: 'blocked',
          errorSummary: gov.blockedReasons.join('; '),
          linkedSkillIds: [], linkedDomainIds: selectedDomainIds, linkedPlaybookIds: [],
          linkedProjectId: selectedProjectId || undefined,
        })
        recordActivity('governance_block', { taskId: selectedTask.id, reasons: gov.blockedReasons })
        return
      }
      if (gov.warningReasons.length > 0) setGovernanceWarnings(gov.warningReasons)

      // Find active provider with a key
      const freshList = await dbList<StoredAIProviderSettings>('aiProviderSettings').catch(() => [] as StoredAIProviderSettings[])
      setAiProviderList(freshList)

      const activeStored = freshList.find(p => providerSettingsStore.hasAIKey(p.providerId))
        ?? freshList.find(p => p.hasApiKey)

      if (!activeStored) {
        setRunError('No AI provider configured. Go to Provider Settings and save your API key.')
        return
      }

      const { settings, apiKey } = await providerSettingsStore.getAIProviderSettings(activeStored.providerId)
      if (!apiKey) {
        setRunError('API key not found in this session. Please re-enter it in Provider Settings (keys clear when you close the tab).')
        return
      }

      const fullSettings: AIProviderSettings = {
        ...(settings as Omit<AIProviderSettings, 'apiKey'>),
        apiKey,
      }

      const response = await executePrompt(enrichedPrompt, fullSettings)

      setRunResult(response.text)
      setRunProviderId(activeStored.providerId)
      setRunModel(response.model)
      setRunTokens({ input: response.usage?.inputTokens, output: response.usage?.outputTokens })

      await aiRunStore.create({
        providerId: activeStored.providerId,
        model: response.model,
        promptSnapshotMarkdown: enrichedPrompt,
        inputContextSnapshot: contextSnapshot,
        resultMarkdown: response.text,
        status: 'success',
        preloadedPromptId: loadedPrompt?.id,
        usageEstimate: response.usage
          ? { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens,
              totalTokens: (response.usage.inputTokens ?? 0) + (response.usage.outputTokens ?? 0) }
          : undefined,
        linkedSkillIds: selectedSkillIds,
        linkedDomainIds: selectedDomainIds,
        linkedPlaybookIds: [],
        linkedProjectId: selectedProjectId || undefined,
      })

      recordActivity('prompt_executed', { taskId: selectedTask.id, providerId: activeStored.providerId, model: response.model })

    } catch (err) {
      const msg = (err as { message?: string })?.message ?? String(err)
      setRunError(msg)
      recordActivity('ai_run_failed', { taskId: selectedTask?.id, error: msg })
    } finally {
      setRunning(false)
    }
  }, [selectedTask, promptMarkdown, loadedPrompt, running, selectedProject, activeDomains, activeSkills, selectedDomainIds, selectedProjectId, selectedSkillIds])

  const handleSaveCustomPrompt = async () => {
    if (!selectedTask || !promptMarkdown) return
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const existing = customPrompts.find((cp) => cp.taskId === selectedTask.id)
      const data: Omit<CustomPrompt, 'id' | 'createdAt' | 'updatedAt'> = {
        basePromptId: loadedPrompt?.id ?? '',
        roleId: selectedTask.roleIds[0] ?? '',
        phaseId: selectedTask.phaseId,
        taskId: selectedTask.id,
        title: selectedTask.title,
        systemPromptMarkdown: '',
        userPromptMarkdown: promptMarkdown,
        inputGuidanceMarkdown: '',
        expectedOutputMarkdown: '',
        qualityChecklistMarkdown: '',
        governanceChecklistMarkdown: '',
      }
      if (existing) {
        await dbCreate('customPrompts', { ...existing, ...data, updatedAt: now })
      } else {
        await customPromptStore.create(data)
      }
      const updated = await dbList<CustomPrompt>('customPrompts')
      setCustomPrompts(updated)
      setSavedMsg('Prompt saved!')
      setTimeout(() => setSavedMsg(''), 3000)
      recordActivity('prompt_edited', { taskId: selectedTask.id })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="page-container"><div className="loading-overlay"><div className="loading-spinner" /> Loading SDLC workspace...</div></div>
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div className="page-container-wide" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>SDLC Workspace</h1>
        <p className="text-muted text-sm">Select your role and project, pick a phase and task, then load and run an AI-ready prompt.</p>
      </div>

      {/* Role selector */}
      <div className="panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <User size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Your Role:</span>
        </div>
        <select
          className="input"
          value={selectedRoleId}
          onChange={(e) => handleRoleChange(e.target.value)}
          style={{ width: 'auto', minWidth: 220, fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
        >
          <option value="all">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        {selectedRole && (
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0, flex: 1, minWidth: 0 }}>
            {selectedRole.defaultPromptPerspective.slice(0, 120)}…
          </p>
        )}
      </div>

      {/* Project, Domain & Skills context panel — all three mandatory */}
      <div className="panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem', borderColor: contextComplete ? undefined : 'rgba(255,204,102,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <FolderOpen size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Prompt Context</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>
            Project + Domain + Skills are <strong>required</strong> before running a prompt
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 1fr', gap: '1rem', alignItems: 'start' }}>
          {/* Project selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: !selectedProjectId ? 'var(--warning)' : 'var(--muted)', marginBottom: '0.25rem' }}>
              <FolderOpen size={11} style={{ marginRight: 3 }} />Project {!selectedProjectId && '⚠ required'}
            </label>
            {projects.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                <a href="/pm-knowledge-skill-studio/projects" style={{ color: 'var(--accent)' }}>Create a project</a> first.
              </p>
            ) : (
              <select
                className="input"
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem', borderColor: !selectedProjectId ? 'rgba(255,204,102,0.5)' : undefined }}
              >
                <option value="">— Select project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Domain checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: selectedDomainIds.length === 0 ? 'var(--warning)' : 'var(--muted)', marginBottom: '0.25rem' }}>
              <BookOpen size={11} style={{ marginRight: 3 }} />Domain Knowledge {selectedDomainIds.length > 0 ? `(${selectedDomainIds.length})` : '⚠ required'}
            </label>
            {domainKnowledge.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                <a href="/pm-knowledge-skill-studio/domain-builder" style={{ color: 'var(--accent)' }}>Build domain knowledge</a> first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {domainKnowledge.map(d => (
                  <label
                    key={d.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      cursor: 'pointer', fontSize: '0.75rem',
                      background: selectedDomainIds.includes(d.id) ? 'rgba(74,163,255,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedDomainIds.includes(d.id) ? 'rgba(74,163,255,0.35)' : 'var(--border)'}`,
                      borderRadius: 4, padding: '0.175rem 0.45rem',
                    }}
                  >
                    <input type="checkbox" checked={selectedDomainIds.includes(d.id)} onChange={() => toggleDomain(d.id)} style={{ margin: 0 }} />
                    {d.domainName}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Skills checkboxes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: selectedSkillIds.length === 0 ? 'var(--warning)' : 'var(--muted)', marginBottom: '0.25rem' }}>
              <Star size={11} style={{ marginRight: 3 }} />Skills {selectedSkillIds.length > 0 ? `(${selectedSkillIds.length})` : '⚠ required'}
            </label>
            {skills.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                <a href="/pm-knowledge-skill-studio/skills" style={{ color: 'var(--accent)' }}>Add skills</a> first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {skills.map(s => (
                  <label
                    key={s.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      cursor: 'pointer', fontSize: '0.75rem',
                      background: selectedSkillIds.includes(s.id) ? 'rgba(126,231,135,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${selectedSkillIds.includes(s.id) ? 'rgba(126,231,135,0.35)' : 'var(--border)'}`,
                      borderRadius: 4, padding: '0.175rem 0.45rem',
                    }}
                  >
                    <input type="checkbox" checked={selectedSkillIds.includes(s.id)} onChange={() => toggleSkill(s.id)} style={{ margin: 0 }} />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '0.625rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: contextComplete ? 'var(--success)' : 'var(--warning)' }}>
          {contextComplete
            ? <><CheckCircle size={13} /> Context ready: {selectedProject?.name} + {selectedDomainIds.length} domain{selectedDomainIds.length !== 1 ? 's' : ''} + {selectedSkillIds.length} skill{selectedSkillIds.length !== 1 ? 's' : ''}</>
            : <><AlertTriangle size={13} /> Missing: {missingContext.join(', ')} — required before running prompts</>}
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedPhase && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{selectedPhase.name}</span>
          {selectedTask && <><ChevronRight size={12} /><span style={{ color: 'var(--text)' }}>{selectedTask.title}</span></>}
        </div>
      )}

      {/* Phase tabs */}
      <div className="tab-list" style={{ overflowX: 'auto' }}>
        {phases.map((phase) => (
          <button key={phase.id} className={`tab-item${selectedPhase?.id === phase.id ? ' tab-item-active' : ''}`} onClick={() => handlePhaseSelect(phase)}>
            {phase.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Task list */}
        <div className="panel" style={{ padding: '1rem' }}>
          {selectedPhase && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.375rem' }}>{selectedPhase.name}</div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>{selectedPhase.purpose}</p>
              </div>
              {phaseTasks.length === 0 ? (
                <p className="text-sm text-muted">
                  {selectedRoleId === 'all' ? 'No tasks defined for this phase.' : `No tasks for this role in this phase. Try "All Roles".`}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {phaseTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskSelect(task)}
                      style={{
                        background: selectedTask?.id === task.id ? 'rgba(74,163,255,0.1)' : 'none',
                        border: `1px solid ${selectedTask?.id === task.id ? 'rgba(74,163,255,0.4)' : 'transparent'}`,
                        borderRadius: 'var(--radius)',
                        padding: '0.625rem 0.75rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: selectedTask?.id === task.id ? 'var(--accent)' : 'var(--text)',
                        fontSize: '0.875rem',
                        fontWeight: selectedTask?.id === task.id ? 600 : 400,
                        transition: 'all var(--transition)',
                        display: 'block',
                        width: '100%',
                      }}
                    >
                      {task.title}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Task detail & prompt */}
        <div>
          {!selectedTask ? (
            <EmptyState icon={<FileText size={40} />} title="Select a task" description="Choose a task from the left panel to view details and load an AI prompt." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Task detail */}
              <div className="panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{selectedTask.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.6 }}>{selectedTask.description}</p>

                <div className="grid-2">
                  <div>
                    <div className="form-label" style={{ marginBottom: '0.375rem' }}>Inputs Needed</div>
                    <ul style={{ fontSize: '0.8125rem', color: 'var(--muted)', paddingLeft: '1.25rem', margin: 0 }}>
                      {selectedTask.inputsNeeded.map((inp, i) => <li key={i}>{inp}</li>)}
                    </ul>
                  </div>
                  <div>
                    <div className="form-label" style={{ marginBottom: '0.375rem' }}>Expected Outputs</div>
                    <ul style={{ fontSize: '0.8125rem', color: 'var(--muted)', paddingLeft: '1.25rem', margin: 0 }}>
                      {selectedTask.expectedOutputs.map((out, i) => <li key={i}>{out}</li>)}
                    </ul>
                  </div>
                </div>

                {selectedTask.relatedSkills.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div className="form-label" style={{ marginBottom: '0.375rem' }}>Related Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {selectedTask.relatedSkills.map((s) => <span key={s} className="badge badge-accent">{s}</span>)}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={handleLoadPrompt} disabled={promptLoading}>
                    {promptLoading ? <><div className="loading-spinner loading-spinner-sm" /> Loading...</> : <><Zap size={14} /> Load Prompt</>}
                  </button>
                </div>
              </div>

              {/* Prompt editor */}
              {promptMarkdown && (
                <div className="panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>Prompt Editor</h4>
                      {loadedPrompt && <p className="text-xs text-muted" style={{ margin: '0.25rem 0 0' }}>Based on: {loadedPrompt.title}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {savedMsg && <span style={{ color: 'var(--success)', fontSize: '0.8125rem', alignSelf: 'center' }}>{savedMsg}</span>}
                      <button className="btn btn-ghost btn-sm" onClick={() => { setPromptMarkdown(''); setLoadedPrompt(null); setRunResult(''); setRunError('') }}>
                        <RotateCcw size={13} /> Reset
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={handleSaveCustomPrompt} disabled={saving}>
                        <Save size={13} /> {saving ? 'Saving...' : 'Save Custom Prompt'}
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleRunPrompt}
                        disabled={running || !contextComplete}
                        title={
                          !hasAIProvider ? 'Configure an AI provider in Provider Settings first'
                          : !contextComplete ? `Select ${missingContext.join(', ')} before running`
                          : undefined
                        }
                      >
                        {running
                          ? <><div className="loading-spinner loading-spinner-sm" /> Running…</>
                          : <><Zap size={13} /> Run Prompt with Context</>}
                      </button>
                    </div>
                  </div>

                  {!hasAIProvider && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                      No AI provider configured. <a href="/pm-knowledge-skill-studio/provider-settings" style={{ color: 'inherit', fontWeight: 600 }}>Configure one in Provider Settings</a> to run prompts.
                    </div>
                  )}

                  {!contextComplete && (
                    <div style={{ background: 'rgba(255,204,102,0.08)', border: '1px solid rgba(255,204,102,0.3)', borderRadius: 6, padding: '0.5rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      Select <strong>{missingContext.join(', ')}</strong> in the context panel above before running this prompt.
                    </div>
                  )}

                  {contextComplete && (
                    <div style={{ background: 'rgba(74,163,255,0.06)', border: '1px solid rgba(74,163,255,0.2)', borderRadius: 6, padding: '0.5rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle size={13} style={{ flexShrink: 0 }} />
                      <span>
                        Injecting: <strong>{selectedProject?.name}</strong> + <strong>{selectedDomainIds.length} domain{selectedDomainIds.length !== 1 ? 's' : ''}</strong> + <strong>{selectedSkillIds.length} skill{selectedSkillIds.length !== 1 ? 's' : ''}</strong>.
                        Placeholders like <code>[PROJECT_NAME]</code> are replaced automatically.
                      </span>
                    </div>
                  )}

                  {governanceWarnings.length > 0 && (
                    <div style={{ background: 'rgba(255,204,102,0.1)', border: '1px solid rgba(255,204,102,0.3)', borderRadius: 6, padding: '0.625rem 0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', gap: '0.5rem' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>Governance warning: {governanceWarnings.join('; ')}</span>
                    </div>
                  )}

                  <MarkdownEditor
                    value={promptMarkdown}
                    onChange={(v) => { setPromptMarkdown(v); recordActivity('prompt_edited', { taskId: selectedTask.id }) }}
                    minHeight={300}
                    label="Edit Prompt Markdown"
                    showCharCount
                  />

                  <div style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                    <div className="form-label" style={{ marginBottom: '0.5rem' }}>Preview</div>
                    <MarkdownPreview content={promptMarkdown} />
                  </div>
                </div>
              )}

              {/* AI Run Result */}
              {(runResult || runError) && (
                <div className="panel" style={{ padding: '1.25rem', borderColor: runError ? 'rgba(255,107,107,0.3)' : 'rgba(74,163,255,0.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                    {runError
                      ? <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />
                      : <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                    <h4 style={{ margin: 0 }}>{runError ? 'Run Failed' : 'AI Response'}</h4>
                    {runModel && (
                      <span className="badge badge-default" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                        {runProviderId} · {runModel}
                      </span>
                    )}
                  </div>

                  {runError && (
                    <div className="alert alert-error" style={{ marginBottom: 0, fontSize: '0.875rem' }}>{runError}</div>
                  )}

                  {runResult && (
                    <>
                      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
                        <MarkdownPreview content={runResult} />
                      </div>
                      {runTokens && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', gap: '1rem' }}>
                          {runTokens.input != null && <span>Input tokens: {runTokens.input.toLocaleString()}</span>}
                          {runTokens.output != null && <span>Output tokens: {runTokens.output.toLocaleString()}</span>}
                          <span style={{ marginLeft: 'auto' }}>Saved to AI Runs</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
