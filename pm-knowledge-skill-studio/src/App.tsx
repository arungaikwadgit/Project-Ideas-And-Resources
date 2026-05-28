import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import SidebarNav from './components/layout/SidebarNav'
import { v4 as uuidv4 } from 'uuid'
import { dbCreate } from './stores/db'
import type { ActivityEvent } from './types'

// Lazy-loaded pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DomainBuilderPage = lazy(() => import('./pages/DomainBuilderPage'))
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'))
const DomainLibraryPage = lazy(() => import('./pages/DomainLibraryPage'))
const WorkStylePage = lazy(() => import('./pages/WorkStylePage'))
const SkillsPage = lazy(() => import('./pages/SkillsPage'))
const SDLCPage = lazy(() => import('./pages/SDLCPage'))
const PlaybooksPage = lazy(() => import('./pages/PlaybooksPage'))
const PromptPacksPage = lazy(() => import('./pages/PromptPacksPage'))
const AIRunsPage = lazy(() => import('./pages/AIRunsPage'))
const ProjectNotesPage = lazy(() => import('./pages/ProjectNotesPage'))
const DecisionsPage = lazy(() => import('./pages/DecisionsPage'))
const LessonsPage = lazy(() => import('./pages/LessonsPage'))
const ActivityPage = lazy(() => import('./pages/ActivityPage'))
const ImportExportPage = lazy(() => import('./pages/ImportExportPage'))
const ProviderSettingsPage = lazy(() => import('./pages/ProviderSettingsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const AdminHealthPage = lazy(() => import('./pages/AdminHealthPage'))

function PageLoader() {
  return (
    <div className="loading-overlay" style={{ minHeight: '60vh' }}>
      <div className="loading-spinner loading-spinner-lg" />
      <span className="text-muted text-sm">Loading…</span>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const event: ActivityEvent = {
      id: uuidv4(),
      eventType: 'app_opened',
      status: 'success',
      createdAt: new Date().toISOString(),
    }
    dbCreate('activityEvents', event).catch(() => {
      // Silently ignore if DB not ready yet
    })
  }, [])

  return (
    <div className="app-layout">
      <SidebarNav />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/domain-builder" element={<DomainBuilderPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/domain-library" element={<DomainLibraryPage />} />
            <Route path="/work-style" element={<WorkStylePage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/sdlc" element={<SDLCPage />} />
            <Route path="/playbooks" element={<PlaybooksPage />} />
            <Route path="/prompt-packs" element={<PromptPacksPage />} />
            <Route path="/ai-runs" element={<AIRunsPage />} />
            <Route path="/project-notes" element={<ProjectNotesPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/lessons" element={<LessonsPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/import-export" element={<ImportExportPage />} />
            <Route path="/provider-settings" element={<ProviderSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/admin-health" element={<AdminHealthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
