# Combined Domain Context: {{DOMAIN_NAME}}

> **Created:** {{DATE}}
> **Last Updated:** {{DATE}}
> **Maintained By:** {{OWNER}}
> **Version:** {{VERSION}}
> **Coverage:** {{SCOPE}} *(e.g., B2B Payments — APAC region, Enterprise segment)*
> **Tags:** {{TAGS}}

---

> **About This Template**
> This combined domain context file is designed to be used as a single, comprehensive reference for AI prompting, onboarding new team members, and aligning stakeholders. It follows an 11-section structure that progressively builds context from strategic to operational. Copy the relevant sections into AI prompts as needed.

---

## Section 1: Domain Identity and Strategic Context

### What This Domain Is

Provide a concise definition of the domain in plain language. Avoid jargon. A new team member should be able to read this paragraph and understand the business problem this domain addresses.

**Domain Definition:**
{{DOMAIN_DEFINITION}}

**Business Importance:**
{{BUSINESS_IMPORTANCE}}

**Strategic Priority:**
- [ ] Core to company revenue model
- [ ] Enabling capability (internal platform)
- [ ] Regulatory/compliance mandate
- [ ] Competitive differentiator
- [ ] Innovation/emerging capability

### Domain Boundaries

**In Scope:**
- What this domain covers and owns

**Out of Scope:**
- What this domain does not cover (and who owns it instead)

**Adjacent Domains:**
| Adjacent Domain | Relationship | Interface/Handoff Point |
|-----------------|--------------|-------------------------|
| | | |
| | | |

---

## Section 2: Stakeholder and Organizational Context

### Business Ownership

| Role | Name | Responsibilities | Decision Authority |
|------|------|------------------|--------------------|
| Business Owner | | Accountable for domain outcomes | Final business decisions |
| Product Manager | | Defines roadmap and priorities | Product scope and prioritization |
| Delivery Lead | | Manages execution | Delivery planning and resourcing |
| Subject Matter Expert | | Domain expertise | Domain standards and definitions |
| Compliance Lead | | Regulatory adherence | Compliance interpretations |

### Organizational Dynamics

- **Key alliances:** Teams and stakeholders who are strong advocates for this domain
- **Known tensions:** Competing priorities or organizational friction points to be aware of
- **Decision-making style:** How decisions typically get made (consensus, hierarchy, data-driven)
- **Political sensitivities:** Topics or changes that require careful handling

### Key External Stakeholders

| Stakeholder Type | Examples | Their Primary Interest |
|------------------|----------|------------------------|
| Customers/Users | | |
| Regulators | | |
| Partners/Vendors | | |
| Industry Bodies | | |

---

## Section 3: User Landscape

### Primary User Segments

**Segment 1: {{USER_SEGMENT_NAME}}**
- Volume/scale: How many users in this segment?
- Primary tasks: What do they do most often?
- Success criteria: How do they define a good outcome?
- Pain points: What is frustrating or broken for them today?
- Tech sophistication: Low / Medium / High

**Segment 2: {{USER_SEGMENT_NAME}}**
- Volume/scale:
- Primary tasks:
- Success criteria:
- Pain points:
- Tech sophistication:

**Segment 3: {{USER_SEGMENT_NAME}}**
- Volume/scale:
- Primary tasks:
- Success criteria:
- Pain points:
- Tech sophistication:

### User Journey Overview

```
[Trigger Event] → [Discovery/Onboarding] → [Core Task] → [Completion/Outcome] → [Follow-up/Feedback]
```

Key moments of truth (where user experience is most critical):
1.
2.
3.

---

## Section 4: Business Processes and Workflows

### Process Landscape Map

List all significant business processes in this domain, categorized by frequency and criticality.

| Process Name | Frequency | Criticality | Owner | Current State | Target State |
|--------------|-----------|-------------|-------|---------------|--------------|
| | Daily | High | | Manual | Automated |
| | Weekly | Medium | | Semi-automated | Optimized |
| | Monthly | Low | | Automated | — |

### Core Process Detail: {{PROCESS_NAME}}

