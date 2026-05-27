import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { domainKnowledgeStore } from '../stores/domainKnowledgeStore'
import { skillStore } from '../stores/skillStore'
import { aiRunStore } from '../stores/aiRunStore'
import { knowledgeStore } from '../stores/knowledgeStore'
import { dbList } from '../stores/db'
import type { ActivityEvent, Playbook, PromptPack } from '../types'

interface DashboardCounts {
  domains: number
  skills: number
  aiRuns: number
  playbooks: number
  promptPacks: number
  knowledgeNotes: number
}

interface DashboardCardProps {
  title: string
  count: number
  description: string
  icon: string
  linkTo: string
  accent?: boolean
}

function DashboardCard({ title, count, description, icon, linkTo, accent }: DashboardCardProps) {
  return (
    <Link to={linkTo} style={{ textDecoration: 'none' }}>
      <div
        className="card card-clickable"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          borderColor: accent ? 'rgba(74,163,255,0.3)' : undefined,
          background: accent ? 'linear-gradient(135deg, rgba(74,163,255,0.08), rgba(74,163,255,0.02))' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <span
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: accent ? 'var(--accent)' : 'var(--text)',
            }}
          >
            {count}
          </span>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{title}</div>
          <div className="text-sm text-muted">{description}</div>
        </div>
      </div>
    </Link>
  )
}

const EVENT_LABELS: Record<string, string> = {
  app_opened: 'App opened',
  domain_selected: 'Domain selected',
  domain_markdown_created: 'Domain markdown created',
  skill_suggested: 'Skill suggested',
  skill_accepted: 'Skill accepted',
  prompt_executed: 'Prompt executed',
  ai_run_success: 'AI run completed',
  ai_run_failed: 'AI run failed',
  playbook_created: 'Playbook created',
  provider_configured: 'AI provider configured',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const QUICK_LINKS = [
  { to: '/domain-builder', label: 'Build a Domain', icon: '🏗️', desc: 'Add structured domain knowledge' },
  { to: '/sdlc-workspace', label: 'SDLC Workspace', icon: '⚙️', desc: 'Browse phases, tasks, and prompts' },
  { to: '/skills-studio', label: 'Skills Studio', icon: '🎯', desc: 'Track your PM skills' },
  { to: '/playbooks', label: 'Playbooks', icon: '📖', desc: 'View and create playbooks' },
  { to: '/prompt-packs', label: 'Prompt Packs', icon: '📦', desc: 'Build and run AI prompt packs' },
  { to: '/ai-runs', label: 'AI Runs', icon: '🤖', desc: 'View your AI execution history' },
  { to: '/knowledge-library', label: 'Knowledge Library', icon: '📚', desc: 'Browse your notes' },
  { to: '/provider-settings', label: 'Configure AI', icon: '🔑', desc: 'Set up your AI provider' },
]

export default function Dashboard() {
  const [counts, setCounts] = useState<DashboardCounts>({
    domains: 0,
    skills: 0,
    aiRuns: 0,
    playbooks: 0,
    promptPacks: 0,
    knowledgeNotes: 0,
  })
  const [recentActivity, setRecentActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [domains, skills, aiRuns, playbooks, promptPacks, notes, activity] = await Promise.all([
          domainKnowledgeStore.list(),
          skillStore.list(),
          aiRunStore.list(),
          dbList<Playbook>('playbooks'),
          dbList<PromptPack>('promptPacks'),
          knowledgeStore.list(),
          dbList<ActivityEvent>('activityEvents'),
        ])

        setCounts({
          domains: domains.length,
          skills: skills.length,
          aiRuns: aiRuns.length,
          playbooks: playbooks.length,
          promptPacks: promptPacks.length,
          knowledgeNotes: notes.length,
        })

        const sorted = [...activity].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setRecentActivity(sorted.slice(0, 5))
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="page-container">
      {/* Hero */}
      <div
        className="panel"
        style={{
          padding: '2rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(74,163,255,0.10), rgba(74,163,255,0.02))',
          borderColor: 'rgba(74,163,255,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>PM Knowledge & Skill Studio</h1>
            <p className="text-muted" style={{ maxWidth: 600, marginBottom: '1.25rem' }}>
              Your personal workspace for building domain knowledge, tracking PM skills, running AI-assisted
              prompts, and capturing lessons learned — all stored locally in your browser.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to="/domain-builder" className="btn btn-primary">
                🏗️ Start Building a Domain
              </Link>
              <Link to="/provider-settings" className="btn btn-secondary">
                🔑 Configure AI Provider
              </Link>
            </div>
          </div>
          <div
            style={{
              background: 'rgba(74,163,255,0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: '1rem 1.5rem',
              fontSize: '0.8125rem',
              color: 'var(--accent)',
              border: '1px solid rgba(74,163,255,0.2)',
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>All data is local</div>
            <div style={{ color: 'var(--muted)' }}>Stored in your browser's IndexedDB</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Your Workspace</h2>
        {loading && <div className="loading-spinner loading-spinner-sm" />}
      </div>
      <div className="grid-auto" style={{ marginBottom: '1.5rem' }}>
        <DashboardCard
          title="Domain Files"
          count={counts.domains}
          description="Structured domain knowledge ready for AI prompts"
          icon="🗂️"
          linkTo="/domain-library"
          accent={counts.domains === 0}
        />
        <DashboardCard
          title="Skills"
          count={counts.skills}
          description="PM skills tracked with maturity levels"
          icon="🎯"
          linkTo="/skills-studio"
        />
        <DashboardCard
          title="AI Runs"
          count={counts.aiRuns}
          description="Prompts executed against AI providers"
          icon="🤖"
          linkTo="/ai-runs"
        />
        <DashboardCard
          title="Playbooks"
          count={counts.playbooks}
          description="Step-by-step delivery guides"
          icon="📖"
          linkTo="/playbooks"
        />
        <DashboardCard
          title="Prompt Packs"
          count={counts.promptPacks}
          description="Curated prompt bundles with context"
          icon="📦"
          linkTo="/prompt-packs"
        />
        <DashboardCard
          title="Knowledge Notes"
          count={counts.knowledgeNotes}
          description="Saved notes and AI outputs"
          icon="📚"
          linkTo="/knowledge-library"
        />
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Quick Links */}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Navigation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {QUICK_LINKS.map((link) => (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                <div className="card card-clickable" style={{ padding: '0.875rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{link.label}</span>
                  </div>
                  <div className="text-xs text-muted">{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Activity</h2>
            <Link to="/activity-dashboard" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div className="panel" style={{ padding: '0' }}>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '1.5rem', opacity: 0.4 }}>📋</div>
                No activity yet. Start by building a domain!
              </div>
            ) : (
              <div>
                {recentActivity.map((event, i) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.625rem',
                    }}
                  >
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        marginTop: '0.45rem',
                        flexShrink: 0,
                        background:
                          event.status === 'success'
                            ? 'var(--success)'
                            : event.status === 'failed'
                            ? 'var(--error)'
                            : event.status === 'blocked'
                            ? 'var(--warning)'
                            : 'var(--muted)',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-sm" style={{ fontWeight: 500, marginBottom: '0.1rem' }}>
                        {EVENT_LABELS[event.eventType] ?? event.eventType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted">{formatRelativeTime(event.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {counts.domains === 0 && (
            <div
              className="alert alert-info"
              style={{ marginTop: '1rem' }}
            >
              <span>💡</span>
              <div>
                <strong>Get started:</strong> Use the Domain Builder to add your first domain. This unlocks AI
                prompts and skill suggestions.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
