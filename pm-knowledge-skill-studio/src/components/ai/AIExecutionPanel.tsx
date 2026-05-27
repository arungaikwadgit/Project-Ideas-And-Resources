import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Square,
  Save,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useConfig } from '../../hooks/useConfig'
import { useGovernance } from '../../hooks/useGovernance'
import SafetyScanPanel from '../governance/SafetyScanPanel'
import ProviderSelector from './ProviderSelector'
import ModelSelector from './ModelSelector'
import { runGovernanceCheck } from '../../lib/governance/governanceEngine'
import { executePrompt } from '../../lib/ai/aiRuntime'
import { aiRunStore } from '../../stores/aiRunStore'
import { providerSettingsStore } from '../../stores/providerSettingsStore'
import { knowledgeStore } from '../../stores/knowledgeStore'
import type { AIProviderConfig, AIProviderSettings, AIRun, KnowledgeNote } from '../../types'

interface AIExecutionPanelProps {
  promptMarkdown: string
  promptPackId?: string
  preloadedPromptId?: string
  onResultSaved?: (runId: string) => void
  onClose?: () => void
}

type PanelPhase =
  | 'scan'         // governance scan in progress / displayed
  | 'configure'    // provider + model selection
  | 'running'      // prompt executing
  | 'result'       // result displayed
  | 'saved'        // saved as knowledge

/**
 * Self-contained AI execution panel.
 *
 * Flow:
 * 1. Run governance scan on the prompt.
 * 2. If safe (or acknowledged), allow provider + model selection.
 * 3. Execute the prompt via aiRuntime → save AIRun to IndexedDB.
 * 4. Display result; optionally save as a KnowledgeNote.
 */
