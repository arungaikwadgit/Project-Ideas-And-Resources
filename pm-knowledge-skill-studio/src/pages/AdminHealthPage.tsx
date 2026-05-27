import { useState, useEffect, useCallback } from 'react'
import { Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Lock } from 'lucide-react'
import { dbList, dbClear } from '../stores/db'
import { calculateMetrics } from '../lib/monitoring/metricsCalculator'
import type { ActivityEvent } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { downloadFile } from '../lib/importExport'

const ADMIN_PASSWORD = 'admin123'
const SESSION_KEY = 'pmks_admin_authenticated'

interface HealthCheck { id: string; name: string; status: 'passed' | 'warning' | 'failed'; message: string }

async function runHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []
  const configs = ['roles', 'sdlcPhases', 'sdlcTasks', 'domainCatalog', 'preloadedPrompts', 'aiProviders', 'searchProviders']
  for (const cfg of configs) {
    try {
      const r = await fetch(`/pm-knowledge-skill-studio/config/${cfg}.json`)
      if (r.ok) {
        const data = await r.json() as unknown
        const count = Array.isArray(data) ? data.length : Object.keys(data as object).length
        checks.push({ id: `config-${cfg}`, name: `Config: ${cfg}.json`, status: 'passed', message: `Loaded (${count} items)` })
      } else {
        checks.push({ id: `config-${cfg}`, name: `Config: ${cfg}.json`, status: 'warning', message: `HTTP ${r.status} — optional file missing` })
      }
    } catch {
      checks.push({ id: `config-${cfg}`, name: `Config: ${cfg}.json`, status: 'warning', message: 'Could not load' })
    }
  }
  try {
    const items = await dbList('activityEvents')
    checks.push({ id: 'idb-rw', name: 'IndexedDB Read/Write', status: 'passed', message: `OK (${items.length} activity events)` })
  } catch {
    checks.push({ id: 'idb-rw', name: 'IndexedDB Read/Write', status: 'failed', message: 'IndexedDB unavailable' })
  }
  return checks
}

function CheckRow({ check }: { check: HealthCheck }) {
  const icon = check.status === 'passed'
    ? <CheckCircle size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
    : check.status === 'warning'
    ? <AlertTriangle size={15} style={{ color: 'var(--warning)', flexShrink: 0 }} />
    : <XCircle size={15} style={{ color: 'var(--error)', flexShrink: 0 }} />
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
      {icon}
      <span style={{ flex: 1 }}>{check.name}</span>
      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{check.message}</span>
    </div>
  )
}

export default function AdminHealthPage() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [running, setRunning] = useState(false)
  const [metrics, setMetrics] = useState<ReturnType<typeof calculateMetrics> | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const loadDashboard = useCallback(async () => {
    const evts = await dbList<ActivityEvent>('activityEvents')
    setMetrics(calculateMetrics(evts))
    const storeNames = ['domainKnowledge', 'knowledge', 'skills', 'playbooks', 'promptPacks', 'aiRuns', 'projectNotes', 'decisions', 'lessons', 'activityEvents', 'customPrompts'] as const
    const c: Record<string, number> = {}
    for (const s of storeNames) {
      try { c[s] = (await dbList(s)).length } catch { c[s] = 0 }
    }
    setCounts(c)
  }, [])

  useEffect(() => { if (authenticated) loadDashboard() }, [authenticated, loadDashboard])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password.')
    }
  }

  const handleRunChecks = async () => {
    setRunning(true)
    setHealthChecks(await runHealthChecks())
    setRunning(false)
  }

  const handleExportDiagnostics = () => {
    const diag = { exportedAt: new Date().toISOString(), version: '1.0.0', counts, metrics, healthChecks, note: 'No API keys are included in diagnostics.' }
    downloadFile(JSON.stringify(diag, null, 2), `pmks-diagnostics-${new Date().toISOString().slice(0, 10)}.json`)
  }

  if (!authenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Lock size={20} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Admin Health</h1>
          </div>
          <div style={{ background: 'rgba(255,204,102,0.1)', border: '1px solid rgba(255,204,102,0.25)', borderRadius: 6, padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
            ⚠️ <strong>Client-side demo gate only.</strong> Not production-grade authentication. Do not use in sensitive environments.
          </div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--muted)' }}>Admin Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="input" placeholder="Enter admin password" style={{ width: '100%', marginBottom: '1rem' }} />
          {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" onClick={handleLogin} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Shield size={14} /> Access Health Dashboard
          </button>
        </div>
      </div>
    )
  }

  const passed = healthChecks.filter(c => c.status === 'passed').length
  const failed = healthChecks.filter(c => c.status === 'failed').length
  const warnings = healthChecks.filter(c => c.status === 'warning').length

  return (
    <div className="page-container">
      <PageHeader title="Admin Health Dashboard" subtitle="System health, data counts, and execution diagnostics"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handleRunChecks} disabled={running} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <RefreshCw size={14} /> {running ? 'Running...' : 'Run Health Check'}
            </button>
            <button className="btn btn-secondary" onClick={handleExportDiagnostics} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Download size={14} /> Export Diagnostics
            </button>
          </div>
        }
      />

      <div style={{ background: 'rgba(255,204,102,0.08)', border: '1px solid rgba(255,204,102,0.2)', borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
        ⚠️ Admin password is a client-side demo gate only. Not suitable for production.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>App Health</h3>
          {[['Version', '1.0.0'], ['Environment', import.meta.env.MODE ?? 'production'], ['IndexedDB', typeof indexedDB !== 'undefined' ? '✓ Available' : '✗ Unavailable']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <span className="text-muted">{k}</span><span>{v}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Data Counts</h3>
          {Object.entries(counts).map(([store, count]) => (
            <div key={store} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <span className="text-muted">{store}</span><span style={{ fontWeight: 600 }}>{count}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Execution Metrics</h3>
          {metrics && [
            ['App Opens', metrics.totalAppOpens], ['Prompt Executions', metrics.promptExecutionCount],
            ['Governance Blocks', metrics.governanceBlocks], ['Governance Warnings', metrics.governanceWarnings],
            ['Skills Accepted', metrics.skillsAccepted], ['Domain Files Created', metrics.domainMarkdownCreated],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
              <span className="text-muted">{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {healthChecks.length > 0 ? (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Health Check Results</h3>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--success)' }}>✓ {passed}</span>
              {warnings > 0 && <span style={{ color: 'var(--warning)' }}>⚠ {warnings}</span>}
              {failed > 0 && <span style={{ color: 'var(--error)' }}>✗ {failed}</span>}
            </div>
          </div>
          {healthChecks.map(c => <CheckRow key={c.id} check={c} />)}
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Click "Run Health Check" to validate config files and IndexedDB connectivity.</p>
        </div>
      )}

      <div className="card" style={{ padding: '1.25rem', borderColor: 'rgba(255,107,107,0.3)' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--error)' }}>Danger Zone</h3>
        <button className="btn btn-danger" onClick={async () => { if (confirm('Clear all activity events?')) { await dbClear('activityEvents'); loadDashboard() } }} style={{ fontSize: '0.8rem' }}>
          Clear Activity Log
        </button>
      </div>
    </div>
  )
}
