import { useState, useEffect, useCallback } from 'react'
import { BarChart2, Download, Trash2, TrendingUp, Shield, Zap, Users, type LucideIcon } from 'lucide-react'
import { dbList, dbClear } from '../stores/db'
import { calculateMetrics } from '../lib/monitoring/metricsCalculator'
import type { ActivityEvent, ActivityMetrics } from '../types'
import PageHeader from '../components/layout/PageHeader'
import ConfirmationDialog from '../components/ui/ConfirmationDialog'
import { downloadFile } from '../lib/importExport'

function MetricCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: LucideIcon; accent?: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: accent ? 'rgba(74,163,255,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={18} className={accent ? 'text-accent' : 'text-muted'} />
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</div>
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</div>
      </div>
    </div>
  )
}

function SimpleBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
        <span>{label}</span><span className="text-muted">{value}</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showClear, setShowClear] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    const evts = await dbList<ActivityEvent>('activityEvents')
    setEvents(evts)
    setMetrics(calculateMetrics(evts))
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = () => {
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), events }, null, 2)
    downloadFile(json, `activity-log-${new Date().toISOString().slice(0, 10)}.json`)
  }

  const handleClear = async () => {
    await dbClear('activityEvents')
    setShowClear(false)
    loadData()
  }

  if (loading) return <div className="page-container"><div className="text-muted">Loading...</div></div>

  const roleEntries = Object.entries(metrics?.rolesSelectedBreakdown ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number))
  const phaseEntries = Object.entries(metrics?.phaseExecutionCounts ?? {}).sort((a, b) => (b[1] as number) - (a[1] as number))
  const providerEntries = Object.entries(metrics?.aiRunsByProvider ?? {}).sort((a, b) => b[1] - a[1])
  const maxRole = roleEntries[0]?.[1] ?? 1
  const maxPhase = phaseEntries[0]?.[1] ?? 1

  return (
    <div className="page-container">
      <PageHeader title="Activity Dashboard" subtitle="Track how you use PM Knowledge & Skill Studio over time"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Download size={14} /> Export Log
            </button>
            <button className="btn btn-danger" onClick={() => setShowClear(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <MetricCard label="App Opens" value={metrics?.totalAppOpens ?? 0} icon={TrendingUp} accent />
        <MetricCard label="Prompt Executions" value={metrics?.promptExecutionCount ?? 0} icon={Zap} accent />
        <MetricCard label="AI Runs" value={providerEntries.reduce((s, [, v]) => s + v, 0)} icon={BarChart2} />
        <MetricCard label="Skills Accepted" value={metrics?.skillsAccepted ?? 0} icon={Users} />
        <MetricCard label="Governance Blocks" value={metrics?.governanceBlocks ?? 0} icon={Shield} />
        <MetricCard label="Total Events" value={events.length} icon={BarChart2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Role Usage</h3>
          {roleEntries.length === 0 ? <p className="text-muted" style={{ fontSize: '0.85rem' }}>No role selections yet.</p>
            : roleEntries.slice(0, 8).map(([role, count]) => <SimpleBar key={role} label={role.toUpperCase()} value={count} max={maxRole} />)}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>SDLC Phase Usage</h3>
          {phaseEntries.length === 0 ? <p className="text-muted" style={{ fontSize: '0.85rem' }}>No phases selected yet.</p>
            : phaseEntries.slice(0, 8).map(([phase, count]) => <SimpleBar key={phase} label={phase} value={count} max={maxPhase} />)}
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>AI Provider Usage</h3>
          {providerEntries.length === 0 ? <p className="text-muted" style={{ fontSize: '0.85rem' }}>No AI runs yet.</p>
            : providerEntries.map(([p, c]) => <SimpleBar key={p} label={p} value={c} max={providerEntries[0]?.[1] ?? 1} />)}
          {metrics && (metrics.governanceBlocks > 0 || metrics.governanceWarnings > 0) && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Governance</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div><span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)' }}>{metrics.governanceBlocks}</span><p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Blocks</p></div>
                <div><span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--warning)' }}>{metrics.governanceWarnings}</span><p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Warnings</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity (last 50 events)</h3>
        {events.length === 0 ? <p className="text-muted" style={{ fontSize: '0.85rem' }}>No activity recorded yet.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Event Type', 'Role', 'Domain', 'Provider', 'Status', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.slice(-50).reverse().map(evt => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}><code style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{evt.eventType}</code></td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{evt.roleId ?? '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{evt.domainId ?? '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{evt.aiProviderId ?? '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}><span style={{ color: evt.status === 'success' ? 'var(--success)' : evt.status === 'blocked' ? 'var(--error)' : 'var(--warning)', fontSize: '0.75rem' }}>{evt.status}</span></td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{new Date(evt.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showClear && <ConfirmationDialog open={showClear} title="Clear Activity Log" message="Permanently delete all activity events?" confirmLabel="Clear All" variant="danger" onConfirm={handleClear} onCancel={() => setShowClear(false)} />}
    </div>
  )
}

