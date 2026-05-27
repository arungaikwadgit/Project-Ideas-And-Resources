# AI Output Quality Check: [Output Title]

> **Purpose:** This template provides a structured, repeatable quality review process for AI-generated content before it is used, shared, or submitted. Use it as a checkpoint — not a bureaucratic hurdle — to ensure AI outputs are accurate, appropriate, and fit for their intended purpose.

---

## Check Metadata

| Field | Value |
|-------|-------|
| **Output Title** | [Descriptive name of the AI-generated content being reviewed] |
| **Check ID** | [e.g., qc-2024-W45-001] |
| **Date of Review** | [Date] |
| **Reviewer** | [Name and role] |
| **AI Provider** | [e.g., Anthropic Claude / OpenAI ChatGPT] |
| **Model** | [e.g., Claude 3.5 Sonnet] |
| **Intended Use** | [Where this output will be used — e.g., included in a stakeholder presentation] |
| **Audience** | [Who will receive or read this content] |
| **Risk Level of Use** | [Low / Medium / High — based on audience and stakes] |

---

## Section 1: Accuracy Review

> Verify that the content is factually correct and does not contain hallucinations, errors, or unsupported claims.

### 1.1 Factual Claim Inventory

> List the key factual claims made in the output and the verification status for each.

| # | Claim | Verified? | Source / Method | Action Required |
|---|-------|---------|----------------|----------------|
| 1 | [e.g., "E-commerce market grew 15% YoY in 2023"] | [ ] Yes / [ ] No / [ ] Unverifiable | [e.g., Cross-referenced with Statista report] | [e.g., Include source citation / Remove claim / Rephrase as estimate] |
| 2 | [Claim] | [ ] Yes / [ ] No / [ ] Unverifiable | [Source] | [Action] |
| 3 | [Claim] | [ ] Yes / [ ] No / [ ] Unverifiable | [Source] | [Action] |
| 4 | [Claim] | [ ] Yes / [ ] No / [ ] Unverifiable | [Source] | [Action] |

### 1.2 Hallucination Indicators

Check for common AI hallucination patterns:

- [ ] **Invented references:** Does the output cite sources, studies, or quotes that cannot be found or verified?
- [ ] **Confident but wrong:** Does the output state something as fact that is demonstrably incorrect?
- [ ] **Over-specific numbers:** Are statistics suspiciously precise without a credible source?
- [ ] **Invented people or organisations:** Does the output reference individuals, companies, or events that do not exist?
- [ ] **Contradictions:** Does the output contradict itself in different sections?

**Hallucination findings:**
[ ] No hallucinations detected
[ ] Potential hallucinations found — see table above
[ ] Confirmed hallucinations — significant content must be removed or corrected

**Corrective actions taken:**
[Describe what was removed, corrected, or flagged.]

---

## Section 2: Relevance & Completeness Review

> Assess whether the output actually answers what was asked and covers all required elements.

### 2.1 Relevance Check

| Question | Assessment |
|---------|-----------|
| Does the output address the core question or task in the prompt? | [ ] Yes, fully / [ ] Partially / [ ] No |
| Is the output focused on the right topic, or has it drifted? | [ ] On topic / [ ] Some drift / [ ] Significant drift |
| Is the level of detail appropriate for the audience and use case? | [ ] Appropriate / [ ] Too detailed / [ ] Too superficial |
| Does the output make correct assumptions about the context? | [ ] Yes / [ ] Some incorrect assumptions / [ ] No — context was missed |

**Relevance notes:**
[Any specific relevance issues found and how they were addressed.]

### 2.2 Completeness Check

| Required Element | Present? | Quality | Notes |
|-----------------|---------|---------|-------|
| [Required element 1 — e.g., Executive summary] | [ ] Yes / [ ] Partial / [ ] No | [Good / Needs improvement] | [Notes] |
| [Required element 2 — e.g., Risk section] | [ ] Yes / [ ] Partial / [ ] No | [Good / Needs improvement] | [Notes] |
| [Required element 3] | [ ] Yes / [ ] Partial / [ ] No | [Assessment] | [Notes] |
| [Required element 4] | [ ] Yes / [ ] Partial / [ ] No | [Assessment] | [Notes] |

**Missing elements added during review:**
[List any content that was added to fill gaps in the AI output.]

---

## Section 3: Tone & Audience Fit

> Ensure the content is appropriate for its intended audience in tone, language, and framing.

### 3.1 Tone Assessment

| Dimension | Target | Actual | Action Required |
|-----------|--------|--------|----------------|
| **Formality** | [e.g., Formal / Neutral / Conversational] | [Assessed tone] | [Adjust if needed] |
| **Technicality** | [e.g., Executive / Technical / Mixed] | [Assessed level] | [Adjust if needed] |
| **Confidence** | [e.g., Authoritative / Exploratory / Cautious] | [Assessed tone] | [Adjust if needed] |
| **Empathy / Sensitivity** | [Required level for this content] | [Assessed level] | [Adjust if needed] |

