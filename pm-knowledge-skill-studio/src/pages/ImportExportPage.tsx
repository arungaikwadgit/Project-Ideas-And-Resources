import { useState, useRef } from 'react'
import { Download, Upload, AlertTriangle, CheckCircle, Package, Shield } from 'lucide-react'
import { exportKnowledgeBundle, importKnowledgeBundle, downloadFile } from '../lib/importExport'
import PageHeader from '../components/layout/PageHeader'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { dbClear } from '../stores/db'

export default function ImportExportPage() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    try {
      const json = await exportKnowledgeBundle()
      downloadFile(json, `pmks-export-${new Date().toISOString().slice(0, 10)}.json`)
    } catch (err) {
      console.error('Export failed', err)
    } finally {
      setExporting(false)
    }
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setImportError(null)
    try {
      const text = await file.text()
      const result = await importKnowledgeBundle(text)
      setImportResult(result)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleReset = async () => {
    const stores = ['domainKnowledge', 'knowledge', 'skills', 'playbooks', 'promptPacks', 'aiRuns', 'projectNotes', 'decisions', 'lessons', 'activityEvents', 'customPrompts', 'workStyle'] as const
    for (const s of stores) {
      try { await dbClear(s) } catch { /* best effort */ }
    }
    setShowReset(false)
    setResetConfirmText('')
    window.location.reload()
  }

  return (
    <div className="page-container">
      <PageHeader title="Import / Export" subtitle="Back up and restore your knowledge workspace" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Download size={18} className="text-accent" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Export All Data</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Download a complete JSON bundle of your knowledge workspace. Includes: domain knowledge, skills, playbooks, prompt packs, AI run history, project notes, decisions, and lessons learned.
          </p>
          <div style={{ background: 'rgba(126,231,135,0.08)', border: '1px solid rgba(126,231,135,0.2)', borderRadius: 6, padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--success)' }}>
            <Shield size={12} style={{ marginRight: '0.4rem', display: 'inline' }} />
            <strong>API keys are never exported.</strong> You'll need to re-enter provider keys on other devices.
          </div>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export All Data'}
          </button>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Upload size={18} className="text-accent" />
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Import Data Bundle</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Restore data from a previously exported JSON bundle. Imported items are merged with existing data — existing items with the same ID are skipped.
          </p>
          <div style={{ background: 'rgba(255,204,102,0.08)', border: '1px solid rgba(255,204,102,0.2)', borderRadius: 6, padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
            <AlertTriangle size={12} style={{ marginRight: '0.4rem', display: 'inline' }} />
            The bundle is validated before import. Only bundles from PM Knowledge & Skill Studio are accepted.
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={14} /> {importing ? 'Importing...' : 'Choose File to Import'}
          </button>

          {importResult && (
            <div style={{ marginTop: '1rem', background: 'rgba(126,231,135,0.08)', border: '1px solid rgba(126,231,135,0.2)', borderRadius: 6, padding: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                <CheckCircle size={14} /> Imported {importResult.imported} items successfully
              </div>
              {importResult.errors.length > 0 && (
                <ul style={{ paddingLeft: '1rem', color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
          {importError && (
            <div style={{ marginTop: '1rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 6, padding: '0.75rem', fontSize: '0.85rem', color: 'var(--error)' }}>
              {importError}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', borderColor: 'rgba(255,107,107,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Package size={18} style={{ color: 'var(--error)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--error)' }}>Danger Zone</h2>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          Reset all local data. This permanently deletes all domain knowledge, skills, playbooks, AI runs, and other workspace data. This cannot be undone. Export your data first.
        </p>
        <button className="btn btn-danger" onClick={() => setShowReset(true)}>Reset All Data</button>
      </div>

      {showReset && (
        <ConfirmationDialog
          open={showReset}
          title="Reset All Data"
          message={`This will permanently delete ALL your workspace data. Type "RESET" below to confirm.`}
          confirmLabel={resetConfirmText === 'RESET' ? 'Reset All Data' : 'Type RESET to confirm'}
          variant="danger"
          onConfirm={resetConfirmText === 'RESET' ? handleReset : () => {}}
          onCancel={() => { setShowReset(false); setResetConfirmText('') }}
        >
          <input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)} className="input" placeholder='Type "RESET" to confirm' style={{ width: '100%', marginTop: '1rem' }} />
        </ConfirmationDialog>
      )}
    </div>
  )
}
