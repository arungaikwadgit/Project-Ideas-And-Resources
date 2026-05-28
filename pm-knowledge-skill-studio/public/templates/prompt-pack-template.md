# Prompt Pack: [Prompt Pack Name]

> **Purpose:** A prompt pack is a curated, governed collection of AI prompts designed for a specific role, domain, or use case. Each prompt is structured for consistent, safe, and high-quality use with AI tools such as Claude or ChatGPT.

---

## Prompt Pack Overview

| Field | Value |
|-------|-------|
| **Pack Name** | [e.g., E-commerce PM Prompt Pack] |
| **Pack ID** | [e.g., pp-ecommerce-pm-001] |
| **Target Role(s)** | [e.g., Product Manager, Business Analyst, PO] |
| **Domain** | [e.g., E-commerce / Marketplace] |
| **Category** | [e.g., Discovery / Delivery / Stakeholder / Reporting / Analysis] |
| **AI Provider Compatibility** | [e.g., Claude, ChatGPT, Gemini — or All] |
| **Governance Level** | [Standard / Elevated — see Section 7] |
| **Owner** | [Name or role] |
| **Last Updated** | [Date] |
| **Version** | [e.g., 1.0] |

---

## 1. Pack Description

**What this prompt pack is for:**
[2–4 sentences describing the purpose of this pack, the types of tasks it supports, and who should use it. Include any important context about the domain or workflow this pack addresses.]

**When to use this pack:**
- [Situation 1 — e.g., When starting a new e-commerce product discovery cycle]
- [Situation 2 — e.g., When preparing stakeholder update materials]
- [Situation 3 — e.g., When reviewing sprint outputs for release readiness]

**Outcomes this pack supports:**
- [Outcome 1 — e.g., Faster first drafts of PRDs and user stories]
- [Outcome 2 — e.g., Consistent stakeholder communication across projects]
- [Outcome 3 — e.g., Structured risk identification and mitigation planning]

---

## 2. How to Use This Pack

1. **Select a prompt** relevant to your current task from the sections below.
2. **Review the governance checklist** (Section 7) before using any prompt.
3. **Customise the prompt** — replace all `[PLACEHOLDERS]` with your specific context.
4. **Run the prompt** in your chosen AI tool.
5. **Review the output** — AI outputs are first drafts. Always review, edit, and validate before using.
6. **Log the run** — record the prompt used, output received, and any edits made in your AI run log.

**Prompt customisation tips:**
- Be specific: the more context you provide, the better the output.
- Include constraints: tell the AI what NOT to include or do.
- Specify the audience: e.g., "Write for a non-technical executive audience."
- Specify the format: e.g., "Format as a bulleted list with no more than 5 items."

---

## 3. Discovery & Research Prompts

### Prompt D-01: Domain Overview Brief

**Use case:** Generate a foundational overview of a domain to onboard a new team member or build shared context.

**Prompt:**
```
You are a business analyst specialising in [DOMAIN]. 
Create a structured domain overview brief for a Product Manager joining a [DOMAIN] project.

Include:
- A 2-paragraph domain description
- 5–7 key business workflows
- 5 primary user personas with their core goals
- 3–5 key success metrics used in this domain
- Top 3 risks or challenges typical in this domain
- 3–5 industry-standard tools or integrations

Context: [ADD ANY SPECIFIC CONTEXT ABOUT YOUR PRODUCT OR PROJECT]

Format: Use clear headings and bullet points. Keep each section concise.
```

**Expected output:** A 400–600 word structured brief.
**Governance notes:** Do not include proprietary product plans or confidential customer data.

---

### Prompt D-02: User Persona Development

**Use case:** Generate detailed user personas for a product or feature.

**Prompt:**
```
You are a UX researcher and product strategist.
Create [NUMBER] detailed user personas for a [PRODUCT TYPE] in the [DOMAIN] space.

For each persona include:
- Name and role/title
- Primary goals and motivations
- Key pain points and frustrations
- How they currently solve the problem (workarounds)
- What success looks like for them
- Preferred communication channels and tools

Additional context: [ADD SPECIFIC CONTEXT — target market, geography, company size, etc.]

Format: Present each persona as a named card with clear sub-sections.
```

**Expected output:** Structured persona cards, one per persona.
**Governance notes:** Base personas on general research patterns, not on real named individuals.