**Trigger:** What starts this process?
**Actors:** Who participates?
**Steps:**
1.
2.
3.
4.
5.

**Success Outcome:** What does a good completion look like?
**Failure Modes:** What can go wrong?
**Escalation Path:** What happens when the process fails?

### Process Interdependencies

- Which processes must complete before others can begin?
- Which processes run in parallel?
- What are the critical path bottlenecks?

---

## Section 5: Data and Information Architecture

### Core Data Entities

| Entity | Owner | Master Source | Volume/Scale | Sensitivity | Retention |
|--------|-------|---------------|--------------|-------------|-----------|
| | | | | PII/Confidential/Public | |
| | | | | | |
| | | | | | |

### Key Data Flows

**Inbound Data (consumed by this domain):**
| Source System | Data Type | Frequency | Format | Owner |
|---------------|-----------|-----------|--------|-------|
| | | | | |

**Outbound Data (produced by this domain):**
| Target System | Data Type | Frequency | Format | Consumer |
|---------------|-----------|-----------|--------|----------|
| | | | | |

### Data Quality Standards

- Completeness requirements:
- Accuracy requirements:
- Timeliness requirements:
- Consistency requirements:

### Known Data Issues

- Existing data quality problems and their business impact
- Technical debt in data architecture
- Data gaps that affect decision-making

---

## Section 6: Technology and Systems Landscape

### Systems Inventory

| System | Type | Role in Domain | Owner | Criticality | Integration Pattern |
|--------|------|----------------|-------|-------------|---------------------|
| | Core | | | High | API |
| | Supporting | | | Medium | Batch |
| | External/3rd party | | | Low | Event |

### Architecture Patterns

- **Integration style:** REST API / Event-driven / Batch / Hybrid
- **Deployment model:** Cloud / On-premise / Hybrid
- **Key architectural constraints:** Latency, throughput, availability requirements

### Technical Debt and Known Issues

- Technical debt items that affect delivery velocity
- Known system limitations that constrain product decisions
- Planned infrastructure changes that may affect domain work

---

## Section 7: Metrics, KPIs, and Performance Standards

### Measurement Framework

| Metric | Type | Definition | Target | Owner | Reporting Frequency |
|--------|------|------------|--------|-------|---------------------|
| | North Star | | | | Monthly |
| | Operational | | | | Weekly |
| | Quality | | | | Daily |
| | Customer | | | | Monthly |

### Current Performance Baseline

- **Current state vs. target:** Where does the domain stand against its KPIs?
- **Trend:** Improving / Stable / Declining
- **Key gaps:** What is furthest from target?

### Measurement Challenges

- What is difficult to measure accurately and why?
- What proxy metrics are used when direct measurement is not possible?

---

## Section 8: Risk and Compliance Context

### Risk Taxonomy

| Risk Category | Risk Description | Likelihood | Impact | Owner | Current Control | Residual Risk |
|---------------|-----------------|------------|--------|-------|-----------------|---------------|
| Technical | | High/Med/Low | High/Med/Low | | | |
| Operational | | | | | | |
| Business | | | | | | |
| Regulatory | | | | | | |
| Reputational | | | | | | |

### Regulatory and Compliance Landscape

| Regulation/Standard | Jurisdiction | Key Obligations | Internal Owner | Audit Frequency |
|--------------------|--------------|-----------------|----------------|-----------------|
| | | | | |
| | | | | |

### Compliance Controls in Place

- Preventive controls:
- Detective controls:
- Corrective controls:

### Compliance Gaps or Watch Items

- Known compliance gaps or areas under remediation
- Upcoming regulatory changes and their potential impact

---

## Section 9: Vocabulary and Taxonomy

### Canonical Terms

These are the agreed definitions used within this domain. When in doubt, defer to these.

| Term | Canonical Definition | Common Aliases | Do Not Confuse With |
|------|---------------------|----------------|---------------------|
| | | | |
| | | | |
| | | | |

### Acronyms and Abbreviations

