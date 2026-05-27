# AI Run Review: [Run Title / Reference]

> **Purpose:** The AI run review is a structured record of a single AI interaction — capturing the prompt used, the output received, the quality assessment, any governance considerations, and the final edited output. Maintaining these records supports accountability, quality improvement, and audit readiness for AI-assisted work.

---

## Run Metadata

| Field | Value |
|-------|-------|
| **Run Title** | [A descriptive name for this AI run — e.g., "Q4 Status Report Draft — Week 45"] |
| **Run ID** | [e.g., air-2024-W45-001] |
| **Date & Time** | [Date and time the prompt was submitted] |
| **Reviewed By** | [Name and role of the person reviewing this output] |
| **Project / Context** | [Project or task this run relates to] |
| **Domain** | [e.g., E-commerce / Healthcare / Internal tooling] |
| **AI Provider** | [e.g., Anthropic Claude / OpenAI ChatGPT / Google Gemini] |
| **Model Used** | [e.g., Claude 3.5 Sonnet / GPT-4o] |
| **Prompt Pack Used** | [Name of prompt pack if applicable — or "Custom prompt"] |
| **Prompt ID** | [ID of specific prompt used — or "N/A" for custom prompts] |
| **Governance Level** | [Standard / Elevated] |
| **Output Used In** | [Where this output will be used — e.g., Internal memo / Stakeholder presentation / PRD] |

---

## 1. Governance Pre-Check

> Complete before submitting the prompt to the AI. Check each item and confirm.

| Check | Status | Notes |
|-------|--------|-------|
| No personally identifiable information (PII) in prompt | [ ] Confirmed | [Notes if any] |
| No payment card, bank account, or financial credentials in prompt | [ ] Confirmed | [Notes if any] |
| No confidential IP, trade secrets, or NDA-covered content in prompt | [ ] Confirmed | [Notes if any] |
| No real customer names, records, or transaction data in prompt | [ ] Confirmed | [Notes if any] |
| No API keys, passwords, or access tokens in prompt | [ ] Confirmed | [Notes if any] |
| No content from untrusted external sources that could manipulate AI behaviour | [ ] Confirmed | [Notes if any] |
| Appropriate for external AI processing | [ ] Confirmed | [Notes if any] |

**Governance Clearance:** [ ] Cleared to proceed / [ ] Escalation required

**Escalation notes (if any):**
[Describe any governance concerns raised and how they were resolved.]

---

## 2. Prompt Used

> Paste the exact prompt submitted to the AI. Include all context, instructions, and constraints.

```
[PASTE THE EXACT PROMPT HERE — including all context, constraints, role framing, and formatting instructions]
```

**Prompt design notes:**
[Any notes on why the prompt was structured this way — e.g., "Included role framing as PM for the domain context" / "Added explicit length constraint to avoid verbosity" / "Iterated from a previous prompt that was too vague"]

---

## 3. Raw AI Output

> Paste the AI output exactly as received — before any editing.

```
[PASTE THE EXACT RAW AI OUTPUT HERE]
```

**Output received at:** [Date and time]
**Output length:** [Approximate word or character count]

---

## 4. Output Quality Assessment

> Evaluate the AI output against the following dimensions. Rate each 1–5 and provide brief commentary.

| Dimension | Rating (1–5) | Commentary |
|-----------|-------------|-----------|
| **Accuracy** — Is the content factually correct? | [1–5] | [Brief assessment] |
| **Relevance** — Does it address what was asked? | [1–5] | [Brief assessment] |
| **Completeness** — Does it cover all required elements? | [1–5] | [Brief assessment] |
| **Clarity** — Is it clear and well-structured? | [1–5] | [Brief assessment] |
| **Tone** — Is the tone appropriate for the intended audience? | [1–5] | [Brief assessment] |
| **Originality** — Is the output appropriately original and not generic? | [1–5] | [Brief assessment] |
| **Actionability** — Can this be used or adapted directly? | [1–5] | [Brief assessment] |

*Rating guide: 1 = Unacceptable / 3 = Adequate with revisions / 5 = Excellent*

**Overall quality rating:** [1–5]

**Summary assessment:**
[2–4 sentences summarising the overall quality of this output. What was strong? What needed significant work? Was it fit for purpose?]

---

## 5. Issues Found

> Document any specific problems with the AI output that required correction.

| # | Issue Type | Description | Severity | Resolution |
|---|-----------|------------|---------|-----------|
| 1 | [Factual error / Tone issue / Missing content / Hallucination / Other] | [Describe the specific issue] | [Low / Med / High] | [How it was corrected] |
| 2 | [Issue type] | [Description] | [Severity] | [Resolution] |
| 3 | [Issue type] | [Description] | [Severity] | [Resolution] |

**Hallucination check:**
[ ] No hallucinations detected — all claims verified
[ ] Potential hallucinations identified — see Issue Log above
[ ] Significant hallucinations found — output required substantial factual correction

---

## 6. Edits Made

> Summarise the edits applied to transform the raw AI output into the final version.

**Nature of edits:**
- [ ] Minor — Light copyedit, formatting, or style adjustments only
- [ ] Moderate — Content reorganised, some sections rewritten
- [ ] Substantial — Most content rewritten; AI output used primarily for structure
- [ ] Full rewrite — AI output not used; was not fit for purpose

**Specific edits made:**
- [Edit 1 — describe the change and why it was needed]
- [Edit 2]
- [Edit 3]
- [Additional edits as needed]

**Editorial time required:** [Approximate time spent editing — e.g., "15 minutes" / "2 hours"]

---

## 7. Final Output

> Paste or link to the final, edited version of the content.

[PASTE THE FINAL EDITED OUTPUT HERE — or provide a link to the document where it lives]

**Final output location:** [Link or file path]
**Final output status:** [Draft / Reviewed / Approved / Published]

---

## 8. Post-Output Governance Check

| Check | Status | Notes |
|-------|--------|-------|
| Output reviewed by a human before use | [ ] Confirmed | |
| Factual claims verified against reliable sources | [ ] Confirmed | [Sources checked] |
| PII does not appear in the output | [ ] Confirmed | |
| Output is not being shared verbatim without review | [ ] Confirmed | |
| Audience is aware this content was AI-assisted (if required by policy) | [ ] Confirmed / [ ] N/A | |

---

## 9. Prompt Improvement Notes

> Capture lessons for improving future prompts based on this run.

**What worked well in this prompt:**
[What aspects of the prompt design produced good results that should be kept or replicated?]

**What to improve for next time:**
[What would make the prompt produce better output? Be specific.]

**Suggested revised prompt (optional):**
```
[If you have a revised version of the prompt that you believe would perform better, paste it here for future reference]
```

---

## 10. Run Log Summary

| Field | Value |
|-------|-------|
| **Overall quality** | [1–5] |
| **Edits required** | [Minor / Moderate / Substantial / Full rewrite] |
| **Governance status** | [Cleared / Concern noted] |
| **Output fit for purpose** | [Yes / Yes with edits / No] |
| **Prompt recommended for reuse** | [Yes / Yes with modifications / No] |

---

*Run ID: [ID] | Project: [Project Name] | Reviewed By: [Name] | Date: [Date]*