---

### Prompt D-03: Problem Statement Framing

**Use case:** Structure and sharpen a problem statement before moving into solution design.

**Prompt:**
```
Help me write a clear, well-structured problem statement for the following product challenge.

Raw problem description: [DESCRIBE THE PROBLEM IN YOUR OWN WORDS]

Context:
- Domain: [DOMAIN]
- Target users: [WHO IS AFFECTED]
- Current state: [WHAT HAPPENS TODAY]
- Business impact: [WHY THIS MATTERS TO THE BUSINESS]

Output a problem statement in the following format:
- One-sentence executive summary
- Problem context (2–3 sentences)
- Who is affected and how
- Business impact if the problem is not solved
- What success looks like when the problem is resolved
```

**Expected output:** A structured, 250–400 word problem statement.
**Governance notes:** Standard — no elevated risk.

---

## 4. Requirements & Design Prompts

### Prompt R-01: User Story Generation

**Use case:** Generate a set of user stories from a feature brief or epic description.

**Prompt:**
```
You are a senior Product Manager writing user stories for a [DOMAIN] product.

Feature / Epic description: [DESCRIBE THE FEATURE OR EPIC]

Target persona: [PERSONA NAME AND ROLE]

Generate [NUMBER] user stories in the format:
"As a [persona], I want to [action], so that [benefit]."

For each user story, also provide:
- 3–5 acceptance criteria (Given/When/Then or bullet format)
- A complexity estimate (S/M/L/XL)
- Any dependencies or assumptions

Constraints:
- Each story should be independently deliverable
- Stories should follow the INVEST criteria
- Avoid technical implementation details in the story description
```

**Expected output:** Structured user stories with acceptance criteria.
**Governance notes:** Standard — no elevated risk.

---

### Prompt R-02: PRD Section Draft

**Use case:** Draft a specific section of a Product Requirements Document.

**Prompt:**
```
You are a Product Manager drafting a PRD for [PRODUCT / FEATURE NAME] in the [DOMAIN] space.

Write the following PRD section: [SECTION NAME — e.g., Goals & Success Metrics / Functional Requirements / Out of Scope]

Context:
- Product summary: [BRIEF DESCRIPTION]
- Target users: [USER TYPES]
- Key constraints: [TIME, BUDGET, TECHNICAL CONSTRAINTS]
- Business objectives: [WHAT THIS FEATURE MUST ACHIEVE]

Format the output with clear headings, numbered requirements where appropriate, and a summary sentence at the start of the section.
```

**Expected output:** A complete PRD section, ready for review and editing.
**Governance notes:** Do not include unreleased competitive intelligence or NDA-covered information.

---

## 5. Stakeholder & Communication Prompts

### Prompt S-01: Stakeholder Update Email

**Use case:** Draft a concise, professional stakeholder update email.

**Prompt:**
```
Write a professional stakeholder update email for the following project.

Project name: [PROJECT NAME]
Reporting period: [DATE RANGE]
Audience: [e.g., Senior Leadership / Project Sponsor / External Client]

Current status: [RED / AMBER / GREEN] — [One sentence explanation]

Include:
- 3–4 key accomplishments this period
- 2–3 planned activities for next period
- Any risks or issues requiring attention (with status and owner)
- Any decisions or approvals needed from the reader

Tone: [Professional and concise / Warm and reassuring / Direct and action-oriented]
Maximum length: [e.g., 250 words / 1 page]
```

**Expected output:** A ready-to-review email draft.
**Governance notes:** Remove any specific financial figures, customer names, or confidential details before using the prompt.

---

### Prompt S-02: Executive Presentation Outline

**Use case:** Structure a presentation for senior leadership.

**Prompt:**
```
Create a structured outline for a [NUMBER]-slide executive presentation on the following topic.

Topic: [PRESENTATION TOPIC]
Audience: [AUDIENCE ROLE AND LEVEL — e.g., C-suite, Board, VP-level]
Objective: [What should the audience know, feel, or decide after this presentation?]
Time available: [e.g., 15 minutes including Q&A]

For each slide, provide:
- Slide title
- 3–4 bullet points of key content
- One recommended visual or data point to include
- Any speaker notes or talking points

Structure: Start with the so-what, support with data, close with a clear ask.
```

