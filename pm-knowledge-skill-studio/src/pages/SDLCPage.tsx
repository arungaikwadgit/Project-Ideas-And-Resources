import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRight, FileText, Zap, Save, RotateCcw, User } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { SDLCPhase, SDLCTask, PreloadedPrompt, CustomPrompt, ActivityEvent } from '../types'
import type { Role } from '../types/role'
import { dbCreate, dbList } from '../stores/db'
import { customPromptStore } from '../stores/customPromptStore'
import { settingsStore } from '../stores/settingsStore'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [hasAIProvider, setHasAIProvider] = useState(false)

  useEffect(() => {
    const fetchJson = (path: string) =>
      fetch(path).then((r) => { if (!r.ok) return []; return r.json() }).catch(() => [])

    Promise.all([
      fetchJson('/pm-knowledge-skill-studio/config/sdlcPhases.json'),
      fetchJson('/pm-knowledge-skill-studio/config/sdlcTasks.json'),
      fetchJson('/pm-knowledge-skill-studio/config/preloadedPrompts.json'),
      fetchJson('/pm-knowledge-skill-studio/config/roles.json'),
      dbList('aiProviderSettings').catch(() => [] as unknown[]),
      settingsStore.get<string>('primaryRole').catch(() => undefined),
    ]).then(([phasesData, tasksData, promptsData, rolesData, aiSettings, primaryRoleName]) => {
      const phaseList = Array.isArray(phasesData) ? phasesData as SDLCPhase[] : []
      const roleList = Array.isArray(rolesData) ? rolesData as Role[] : []
      setPhases(phaseList)
      setTasks(Array.isArray(tasksData) ? tasksData as SDLCTask[] : [])
      setPreloadedPrompts(Array.isArray(promptsData) ? promptsData as PreloadedPrompt[] : [])
      setRoles(roleList)
      setHasAIProvider(Array.isArray(aiSettings) && aiSettings.length > 0)
      if (phaseList.length > 0) setSelectedPhase(phaseList[0])

      // Pre-select the user's primary role from Settings
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
    recordActivity('sdlc_phase_selected', { phaseId: phase.id, phaseName: phase.name })
  }

  const handleTaskSelect = (task: SDLCTask) => {
    setSelectedTask(task)
    setLoadedPrompt(null)
    setPromptMarkdown('')
    recordActivity('sdlc_task_selected', { taskId: task.id, phaseId: task.phaseId })
  }

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId)
    setSelectedTask(null)
    setLoadedPrompt(null)
    setPromptMarkdown('')
  }

  const handleLoadPrompt = useCallback(async () => {
    if (!selectedTask) return
    setPromptLoading(true)
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
        <p className="text-muted text-sm">Select your role, pick a phase and task, then load an AI-ready prompt.</p>
      </div>

      {/* Role selector */}
      <div className="panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
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
                  {selectedRoleId === 'all' ? 'No tasks defined for this phase.' : `No tasks for this role in this phase. Try "All Roles" to see all tasks.`}
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
                      <button className="btn btn-ghost btn-sm" onClick={() => { setPromptMarkdown(''); setLoadedPrompt(null) }}><RotateCcw size={13} /> Reset</button>
                      <button className="btn btn-secondary btn-sm" onClick={handleSaveCustomPrompt} disabled={saving}><Save size={13} /> {saving ? 'Saving...' : 'Save Custom Prompt'}</button>
                      <button className="btn btn-primary btn-sm" disabled={!hasAIProvider} title={hasAIProvider ? undefined : 'Configure an AI provider first'}>
                        <Zap size={13} /> Run Prompt
                      </button>
                    </div>
                  </div>

                  {!hasAIProvider && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                      No AI provider configured. <a href="/pm-knowledge-skill-studio/provider-settings">Configure one in Provider Settings</a> to run prompts.
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
