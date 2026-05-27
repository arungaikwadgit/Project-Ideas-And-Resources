# Domain Knowledge: {{DOMAIN_NAME}}

> **Created:** {{DATE}}
> **Last Updated:** {{DATE}}
> **Role Perspective:** {{ROLES}} *(e.g., Product Manager, Business Analyst, Delivery Lead)*
> **Source:** {{SOURCE}} *(e.g., stakeholder interviews, existing documentation, SME workshops)*
> **Tags:** {{TAGS}} *(e.g., #fintech #payments #compliance #B2B)*

---

## 1. Domain Overview

<!-- Provide a 3-5 sentence overview of this business domain. What is it? Who uses it? Why does it matter to the business? What is the scale and scope? -->

{{OVERVIEW}}

**Example (Payments Domain):**
> The payments domain covers the end-to-end processing of financial transactions between buyers and sellers, including authorization, clearing, and settlement. It is used by merchants, consumers, financial institutions, and payment processors. The domain underpins virtually all commerce and is subject to heavy regulatory scrutiny. Reliability, security, and speed are non-negotiable characteristics of any payments system.

---

## 2. Target Users

<!-- Who are the primary users in this domain? Include roles, personas, and their goals. Be specific about what problems they are trying to solve. -->

### Primary Users

| Persona | Role / Title | Primary Goal | Pain Points | Definition of Success |
|---------|-------------|--------------|-------------|----------------------|
| | | | | |
| | | | | |
| | | | | |

### Secondary Users

| Persona | Role / Title | Relationship to Domain | Frequency of Interaction |
|---------|-------------|------------------------|--------------------------|
| | | | |
| | | | |

### Key User Goals

- **Job to be done:** — What are users ultimately trying to accomplish?
- **Job to be done:** —
- **Job to be done:** —

### User Pain Points

- What frustrates users most in the current state?
- What workarounds do users rely on that indicate unmet needs?
- What does "a bad day" look like for a primary user in this domain?

---

## 3. Key Business Workflows

<!-- List the most important business processes and workflows in this domain. Include trigger events, actors, and outcomes. -->

### Core Workflows

1. **{{WORKFLOW_1}}**
   - Trigger: What event or condition initiates this workflow?
   - Actors: Who is involved (people, systems)?
   - Key Steps: High-level steps in the process
   - Outcome: What is the expected end state?
   - SLA/Timing: How quickly must this complete?

2. **{{WORKFLOW_2}}**
   - Trigger:
   - Actors:
   - Key Steps:
   - Outcome:
   - SLA/Timing:

3. **{{WORKFLOW_3}}**
   - Trigger:
   - Actors:
   - Key Steps:
   - Outcome:
   - SLA/Timing:

### Supporting Workflows

1. **{{SUPPORTING_WORKFLOW_1}}** — How this workflow supports the core process
2. **{{SUPPORTING_WORKFLOW_2}}** —

### Process Exceptions and Edge Cases

- What are the most common failure paths or exceptions?
- What manual overrides or escalation paths exist?
- What regulatory or business-rule exceptions apply?
- What happens when SLAs are breached?

---

## 4. Core Data Entities

<!-- What are the main data objects/entities in this domain? Include key attributes and relationships. -->

| Entity | Description | Key Attributes | Relationships | Master Source |
|--------|-------------|----------------|---------------|---------------|
| | | | | |
| | | | | |
| | | | | |

### Data Ownership and Stewardship

| Entity | Business Owner | Technical Owner | Data Steward | Quality Standard |
|--------|---------------|-----------------|--------------|-----------------|
| | | | | |
| | | | | |

### Data Lifecycle

- How is data created, updated, archived, and deleted in this domain?
- What are the data retention requirements?
- What are the archival and purge policies?

### Known Data Quality Issues

- Existing data quality problems and their business impact:
- Technical debt in data architecture:
- Data gaps that affect operational or analytical decisions:

---

## 5. Business Metrics

<!-- What metrics matter most in this domain? Include KPIs, operational metrics, and quality metrics with typical target ranges where known. -->

### North Star Metrics

| Metric | Definition | Current Baseline | Target | Owner | Why It Matters |
|--------|-----------|-----------------|--------|-------|----------------|
| | | | | | |
| | | | | | |

### Operational Metrics

| Metric | Definition | Measurement Frequency | Threshold (Warning) | Threshold (Critical) | Owner |
|--------|-----------|----------------------|---------------------|---------------------|-------|
| | | | | | |
| | | | | | |

### Quality Metrics

| Metric | Definition | Acceptable Range | Escalation Threshold |
|--------|-----------|-----------------|---------------------|
| | | | |
| | | | |

### Leading vs. Lagging Indicators

- **Leading indicators** (predict future performance):
- **Lagging indicators** (confirm past performance):

### Anti-Metrics (What Not to Optimize)

- Metrics that can be gamed without delivering real value:
- Metrics that optimize locally but hurt globally:

---

## 6. Common Risks

<!-- What are the most common risks and challenges in this domain? Include likelihood and potential impact guidance. -->

### Technical Risks

| Risk | Likelihood | Impact | Mitigation Strategy | Owner |
|------|-----------|--------|--------------------|----|
| | H/M/L | H/M/L | | |
| | H/M/L | H/M/L | | |

### Business Risks

| Risk | Likelihood | Impact | Mitigation Strategy | Owner |
|------|-----------|--------|--------------------|----|
| | H/M/L | H/M/L | | |
| | H/M/L | H/M/L | | |

### Regulatory and Compliance Risks

| Risk | Relevant Regulation | Jurisdiction | Mitigation | Compliance Owner |
|------|--------------------|-----------|----|-------|
| | | | | |
| | | | | |

### Operational Risks

- Day-to-day execution risks and dependencies:
- Third-party or vendor dependency risks:
- Key person dependency risks:

---

## 7. Common Integrations

<!-- What systems and platforms does this domain commonly integrate with? Include integration patterns and data flows. -->

### Core Internal Systems

| System | Role in Domain | Integration Type | Direction | Criticality | Owner |
|--------|---------------|-----------------|-----------|------------|-------|
| | | API / Batch / Event / Manual | Inbound / Outbound / Bidirectional | H/M/L | |
| | | | | | |

### Third-Party Integrations

| Vendor / Platform | Capability Provided | Integration Type | Criticality | Contract Owner |
|------------------|---------------------|-----------------|------------|---------------|
| | | | H/M/L | |
| | | | H/M/L | |

### Data Flows

```
[Source System] ──→ [Integration Layer] ──→ [Target System]
     │                      │                      │
  (trigger)           (transformation)         (outcome)
```

- **Inbound:** What data comes in, from where, at what frequency, and in what format?
- **Outbound:** What data goes out, to where, at what frequency, and in what format?
- **Real-time flows:** Which integrations require near-real-time processing?
- **Batch flows:** Which integrations run on a schedule?

### Integration Anti-Patterns

- Common integration mistakes to avoid in this domain:
- Known legacy integration debt or workarounds:
- Point-to-point integrations that should be replaced:

---

## 8. Compliance and Governance Considerations

<!-- What regulatory, compliance, or governance requirements apply? Include mandatory controls and audit requirements. -->

### Regulatory Requirements

| Regulation / Standard | Jurisdiction | Key Obligations | Internal Owner | Review Frequency |
|----------------------|-------------|----------------|---------------|-----------------|
| | | | | |
| | | | | |

### Data Privacy Considerations

- **PII Involved?** Yes / No — Describe what PII is collected, processed, or stored
- **Data Residency Requirements:** e.g., Data must remain within EU / US
- **Retention Policy:** e.g., Financial records retained for 7 years
- **Right to Erasure Applicability:** Yes / No — Describe scope
- **Cross-Border Data Transfer Restrictions:** Applicable regulations and controls

### Industry Standards

| Standard | Version | Applicability | Certification Required? | Auditor |
|----------|---------|--------------|------------------------|---------|
| | | | | |
| | | | | |

### Audit and Control Requirements

- What audit trails must be maintained and for how long?
- What controls are required (preventive, detective, corrective)?
- What evidence is required for compliance reporting?
- Who performs internal vs. external audits?

### Data Classification

| Data Type | Classification | Access Controls | Handling Requirements |
|-----------|---------------|----------------|----------------------|
| | Confidential / Internal / Public | | |
| | | | |

---

## 9. Common Project Artifacts

<!-- What documents and artifacts are typically created for projects in this domain? Include who creates them and who approves them. -->

### Discovery and Analysis

| Artifact | Author | Approver | Typical Format | Notes |
|----------|--------|---------|----------------|-------|
| Business Requirements Document (BRD) | BA / PM | Business Sponsor | Document | Requires sign-off gate |
| Current State Process Maps (As-Is) | BA | SMEs | Visio / Miro | Validate with domain SMEs |
| Stakeholder Interview Summaries | PM / BA | PM | Document | Anonymize if needed |
| Gap Analysis | BA / PM | PM | Document / Spreadsheet | |
| Domain Glossary | BA | SME | Document | |

### Design and Architecture

| Artifact | Author | Approver | Typical Format | Notes |
|----------|--------|---------|----------------|-------|
| Solution Design Document (SDD) | Architect | Tech Lead | Document | |
| Data Flow Diagrams (DFD) | BA / Architect | Tech Lead | Diagram | |
| Entity Relationship Diagrams (ERD) | Data Architect | Tech Lead | Diagram | |
| API Specifications | Developer | Tech Lead | OpenAPI / Swagger | |
| Security Assessment | Security team | CISO | Document | Required before build |

### Delivery

| Artifact | Author | Approver | Typical Format | Notes |
|----------|--------|---------|----------------|-------|
| User Stories with Acceptance Criteria | PM / BA | Product Owner | Jira / ADO | |
| Test Plan and Test Cases | QA | QA Lead | Document / Spreadsheet | |
| UAT Sign-off | Business | Sponsor | Email / Document | |
| Release Notes | PM / Dev | PM | Document | |
| Go-Live Runbook | Delivery Lead / Ops | Delivery Lead | Document | |

### Governance

| Artifact | Author | Approver | Update Frequency |
|----------|--------|---------|-----------------|
| Risk Register | PM | Sponsor | Weekly |
| Decision Log | PM | — | Per decision |
| RACI Matrix | PM | Sponsor | Per phase |
| Compliance Checklist | PM / BA | Compliance | Per release |

---

## 10. Useful Vocabulary

<!-- Domain-specific terms, acronyms, and jargon that team members should know. Include definitions that would be used by practitioners. -->

| Term | Definition | Used In Context | Do Not Confuse With |
|------|-----------|----------------|---------------------|
| | | | |
| | | | |
| | | | |
| | | | |

### Acronym Reference

| Acronym | Full Form | Definition in This Domain |
|---------|----------|--------------------------|
| | | |
| | | |

### Commonly Confused Terms

- **Term A vs. Term B:** Explain the distinction that matters in this domain
- **Term C vs. Term D:** —

---

## 11. AI Prompting Context

<!-- Context to include when using AI assistance in this domain to get better, safer, and more relevant outputs. -->

### Background Context to Always Include in Prompts

When working in this domain, AI prompts should include:

- The business domain and industry segment (e.g., "in the context of enterprise B2B payments...")
- The role perspective (e.g., "acting as a PM responsible for...")
- The target audience for the output (e.g., "the output will be reviewed by executive stakeholders...")
- Relevant constraints (regulatory, technical, budget, timeline)
- Key entities and terminology from this domain

### Standard Prompt Context Block

Copy and paste this block at the start of AI prompts for this domain:

```
Domain: {{DOMAIN_NAME}}
Industry: {{INDUSTRY}}
Company type: {{COMPANY_TYPE}} (e.g., enterprise SaaS, fintech startup, retail bank)
My role: {{ROLE}}
Target audience for output: {{AUDIENCE}}
Regulatory context: {{APPLICABLE_REGULATIONS}}
Key constraints: {{CONSTRAINTS}}
Key terminology: {{TERMS}}
```

### Effective Prompt Patterns for This Domain

- **For discovery and analysis:** "You are a business analyst helping a PM understand the {{DOMAIN_NAME}} domain. Provide an overview of the key workflows, stakeholders, and risks typically found in projects within a {{COMPANY_TYPE}} organization."
- **For requirements:** "Given the following user story: [STORY], generate a set of acceptance criteria appropriate for a {{DOMAIN_NAME}} context, flagging any compliance or data privacy considerations."
- **For risk identification:** "Identify the top 10 risks for a project delivering [CAPABILITY] in the {{DOMAIN_NAME}} domain. Categorize by type and suggest mitigation approaches."
- **For stakeholder communication:** "Draft a status update for [STAKEHOLDER AUDIENCE] covering [KEY POINTS]. Tone should be [TONE]. Keep it under [WORD COUNT] words."

### Caution: What AI Should Not Be Asked to Do in This Domain

- Do not ask AI to make compliance determinations without legal/compliance sign-off
- Do not paste real customer data, PII, or confidential commercial terms into AI prompts
- Do not rely on AI for authoritative regulatory interpretation — always verify with compliance teams
- Do not use AI-generated numbers as final metrics without validation against source data
- Do not use AI to make final architecture or security decisions

### AI Output Quality Checks for This Domain

Before using AI-generated content:
- [ ] Factual claims are verified against authoritative sources
- [ ] No hallucinated metrics, statistics, or regulatory citations
- [ ] Domain-specific terminology is used correctly and consistently
- [ ] Output is appropriate for the intended audience
- [ ] Compliance and risk language has been reviewed by appropriate stakeholders
- [ ] No confidential or proprietary information inadvertently included in the prompt

---

## 12. Open Questions

<!-- Track unresolved questions about this domain. Date-stamp each question and note who is responsible for resolving it. -->

| # | Question | Raised By | Date Raised | Owner | Target Date | Status |
|---|----------|-----------|------------|-------|------------|--------|
| 1 | | | | | | Open |
| 2 | | | | | | Open |
| 3 | | | | | | Open |

### Resolved Questions

| Question | Answer | Resolved By | Date Resolved |
|----------|--------|-------------|--------------|
| | | | |

### Assumptions on Record

<!-- List assumptions you have recorded about this domain that may need validation. -->

- [ ] **Assumption:** — Validated? Y/N — Date:
- [ ] **Assumption:** — Validated? Y/N — Date:
- [ ] **Assumption:** — Validated? Y/N — Date:

---

*Last reviewed by: {{REVIEWER}} on {{REVIEW_DATE}}*
*Next scheduled review: {{NEXT_REVIEW_DATE}}*
