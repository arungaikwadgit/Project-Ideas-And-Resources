import { useState, useEffect } from 'react'
import { User, Moon, Shield, Database, Info, Save } from 'lucide-react'
import { settingsStore } from '../stores/settingsStore'
import PageHeader from '../components/layout/PageHeader'

const ROLES = ['Product Manager', 'Product Owner', 'Project Manager', 'Delivery Manager', 'Scrum Master', 'Engineering Manager', 'Program Manager', 'Business Analyst', 'Technology Leader', 'Consultant / Client Partner']

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('')
  const [primaryRole, setPrimaryRole] = useState(ROLES[0])
  const [privacyMode, setPrivacyMode] = useState(false)
  const [backupReminder, setBackupReminder] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      settingsStore.get<string>('displayName'),
      settingsStore.get<string>('primaryRole'),
      settingsStore.get<boolean>('privacyMode'),
      settingsStore.get<boolean>('backupReminder'),
    ]).then(([name, role, privacy, backup]) => {
      if (name) setDisplayName(name)
      if (role) setPrimaryRole(role)
      if (privacy !== undefined) setPrivacyMode(privacy)
      if (backup !== undefined) setBackupReminder(backup)
    })
  }, [])

  const handleSave = async () => {
    await Promise.all([
      settingsStore.set('displayName', displayName),
      settingsStore.set('primaryRole', primaryRole),
      settingsStore.set('privacyMode', privacyMode),
      settingsStore.set('backupReminder', backupReminder),
    ])
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <PageHeader title="Settings" subtitle="Personalize your PM Knowledge & Skill Studio workspace" />

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <User size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Profile</h2>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Display Name</label>
          <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g., Alex Chen" style={{ width: '100%', maxWidth: 360 }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>Primary Role</label>
          <select className="input" value={primaryRole} onChange={e => setPrimaryRole(e.target.value)} style={{ width: '100%', maxWidth: 360 }}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Moon size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Theme</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ border: '2px solid var(--accent)', borderRadius: 8, padding: '0.75rem 1.25rem', background: 'var(--bg)', cursor: 'default', textAlign: 'center', fontSize: '0.85rem', minWidth: 100 }}>
            <div style={{ width: 40, height: 24, background: 'var(--panel)', borderRadius: 4, margin: '0 auto 0.5rem' }} />
            Dark ✓
          </div>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>Additional themes coming in a future update.</p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Shield size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Privacy & Data</h2>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={privacyMode} onChange={e => setPrivacyMode(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          <div>
            <div style={{ fontWeight: 500 }}>Privacy Mode</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Mask sensitive text in previews and AI run results</div>
          </div>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={backupReminder} onChange={e => setBackupReminder(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16 }} />
          <div>
            <div style={{ fontWeight: 500 }}>Backup Reminders</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Show a reminder to export your data periodically</div>
          </div>
        </label>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Database size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Storage</h2>
        </div>
        <p className="text-muted" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          All data is stored locally in your browser's IndexedDB. No data is sent to any server except when you explicitly run prompts with a configured AI provider. Use <a href="/import-export" style={{ color: 'var(--accent)' }}>Import / Export</a> to back up your data.
        </p>
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Info size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>About</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
          {[['App Name', 'PM Knowledge & Skill Studio'], ['Version', '1.0.0'], ['Build', import.meta.env.MODE ?? 'production'], ['License', 'MIT']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '1rem' }}>
              <span className="text-muted" style={{ minWidth: 100 }}>{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Save size={14} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  )
}