export default function AIExecutionPanel({
  promptMarkdown,
  promptPackId,
  preloadedPromptId,
  onResultSaved,
  onClose,
}: AIExecutionPanelProps) {
  // ---- Config ----------------------------------------------------------------
  const { data: providers } = useConfig<AIProviderConfig[]>('aiProviders.json')

  // ---- Governance ------------------------------------------------------------
  const { result: govResult, acknowledged, canProceed, scan, acknowledge } = useGovernance()
  const [scanDone, setScanDone] = useState(false)

  // ---- Provider / model selection -------------------------------------------
  const [selectedProvider, setSelectedProvider] = useState<AIProviderConfig | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [providerApiKey, setProviderApiKey] = useState<string | undefined>(undefined)
  const [providerConfigError, setProviderConfigError] = useState<string | null>(null)

  // ---- Execution state -------------------------------------------------------
  const [phase, setPhase] = useState<PanelPhase>('scan')
  const [running, setRunning] = useState(false)
  const [resultMarkdown, setResultMarkdown] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [savedRunId, setSavedRunId] = useState<string | null>(null)
  const [savingKnowledge, setSavingKnowledge] = useState(false)
  const [knowledgeSaved, setKnowledgeSaved] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  // ---- Result section expand/collapse ----------------------------------------
  const [resultExpanded, setResultExpanded] = useState(true)

  // ---------------------------------------------------------------------------
  // Step 1: governance scan on mount / when prompt changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!promptMarkdown.trim()) return
    setScanDone(false)
    const result = scan(promptMarkdown)
    setScanDone(true)
    if (result.severity !== 'blocked') {
      setPhase('scan')
    }
  }, [promptMarkdown]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Step 2: load API key when provider changes
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedProvider) return
    setProviderConfigError(null)

    providerSettingsStore
      .getAIProviderSettings(selectedProvider.id)
      .then(({ apiKey }) => {
        setProviderApiKey(apiKey)
        if (selectedProvider.requiresApiKey && !apiKey) {
          setProviderConfigError(
            `No API key found for ${selectedProvider.displayName}. Configure it in Provider Settings.`,
          )
        }
      })
      .catch(() => {
        setProviderApiKey(undefined)
      })
  }, [selectedProvider])

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function handleProviderChange(provider: AIProviderConfig) {
    setSelectedProvider(provider)
    setSelectedModelId(provider.defaultModel || null)
    setRunError(null)
  }

  function handleProceedFromScan() {
    if (govResult?.severity === 'warning') {
      acknowledge()
    }
    setPhase('configure')
  }

  // ---------------------------------------------------------------------------
  // Step 3: execute prompt
  // ---------------------------------------------------------------------------

  const handleRun = useCallback(async () => {
    if (!selectedProvider || !selectedModelId) return

    const settings: AIProviderSettings = {
      providerType: selectedProvider.providerType,
      apiKey: providerApiKey,
      baseUrl: selectedProvider.baseUrl || undefined,
      model: selectedModelId,
      maxOutputTokens: 4096,
      temperature: 0.7,
      timeoutMs: 60_000,
    }

    abortRef.current = new AbortController()
    setRunning(true)
    setRunError(null)
    setResultMarkdown(null)
    setPhase('running')

    // Create a draft AIRun record
    let run: AIRun | null = null
    try {
      run = await aiRunStore.create({
        promptPackId,
        preloadedPromptId,
        providerId: selectedProvider.id,
        model: selectedModelId,
        promptSnapshotMarkdown: promptMarkdown,
        inputContextSnapshot: '',
        resultMarkdown: '',
        status: 'running',
        linkedSkillIds: [],
        linkedDomainIds: [],
        linkedPlaybookIds: [],
      })
    } catch {
      // Non-fatal — continue without a stored run id
    }

    try {
      const response = await executePrompt(
        promptMarkdown,
        settings,
        abortRef.current.signal,
      )

      const resultText = response.text

      // Persist result
      if (run) {
        const updated: AIRun = {
          ...run,
          resultMarkdown: resultText,
          status: 'success',
          usageEstimate: response.usage
            ? {
                inputTokens: response.usage.inputTokens,
                outputTokens: response.usage.outputTokens,
                totalTokens:
                  (response.usage.inputTokens ?? 0) + (response.usage.outputTokens ?? 0),
              }
            : undefined,
        }
        await aiRunStore.update(updated)
        setSavedRunId(run.id)
      }

      setResultMarkdown(resultText)
      setPhase('result')
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'An unknown error occurred during execution.'

      const wasCancelled =
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 'CANCELLED'

      if (run) {
        await aiRunStore.update({
          ...run,
          status: wasCancelled ? 'cancelled' : 'failed',
          errorSummary: msg,
          resultMarkdown: '',
        })
      }

      if (!wasCancelled) {
        setRunError(msg)
        setPhase('configure')
      } else {
        setPhase('configure')
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }, [selectedProvider, selectedModelId, providerApiKey, promptMarkdown, promptPackId, preloadedPromptId])

  function handleCancel() {
    abortRef.current?.abort()
  }

  // ---------------------------------------------------------------------------
  // Step 4: save result as knowledge note
  // ---------------------------------------------------------------------------

  async function handleSaveAsKnowledge() {
    if (!resultMarkdown || !savedRunId) return
    setSavingKnowledge(true)
    try {
      const note: Omit<KnowledgeNote, 'id' | 'createdAt' | 'updatedAt'> = {
        title: `AI Result — ${new Date().toLocaleDateString()}`,
        contentMarkdown: resultMarkdown,
        category: 'AI-Generated',
        tags: ['ai-result'],
        isFavorite: false,
        linkedSkillIds: [],
        linkedDomainIds: [],
        linkedPlaybookIds: [],
        linkedAiRunIds: [savedRunId],
        linkedProjectIds: [],
      }
      const saved = await knowledgeStore.create(note)
      setKnowledgeSaved(true)
      setPhase('saved')
      onResultSaved?.(savedRunId)

      // Also update the AIRun to reference the knowledge note
      const run = await aiRunStore.getById(savedRunId)
      if (run) {
        await aiRunStore.update({ ...run, savedAsKnowledgeId: saved.id })
      }
    } catch {
      // Non-fatal — just show an error
    } finally {
      setSavingKnowledge(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const canRun =
    canProceed &&
    !!selectedProvider &&
    !!selectedModelId &&
    (!selectedProvider.requiresApiKey || !!providerApiKey) &&
    !running

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Run with AI</h3>
        {onClose && (
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 1. Governance scan result                                            */}
      {/* -------------------------------------------------------------------- */}
      {scanDone && govResult && (
        <section>
          <SectionLabel>Governance Scan</SectionLabel>
          <SafetyScanPanel
            result={govResult}
            onProceedWithCaution={
              govResult.severity === 'warning' && !acknowledged
                ? handleProceedFromScan
                : undefined
            }
          />
          {govResult.severity === 'none' && phase === 'scan' && (
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleProceedFromScan}
              >
                Continue to configure
              </button>
            </div>
          )}
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. Provider config warning                                           */}
      {/* -------------------------------------------------------------------- */}
      {providerConfigError && (
        <div className="alert alert-warning" style={{ fontSize: '0.875rem' }}>
          <AlertTriangle size={14} />
          {providerConfigError}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 3. Provider + model selection                                         */}
      {/* -------------------------------------------------------------------- */}
      {(phase === 'configure' || phase === 'running' || phase === 'result' || phase === 'saved') && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <SectionLabel>Provider &amp; Model</SectionLabel>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">AI Provider</label>
            <ProviderSelector
              selectedProviderId={selectedProvider?.id ?? null}
              onChange={handleProviderChange}
              disabled={running}
              showDescription={false}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Model</label>
            <ModelSelector
              provider={selectedProvider}
              selectedModelId={selectedModelId}
              onChange={setSelectedModelId}
              disabled={running}
              showModelInfo={true}
            />
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 4. Run / cancel button                                               */}
      {/* -------------------------------------------------------------------- */}
      {(phase === 'configure' || phase === 'running' || phase === 'result') && (
        <section>
          {runError && (
            <div className="alert alert-error" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              <AlertCircle size={14} />
              {runError}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {running ? (
              <>
                <div className="loading-spinner loading-spinner-sm" />
                <span style={{ fontSize: '0.875rem', color: 'var(--muted)', flex: 1 }}>
                  Running prompt…
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleCancel}
                >
                  <Square size={13} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRun}
                disabled={!canRun}
              >
                <Play size={14} />
                {resultMarkdown ? 'Run Again' : 'Run Prompt'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 5. Result preview                                                    */}
      {/* -------------------------------------------------------------------- */}
      {resultMarkdown && (phase === 'result' || phase === 'saved') && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <SectionLabel>Result</SectionLabel>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setResultExpanded((v) => !v)}
              aria-label={resultExpanded ? 'Collapse result' : 'Expand result'}
            >
              {resultExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {resultExpanded && (
            <div
              style={{
                padding: '1rem',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'var(--font)',
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                }}
              >
                {resultMarkdown}
              </pre>
            </div>
          )}

          {/* Save as knowledge */}
          {!knowledgeSaved && (
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveAsKnowledge}
                disabled={savingKnowledge}
              >
                {savingKnowledge ? (
                  <>
                    <div className="loading-spinner loading-spinner-sm" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save as Knowledge
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 6. Saved confirmation                                                */}
      {/* -------------------------------------------------------------------- */}
      {phase === 'saved' && knowledgeSaved && (
        <div className="alert alert-success" style={{ fontSize: '0.875rem' }}>
          <CheckCircle2 size={14} />
          Result saved to your Knowledge Library.
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: 'var(--muted)',
        marginBottom: '0.625rem',
      }}
    >
      {children}
    </p>
  )
}