**Expected output:** A full slide-by-slide outline.
**Governance notes:** Elevated — review all financial or forecast data before including in the prompt.

---

## 6. Delivery & Retrospective Prompts

### Prompt L-01: Sprint Retrospective Facilitation Guide

**Use case:** Generate a facilitation guide for a team retrospective.

**Prompt:**
```
Create a facilitation guide for a [DURATION] sprint retrospective for a team of [TEAM SIZE] working on [PRODUCT / PROJECT].

Context:
- Sprint theme / focus: [WHAT WAS THE SPRINT ABOUT]
- Key challenges this sprint: [BRIEFLY DESCRIBE 1–2 CHALLENGES]
- Team dynamics note: [e.g., High-performing team / Team under stress / New team members recently joined]

Include:
- Opening warm-up activity (5 minutes)
- 3 structured retrospective activities with time allocations
- Facilitation tips for drawing out quieter voices
- A structured method for capturing and prioritising action items
- A closing check-out activity

Format: Use a timed agenda format with clear facilitator instructions.
```

**Expected output:** A complete, ready-to-use facilitation guide.
**Governance notes:** Standard — no elevated risk.

---

### Prompt L-02: Lessons Learned Summary

**Use case:** Synthesise lessons learned from a completed project or phase.

**Prompt:**
```
Summarise the following lessons learned inputs into a structured, actionable lessons learned document.

Project / Phase: [NAME]
Duration: [START DATE TO END DATE]
Raw inputs: [PASTE OR DESCRIBE YOUR LESSONS LEARNED NOTES, RETRO OUTPUTS, OR FEEDBACK]

Organise the output into:
1. What went well (Top 3–5 with explanation)
2. What could be improved (Top 3–5 with root cause and recommendation)
3. Surprises or unexpected outcomes
4. Recommendations for future projects (actionable, specific)
5. One key insight the organisation should not forget

Tone: Constructive and forward-looking. Avoid blame or naming individuals.
```

**Expected output:** A structured 400–600 word lessons learned summary.
**Governance notes:** Standard — remove any personal performance references or HR-sensitive content.

---

## 7. Governance Checklist

> **IMPORTANT: Complete this checklist before running any prompt from this pack.**

### Pre-Prompt Checklist

- [ ] **No PII included:** The prompt does not contain names, email addresses, phone numbers, national ID numbers, or other personally identifiable information.
- [ ] **No payment or financial card data:** The prompt does not contain credit card numbers, bank account details, or payment credentials.
- [ ] **No confidential IP:** The prompt does not contain unreleased product designs, proprietary algorithms, or trade secrets covered by NDA.
- [ ] **No customer data:** The prompt does not reference real customer records, transactions, or account details.
- [ ] **No system credentials:** The prompt does not contain API keys, passwords, or access tokens.
- [ ] **No prompt injection risk:** The prompt does not include content from untrusted sources that could manipulate the AI's behaviour.
- [ ] **Audience appropriate:** I understand that this prompt will be sent to an external AI provider and I am comfortable with the content being processed externally.

### Post-Output Checklist

- [ ] **Output reviewed:** I have read the AI output and it is factually reasonable.
- [ ] **Output edited:** I have edited the output and it now reflects my own professional judgment.
- [ ] **Claims verified:** Any factual claims, metrics, or statistics in the output have been verified.
- [ ] **Sensitive content removed:** Any sensitive details that appear in the output (even if not in the prompt) have been removed or anonymised.
- [ ] **Not shared verbatim:** I have not forwarded, published, or submitted the raw AI output without review and editing.

**Governance Level: Standard**
Standard prompts contain no personal data, no confidential financial information, and no proprietary product details. They can be run with normal care.

**Governance Level: Elevated**
Elevated prompts involve topics adjacent to sensitive areas (financial forecasts, competitive analysis, regulated domains). Additional review by a second person is recommended before acting on the output.

---

## 8. Revision History

| Version | Date | Author | Change Summary |
|---------|------|--------|---------------|
| 1.0 | [Date] | [Name] | Initial version |
| [x.x] | [Date] | [Name] | [What changed and why] |

---

*Pack ID: [ID] | Owner: [Name/Role] | Governance Level: [Standard/Elevated] | Last reviewed: [Date]*