| Acronym | Stands For | Meaning in Context |
|---------|------------|--------------------|
| | | |
| | | |

### Naming Conventions

- How are entities, events, and processes named in this domain?
- What naming conflicts exist with adjacent domains?

---

## Section 10: Typical Project Patterns

### Common Project Types in This Domain

| Project Type | Typical Duration | Typical Team | Key Risks | Success Criteria |
|--------------|-----------------|--------------|-----------|------------------|
| New capability build | | | | |
| Integration/migration | | | | |
| Compliance remediation | | | | |
| Performance optimization | | | | |
| Process automation | | | | |

### Delivery Patterns That Work Well

- Discovery → Design → Build → Test → Rollout approach
- Typical sprint cadence and ceremonies
- Stakeholder review and sign-off checkpoints
- Change management considerations

### Anti-Patterns (What Not to Do)

- Common project pitfalls in this domain
- Past project failures and what caused them
- Shortcuts that create downstream problems

### Typical Project Artifacts

| Artifact | Phase | Owner | Approver |
|----------|-------|-------|----------|
| Domain discovery summary | Discovery | PM/BA | Business owner |
| Process maps | Discovery | BA | SME |
| Requirements (BRD/PRD) | Define | PM/BA | Sponsor |
| Solution design | Design | Architect | Tech lead |
| Test plan | Build | QA | Delivery lead |
| Go-live runbook | Deploy | Delivery lead | Ops |

---

## Section 11: AI Usage Context

### When to Use AI in This Domain

- **High value AI use cases:** Requirements drafting, status summarization, risk brainstorming, stakeholder communication drafts, retrospective facilitation
- **Medium value AI use cases:** Template completion, meeting agenda creation, process documentation, training material drafts
- **Low value / avoid AI for:** Compliance determinations, regulatory interpretations, final financial calculations, security architecture decisions

### Standard Prompt Context Block

Copy and paste this block at the start of AI prompts for this domain:

```
DOMAIN CONTEXT:
- Domain: {{DOMAIN_NAME}}
- Industry: {{INDUSTRY}}
- Company type: {{COMPANY_TYPE}} (e.g., enterprise SaaS, fintech startup, retail bank)
- My role: {{ROLE}}
- Target audience for output: {{AUDIENCE}}
- Regulatory context: {{REGULATIONS}}
- Key constraints: {{CONSTRAINTS}}
```

### Data Safety Rules for AI Use

- **NEVER include in AI prompts:** Customer PII, internal financials, unreleased product plans, confidential vendor terms, employee personal data
- **ALWAYS anonymize:** Any real customer names, account numbers, transaction data, or personally identifiable information before using as examples
- **ALWAYS verify:** Any regulatory statements, compliance requirements, or legal interpretations from AI outputs with the appropriate internal expert

### Quality Checks for AI Outputs in This Domain

Before using AI-generated content in this domain:
- [ ] Factual claims are verified against authoritative sources
- [ ] No hallucinated metrics, statistics, or regulatory citations
- [ ] No confidential or proprietary information inadvertently included
- [ ] Domain-specific terminology is used correctly
- [ ] Output is appropriate for the intended audience
- [ ] Compliance and risk language has been reviewed by appropriate stakeholders

### Prompt Patterns That Work Well Here

**For requirements:**
> "Write acceptance criteria for [FEATURE] in the context of [DOMAIN]. Consider [REGULATORY/BUSINESS CONSTRAINTS]. Format as Given-When-Then."

**For risk identification:**
> "Identify the top 10 risks for a project delivering [CAPABILITY] in the [DOMAIN] domain within a [COMPANY TYPE] organization. Categorize by type and suggest mitigation approaches."

**For stakeholder communication:**
> "Draft a status update for [STAKEHOLDER AUDIENCE] covering [KEY POINTS]. Tone should be [TONE]. Keep it under [WORD COUNT] words."

---

*Document Owner: {{OWNER}}*
*Review Cycle: {{REVIEW_FREQUENCY}}*
*Next Review Date: {{NEXT_REVIEW}}*
*Approved By: {{APPROVER}}*
