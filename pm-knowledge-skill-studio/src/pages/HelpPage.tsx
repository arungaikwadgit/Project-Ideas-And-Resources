import { useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, Zap, Database, Shield, BookOpen, Search, type LucideIcon } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'

interface AccordionItem { q: string; a: string }

function Accordion({ items }: { items: AccordionItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '0.875rem 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 500 }}>
            {item.q}
            {open === i ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {open === i && <div style={{ paddingBottom: '1rem', color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{item.a}</div>}
        </div>
      ))}
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Icon size={18} className="text-accent" />
        <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function HelpPage() {
  const faqs: AccordionItem[] = [
    { q: 'Is my data stored in the cloud?', a: 'No. All data is stored locally in your browser\'s IndexedDB. Nothing is sent to any server except when you explicitly run a prompt with an AI provider.' },
    { q: 'Are my API keys secure?', a: 'API keys are stored in sessionStorage by default (cleared when you close the tab). You can optionally enable localStorage persistence but this is not recommended. Keys are never exported, logged, or sent anywhere except to the configured AI/search provider.' },
    { q: 'What happens if I clear my browser data?', a: 'Your knowledge, skills, playbooks, and other data will be deleted along with the browser storage. Use the Export feature regularly to back up your data.' },
    { q: 'Can I use this app without AI providers?', a: 'Yes! The app is fully functional without any AI provider configured. You can build domain knowledge, document skills, create playbooks, and write prompt packs. AI providers enhance the experience but are not required.' },
    { q: 'What AI providers are supported?', a: 'Anthropic Claude, OpenAI (ChatGPT/GPT-4), and any OpenAI-compatible generic HTTP endpoint. You bring your own API key (BYOK model).' },
    { q: 'What search providers are supported?', a: 'Tavily Search API, Brave Search API, and any custom HTTP search endpoint.' },
    { q: 'What is the admin password?', a: 'The admin password is "admin123". This is a lightweight client-side demo gate only and is NOT production-grade authentication. The admin page is for system health checks and diagnostics.' },
    { q: 'How do I back up my data?', a: 'Go to Import / Export and click "Export All Data". This creates a JSON bundle you can save locally. API keys are never included in exports.' },
    { q: 'Can I use this on mobile?', a: 'The app is responsive and works on tablets and phones, though the full experience is optimized for desktop.' },
  ]

  return (
    <div className="page-container">
      <PageHeader title="Help & Documentation" subtitle="Everything you need to get the most from PM Knowledge & Skill Studio" />

      <Section icon={BookOpen} title="Getting Started">
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 2 }}>
          <li><strong style={{ color: 'var(--text)' }}>Step 1 — Build Domain Knowledge:</strong> Go to <em>Domain Builder</em> and search for your business domain. Select one or more domains and generate markdown knowledge files.</li>
          <li><strong style={{ color: 'var(--text)' }}>Step 2 — Accept Skills:</strong> After selecting domains, accept the suggested skills for your role. These populate your Skills Studio.</li>
          <li><strong style={{ color: 'var(--text)' }}>Step 3 — Document Work Style:</strong> Fill in your personal work style sections to give AI context about how you work.</li>
          <li><strong style={{ color: 'var(--text)' }}>Step 4 — Configure Provider:</strong> Go to <em>Provider Settings</em> to add your AI API key (optional but unlocks prompt execution).</li>
          <li><strong style={{ color: 'var(--text)' }}>Step 5 — Use SDLC Workspace:</strong> Select your role, phase, and task to load preloaded prompts. Edit and run them against your AI provider.</li>
        </ol>
      </Section>

      <Section icon={Search} title="Domain Discovery">
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          The Domain Builder includes a catalog of 30+ pre-curated business domains. Search by keyword to find relevant domains, then select one or more to generate domain-specific knowledge markdown.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          If you configure a <strong style={{ color: 'var(--text)' }}>Tavily</strong> or <strong style={{ color: 'var(--text)' }}>Brave Search</strong> API key in Provider Settings, the Domain Builder can also discover additional domains from live web search. All queries are scanned for sensitive data before being sent.
        </p>
      </Section>

      <Section icon={Zap} title="Prompt Packs & AI Execution">
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Prompt packs are structured AI instructions that combine your domain context, work style, skills, and SDLC task details into a single formatted prompt.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Every SDLC task in the workspace has a preloaded prompt. You can edit the prompt before running it, save custom versions, and track all execution history in <em>AI Runs</em>.
        </p>
        <div style={{ marginTop: '1rem', background: 'rgba(74,163,255,0.08)', borderRadius: 6, padding: '0.75rem', fontSize: '0.8rem', color: 'var(--accent)' }}>
          💡 All prompts are scanned for sensitive data before execution. If PII, payment card numbers, API keys, or injection attempts are detected, execution is blocked.
        </div>
      </Section>

      <Section icon={Shield} title="Privacy & Security">
        <ul style={{ paddingLeft: '1.25rem', color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.8 }}>
          <li>All data stored locally in your browser (IndexedDB)</li>
          <li>API keys stored in sessionStorage only by default (cleared on tab close)</li>
          <li>API keys are never included in exports, logs, or diagnostics</li>
          <li>Sensitive data scanning blocks SSN, credit cards, private keys, and API tokens</li>
          <li>Prompt injection detection prevents override attempts</li>
          <li>No telemetry, no analytics, no third-party tracking</li>
        </ul>
        <div style={{ marginTop: '1rem', background: 'rgba(255,204,102,0.08)', borderRadius: 6, padding: '0.75rem', fontSize: '0.8rem', color: 'var(--warning)' }}>
          ⚠️ The admin password at <code>/admin-health</code> is a client-side demo gate only. It is NOT secure authentication. Do not use for production environments.
        </div>
      </Section>

      <Section icon={Database} title="Import & Export">
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
          Use <em>Import / Export</em> to back up all your data as a JSON bundle. You can import the bundle on another browser or device to restore your knowledge workspace.
        </p>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--error)' }}>API keys are never exported.</strong> You will need to re-enter provider keys after importing on a new device.
        </p>
      </Section>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Frequently Asked Questions</h2>
        </div>
        <Accordion items={faqs} />
      </div>

      <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
          Found a bug or have a feature request?{' '}
          <a href="https://github.com/arungaikwadgit/project-ideas-and-resources/issues" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            Open an issue on GitHub <ExternalLink size={12} />
          </a>
        </p>
      </div>
    </div>
  )
}
