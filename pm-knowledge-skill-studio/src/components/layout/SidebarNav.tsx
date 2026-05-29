import React, { useState, useCallback, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Globe,
  BookOpen,
  Layers,
  User,
  Star,
  GitBranch,
  FolderOpen,
  Map,
  Zap,
  Bot,
  FileText,
  CheckSquare,
  Lightbulb,
  BarChart2,
  ArrowUpDown,
  Settings2,
  Settings,
  HelpCircle,
  Menu,
  X,
  Activity,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  highlight?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/domain-builder', label: 'Step 1: Domain Builder', icon: Globe, highlight: true },
  { path: '/knowledge', label: 'Knowledge Library', icon: BookOpen },
  { path: '/domain-library', label: 'Domain Library', icon: Layers },
  { path: '/work-style', label: 'Work Style', icon: User },
  { path: '/skills', label: 'Skills Studio', icon: Star },
  { path: '/sdlc', label: 'SDLC Workspace', icon: GitBranch },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/playbooks', label: 'Playbooks', icon: Map },
  { path: '/prompt-packs', label: 'Prompt Packs', icon: Zap },
  { path: '/ai-runs', label: 'AI Runs', icon: Bot },
  { path: '/project-notes', label: 'Project Notes', icon: FileText },
  { path: '/decisions', label: 'Decision Log', icon: CheckSquare },
  { path: '/lessons', label: 'Lessons Learned', icon: Lightbulb },
  { path: '/activity', label: 'Activity Dashboard', icon: BarChart2 },
  { path: '/import-export', label: 'Import / Export', icon: ArrowUpDown },
  { path: '/provider-settings', label: 'Provider Settings', icon: Settings2 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help', label: 'Help', icon: HelpCircle },
]

export default function SidebarNav() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeMobile()
  }, [location.pathname, closeMobile])

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {/* Mobile top bar — shown only on small screens via CSS */}
      <div className="mobile-header">
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleMobile}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: 'linear-gradient(135deg, var(--accent), #7b61ff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={13} color="#fff" />
          </div>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text)' }}>
            PM Knowledge &amp; Skill Studio
          </span>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — class-based open state (no !important inline style conflicts) */}
      <nav
        className={mobileOpen ? 'sidebar sidebar-mobile-open' : 'sidebar'}
        aria-label="Main navigation"
      >
        {/* Logo / App name — desktop only (hidden on mobile where mobile-header shows) */}
        <div
          style={{
            padding: '1.125rem 1rem 0.875rem',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, var(--accent), #7b61ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Activity size={16} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                PM Knowledge
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--muted)',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Skill Studio
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div
          style={{
            padding: '0.5rem 0',
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.875rem',
                  margin: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--accent)' : item.highlight ? 'var(--warning)' : 'var(--muted)',
                  background: active ? 'rgba(74, 163, 255, 0.12)' : 'transparent',
                  border: active
                    ? '1px solid rgba(74, 163, 255, 0.2)'
                    : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition)',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'rgba(255,255,255,0.05)'
                    el.style.color = 'var(--text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLAnchorElement
                    el.style.background = 'transparent'
                    el.style.color = item.highlight ? 'var(--warning)' : 'var(--muted)'
                  }
                }}
              >
                <Icon
                  size={15}
                  style={{ flexShrink: 0, opacity: active ? 1 : 0.75 }}
                />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </span>
                {item.highlight && !active && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--warning)',
                      flexShrink: 0,
                      opacity: 0.8,
                    }}
                  />
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Footer version tag */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              color: 'var(--muted)',
              opacity: 0.6,
            }}
          >
            v1.0.0 — browser-local
          </span>
        </div>
      </nav>
    </>
  )
}