### 3.2 Language & Style Check

- [ ] **Jargon:** Is domain-specific terminology explained or appropriate for the audience?
- [ ] **Acronyms:** Are all acronyms spelled out on first use?
- [ ] **Passive voice:** Is passive voice used appropriately and not excessively?
- [ ] **Length:** Is the output an appropriate length for its format and audience?
- [ ] **Formatting:** Is the structure clear and scannable? Are headings, bullets, and tables used well?
- [ ] **Brand / voice alignment:** Does the content match your organisation's communication style?

**Tone & style edits made:**
[Describe any edits made to improve tone, language, or style.]

---

## Section 4: Governance & Safety Review

> Check for content that may pose ethical, legal, compliance, or safety risks.

### 4.1 Sensitive Content Check

| Check | Status | Notes |
|-------|--------|-------|
| No personally identifiable information (PII) in the output | [ ] Clear / [ ] Issue found | [Describe if issue] |
| No confidential organisational data in the output | [ ] Clear / [ ] Issue found | [Describe if issue] |
| No discriminatory, biased, or inappropriate language | [ ] Clear / [ ] Issue found | [Describe if issue] |
| No legal claims, medical advice, or regulated guidance without appropriate caveats | [ ] Clear / [ ] N/A / [ ] Issue found | [Describe if issue] |
| No content that could create reputational risk if published | [ ] Clear / [ ] Issue found | [Describe if issue] |
| No copyright or IP infringement risk (e.g., long verbatim quotes from copyrighted works) | [ ] Clear / [ ] Issue found | [Describe if issue] |

### 4.2 Bias & Fairness Check

- [ ] Does the output make unfair generalisations about groups of people?
- [ ] Does the output present one perspective without acknowledging legitimate alternatives?
- [ ] Does the output use inclusive, respectful language?
- [ ] Does the output avoid stereotyping based on gender, ethnicity, nationality, or other characteristics?

**Bias / fairness issues found:**
[ ] None
[ ] Issues found — corrected as follows: [Describe corrections]

### 4.3 Regulatory / Compliance Check (if applicable)

| Compliance Area | Relevant? | Issue Found? | Action |
|----------------|----------|-------------|--------|
| [e.g., GDPR / Data Protection] | [ ] Yes / [ ] No | [ ] Yes / [ ] No | [Action] |
| [e.g., Financial regulations / FCA] | [ ] Yes / [ ] No | [ ] Yes / [ ] No | [Action] |
| [e.g., Healthcare / HIPAA] | [ ] Yes / [ ] No | [ ] Yes / [ ] No | [Action] |
| [e.g., Accessibility / WCAG] | [ ] Yes / [ ] No | [ ] Yes / [ ] No | [Action] |

---

## Section 5: Overall Quality Scorecard

> Provide an overall assessment of the AI output after all checks are complete.

| Quality Dimension | Score (1–5) | Weight | Weighted Score | Commentary |
|------------------|-------------|--------|---------------|-----------|
| Accuracy | [1–5] | 30% | [Score × 0.3] | [Key findings] |
| Relevance & Completeness | [1–5] | 25% | [Score × 0.25] | [Key findings] |
| Tone & Audience Fit | [1–5] | 20% | [Score × 0.2] | [Key findings] |
| Governance & Safety | [1–5] | 25% | [Score × 0.25] | [Key findings] |
| **Overall Weighted Score** | | | **[Sum]** | |

*Rating guide: 1.0–2.0 = Do not use / 2.1–3.0 = Major revision required / 3.1–4.0 = Minor revision required / 4.1–5.0 = Approved with light edits*

### Final Quality Verdict

- [ ] **Approved** — Output is fit for use with minor or no edits.
- [ ] **Approved with revisions** — Output is usable after the revisions documented in this check.
- [ ] **Requires significant revision** — Output needs substantial rewriting before it can be used.
- [ ] **Rejected** — Output is not fit for purpose. Re-prompt or use an alternative approach.

**Verdict rationale:**
[2–4 sentences explaining the verdict and the key factors that drove it.]

---

## Section 6: Actions & Next Steps

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [Specific correction or edit to make] | [Name] | [Date] | [ ] Open |
| 2 | [Action] | [Name] | [Date] | [ ] Open |
| 3 | [Action] | [Name] | [Date] | [ ] Open |

**Output ready for use:** [ ] Yes — as of [Date] / [ ] No — pending actions above

---

*Check ID: [ID] | Output: [Title] | Reviewer: [Name] | Date: [Date]*
