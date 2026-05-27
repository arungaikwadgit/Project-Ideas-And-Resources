# PM Knowledge & Skill Studio

A browser-based knowledge, skill, playbook, prompt-pack, and AI execution workspace for Product Managers, Project Managers, Delivery Managers, Scrum Masters, Engineering Managers, and similar project leaders.

**100% static. No backend. No data leaves your browser except AI/search API calls you explicitly initiate with your own API keys.**

---

## Features

- **SDLC Workspace** — navigate 10 SDLC phases, 100+ tasks, and preloaded AI prompts per role
- **Domain Builder** — AI-powered domain knowledge discovery and synthesis
- **Knowledge Base** — store and search domain knowledge, skills, playbooks, and prompt packs
- **AI Runs** — execute prompts with full governance, sensitive data scanning, and audit history
- **Project Notes** — markdown notes organized by project
- **Decisions** — decision log with status tracking and rationale
- **Lessons Learned** — structured lessons with category filtering
- **Activity Monitoring** — track all workspace activity
- **Import / Export** — full data backup and restore as JSON
- **BYOK** — bring your own Anthropic, OpenAI, or custom HTTP API keys
- **Search** — BYOK web search via Tavily, Brave, or custom provider

---

## Tech Stack

- **React 18** + TypeScript + Vite 5
- **IndexedDB** via `idb` for all local storage
- **marked** + **DOMPurify** for safe markdown rendering
- **lucide-react** for icons
- **Vitest** for unit/integration tests
- **Playwright** for end-to-end tests

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Run

```bash
cd pm-knowledge-skill-studio
npm install
npm run dev
```

Open [http://localhost:5173/pm-knowledge-skill-studio/](http://localhost:5173/pm-knowledge-skill-studio/)

### Build for Production

```bash
npm run build
```

The `dist/` folder is a fully static site suitable for GitHub Pages or any static host.

### Run Tests

```bash
# Unit and integration tests
npm test

# Test with coverage
npm run test:coverage

# End-to-end tests (requires dev server running)
npm run test:e2e
```

### Type Check

```bash
npm run type-check
```

---

## Deployment (GitHub Pages)

The app is configured with `base: '/pm-knowledge-skill-studio/'` in `vite.config.ts`.

Deploy to GitHub Pages by pushing to `main` — the GitHub Actions workflow in `.github/workflows/ci.yml` builds and deploys automatically.

---

## API Keys (BYOK)

Go to **Provider Settings** to configure your AI and search provider keys.

**Security model:**
- API keys are stored in `sessionStorage` by default — they are cleared when you close the browser tab
- You can optionally enable `localStorage` persistence with an explicit warning shown in the UI
- API keys are **never** exported (the export bundle redacts them)
- API keys are **never** logged or included in diagnostic outputs
- All AI executions pass through a governance engine that scans for sensitive data and prompt injection before sending to any provider

---

## Admin Health Page

The app includes an admin health dashboard at `/pm-knowledge-skill-studio/admin-health`.

> **IMPORTANT SECURITY NOTICE:**
> The admin password (`admin123`) is a **lightweight client-side demo gate only**. It is stored in `sessionStorage` and provides no real security. It is not suitable for production environments. Anyone with access to the browser's developer tools can bypass it trivially.
>
> This feature exists solely for local/demo use to provide a UX separation between regular users and a diagnostic view. **Do not rely on this for any security purpose.**

---

## Data & Privacy

- All workspace data is stored in your browser's IndexedDB
- No data is sent to any server except when you explicitly run a prompt or search with a configured provider
- Export your data regularly using **Import / Export** as a backup
- Use **Settings → Privacy Mode** to mask sensitive text in previews

---

## Project Structure

```
pm-knowledge-skill-studio/
├── public/
│   └── config/          # JSON configuration files (roles, phases, tasks, prompts, etc.)
├── src/
│   ├── components/      # Shared UI components
│   ├── lib/             # AI providers, search providers, governance engine
│   ├── pages/           # Route-level page components
│   ├── stores/          # IndexedDB store helpers
│   ├── tests/           # Unit and integration tests
│   └── types/           # TypeScript type definitions
├── e2e/                 # Playwright end-to-end tests
└── dist/                # Production build output
```

---

## License

MIT
