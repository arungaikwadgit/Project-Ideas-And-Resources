import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, CheckCircle, AlertTriangle, Shield, Cpu, Search } from 'lucide-react'
import { providerSettingsStore } from '../stores/providerSettingsStore'
import PageHeader from '../components/layout/PageHeader'

interface AIProviderConfig { id: string; name: string; description: string; requiresApiKey: boolean; supportedModels?: string[]; baseUrl?: string }
interface SearchProviderConfig { id: string; name: string; description: string; requiresApiKey: boolean; baseUrl?: string }

const ANTHROPIC_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']

function PersistentStorageBanner() {
  return (
    <div style={{ background: 'rgba(74,255,163,0.06)', border: '1px solid rgba(74,255,163,0.2)', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
      <Shield size={14} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <span>
        <strong>Keys are stored securely in your browser's local storage (IndexedDB + localStorage).</strong> They persist across sessions and page navigation — you only need to enter them once. Tick "Session-only" below to clear the key automatically when you close this tab.
      </span>
    </div>
  )
}

export default function ProviderSettingsPage() {
  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([])
  const [searchProviders, setSearchProviders] = useState<SearchProviderConfig[]>([])
  const [selectedAI, setSelectedAI] = useState('anthropic')
  const [selectedSearch, setSelectedSearch] = useState('tavily')
  const [aiKey, setAiKey] = useState('')
  const [searchKey, setSearchKey] = useState('')
  const [showAiKey, setShowAiKey] = useState(false)
  const [showSearchKey, setShowSearchKey] = useState(false)
  const [aiModel, setAiModel] = useState('')
  const [aiBaseUrl, setAiBaseUrl] = useState('')
  const [searchBaseUrl, setSearchBaseUrl] = useState('')
  const [maxTokens, setMaxTokens] = useState(4096)
  const [temperature, setTemperature] = useState(0.7)
  // false = persistent localStorage (default); true = session-only (opt-in)
  const [sessionOnlyAI, setSessionOnlyAI] = useState(false)
  const [sessionOnlySearch, setSessionOnlySearch] = useState(false)
  const [aiSaved, setAiSaved] = useState(false)
  const [searchSaved, setSearchSaved] = useState(false)

  useEffect(() => {
    fetch('/pm-knowledge-skill-studio/config/aiProviders.json').then(r => r.json()).then((data: AIProviderConfig[]) => setAiProviders(data)).catch(() => {})
    fetch('/pm-knowledge-skill-studio/config/searchProviders.json').then(r => r.json()).then((data: SearchProviderConfig[]) => setSearchProviders(data)).catch(() => {})
  }, [])

  useEffect(() => {
    providerSettingsStore.getAIProviderSettings(selectedAI).then(({ settings, apiKey }) => {
      setAiKey(apiKey ?? '')
      const s = settings as { model?: string; maxOutputTokens?: number; temperature?: number; baseUrl?: string } | null
      setAiModel(s?.model ?? (selectedAI === 'anthropic' ? ANTHROPIC_MODELS[1] : selectedAI === 'openai' ? OPENAI_MODELS[0] : ''))
      setMaxTokens(s?.maxOutputTokens ?? 4096)
      setTemperature(s?.temperature ?? 0.7)
      setAiBaseUrl(s?.baseUrl ?? '')
    })
  }, [selectedAI])

  useEffect(() => {
    providerSettingsStore.getSearchProviderSettings(selectedSearch).then(({ settings, apiKey }) => {
      setSearchKey(apiKey ?? '')
      const s = settings as { baseUrl?: string } | null
      setSearchBaseUrl(s?.baseUrl ?? '')
    })
  }, [selectedSearch])

  const handleSaveAI = async () => {
    // persistKey = !sessionOnlyAI: default (sessionOnlyAI=false) → persistKey=true → localStorage
    await providerSettingsStore.saveAIProviderSettings(
      selectedAI,
      { providerType: selectedAI as 'claude' | 'openai' | 'generic', model: aiModel, maxOutputTokens: maxTokens, temperature, timeoutMs: 30000, baseUrl: aiBaseUrl || undefined },
      aiKey || undefined,
      !sessionOnlyAI,
    )
    setAiSaved(true); setTimeout(() => setAiSaved(false), 2000)
  }

  const handleSaveSearch = async () => {
    await providerSettingsStore.saveSearchProviderSettings(
      selectedSearch,
      { providerType: selectedSearch as 'tavily' | 'brave' | 'generic', timeoutMs: 10000, baseUrl: searchBaseUrl || undefined },
      searchKey || undefined,
      !sessionOnlySearch,
    )
    setSearchSaved(true); setTimeout(() => setSearchSaved(false), 2000)
  }

  const handleClearKeys = async () => { await providerSettingsStore.clearAllKeys(); setAiKey(''); setSearchKey('') }

  const currentAIProvider = aiProviders.find(p => p.id === selectedAI)
  const models = selectedAI === 'anthropic' ? ANTHROPIC_MODELS : selectedAI === 'openai' ? OPENAI_MODELS : []

  return (
    <div className="page-container">
      <PageHeader title="Provider Settings" subtitle="Configure AI and search providers with your own API keys (BYOK)" />

      <div style={{ background: 'rgba(255,204,102,0.08)', border: '1px solid rgba(255,204,102,0.2)', borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangle size={14} />
        API keys are your own (BYOK model). They are stored locally in your browser and never exported or logged.
      </div>

      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Cpu size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>AI Provider</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(aiProviders.length > 0 ? aiProviders : [{ id: 'anthropic', name: 'Anthropic Claude' }, { id: 'openai', name: 'OpenAI' }, { id: 'generic', name: 'Generic HTTP' }]).map(p => (
            <button key={p.id} onClick={() => setSelectedAI(p.id)} className={selectedAI === p.id ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '0.85rem' }}>{p.name}</button>
          ))}
        </div>

        {currentAIProvider && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>{currentAIProvider.description}</p>}

        <PersistentStorageBanner />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>API Key</label>
            <div style={{ position: 'relative' }}>
              <input type={showAiKey ? 'text' : 'password'} value={aiKey} onChange={e => setAiKey(e.target.value)} className="input" placeholder="Paste your API key here..." style={{ width: '100%', paddingRight: '2.5rem' }} />
              <button onClick={() => setShowAiKey(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                {showAiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {models.length > 0 ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Model</label>
              <select className="input" value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ width: '100%' }}>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Model</label>
              <input className="input" value={aiModel} onChange={e => setAiModel(e.target.value)} placeholder="e.g., gpt-4o-mini" style={{ width: '100%' }} />
            </div>
          )}

          {selectedAI === 'generic' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Base URL</label>
              <input className="input" value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)} placeholder="https://api.example.com/v1/chat/completions" style={{ width: '100%' }} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Max Output Tokens</label>
            <input type="number" className="input" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} min={256} max={128000} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Temperature: {temperature.toFixed(1)}</label>
            <input type="range" min={0} max={1} step={0.1} value={temperature} onChange={e => setTemperature(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={sessionOnlyAI} onChange={e => setSessionOnlyAI(e.target.checked)} />
          <span>Session-only storage (clear key when this tab closes)</span>
        </label>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" onClick={handleSaveAI} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            {aiSaved ? <><CheckCircle size={14} /> Saved!</> : <><Key size={14} /> Save Settings</>}
          </button>
          <button className="btn btn-secondary" onClick={handleClearKeys} style={{ fontSize: '0.85rem' }}>Clear Keys</button>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Search size={18} className="text-accent" />
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Search Provider (for Domain Discovery)</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {(searchProviders.length > 0 ? searchProviders : [{ id: 'tavily', name: 'Tavily' }, { id: 'brave', name: 'Brave' }, { id: 'generic', name: 'Generic' }]).map(p => (
            <button key={p.id} onClick={() => setSelectedSearch(p.id)} className={selectedSearch === p.id ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '0.85rem' }}>{p.name}</button>
          ))}
        </div>

        <PersistentStorageBanner />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>API Key</label>
            <div style={{ position: 'relative' }}>
              <input type={showSearchKey ? 'text' : 'password'} value={searchKey} onChange={e => setSearchKey(e.target.value)} className="input" placeholder="Paste your search API key..." style={{ width: '100%', paddingRight: '2.5rem' }} />
              <button onClick={() => setShowSearchKey(v => !v)} style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                {showSearchKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {selectedSearch === 'generic' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Base URL</label>
              <input className="input" value={searchBaseUrl} onChange={e => setSearchBaseUrl(e.target.value)} placeholder="https://api.search.example.com/search" style={{ width: '100%' }} />
            </div>
          )}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.85rem' }}>
          <input type="checkbox" checked={sessionOnlySearch} onChange={e => setSessionOnlySearch(e.target.checked)} />
          <span>Session-only storage (clear key when this tab closes)</span>
        </label>

        <button className="btn btn-primary" onClick={handleSaveSearch} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          {searchSaved ? <><CheckCircle size={14} /> Saved!</> : <><Key size={14} /> Save Search Settings</>}
        </button>
      </div>
    </div>
  )
}
