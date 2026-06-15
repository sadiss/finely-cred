/** Additional chapters merged into core bookstore titles (v3 content refresh). */
export const CORE_BOOK_EXPANSIONS: Record<string, string> = {
  'sovereign-blueprint': `

---

## Part VI — Inquiry budget architecture

Hard inquiries decay in score impact but remain visible 24 months. Funders bucket inquiry counts at 6 and 12 months.

**Inquiry ledger columns:**

| Column | Purpose |
| --- | --- |
| Date | Pull date |
| Bureau | EXP / EQF / TUC |
| Product | Card, mortgage, auto, vendor |
| Result | Approved / declined / pending |
| Next eligible | Earliest safe re-apply date |

Never apply for funding while active disputes run on accounts that will re-pull.

---

## Part VII — Identity layer before disputes

Normalize name, SSN last-4 consistency, and address history **before** Round 1. Disputes on fragmented files create duplicate tradelines.

**Pre-dispute identity checklist:**

- [ ] Legal name matches ID on all bureaus
- [ ] Address history complete (no unexplained gaps)
- [ ] Employer info consistent (where reported)
- [ ] Fraud alerts documented and timed for apps

---

## Part VIII — Evidence vault taxonomy

Folder structure Finely operators use:

\`/[Partner]/[Bureau]/[Creditor]/[Round-N]/\`

Each round folder contains: letter PDF, mail receipt, bureau response, annotated screenshots.

---

## Part IX — Funding overlay (personal restore lane)

Sequence personal stabilization before business vendor stacking if you personally guarantee business credit.

**Month 1–2:** Disputes + utilization control.

**Month 3–4:** Re-pull, inquiry-clean window.

**Month 5+:** Business entity work if lane requires.

---

## Part X — Case study patterns (anonymized)

**Pattern A — Status/grid contradiction:** Charge-off status with current payment grid → deletion on Round 2 with MOFV request.

**Pattern B — DOFD drift:** Collection DOFD newer than original creditor → updated DOFD on furnisher-direct path.

**Pattern C — Inquiry-only block:** 740 score, OFAC false positive → manual clearance, no dispute needed.

---

## Part XI — Student loan field prep (mortgage lane)

Before mortgage tri-merge, audit every student loan tradeline for payment amount field accuracy. IDR $0 certifications must match reported scheduled payment or DTI fails at underwriting.

---

## Part XII — Charge-off triage matrix

| Goal | Action |
| --- | --- |
| Mortgage in 12 months | PFD or accurate dispute — avoid "settled for less" if overlay blocks |
| Score recovery only | Pay down utilization first; charge-off pay may not move FICO |
| Already settled | Dispute field mismatches vs agreement |

---

## Part XIII — Partner handoff to Bookstore Vol 13–16

Deep dives: Student Loan Operator (Vol 13), Mortgage Overlays (Vol 14), AU Matrix (Vol 15), Charge-Off Math (Vol 16).

---

*Volume 04 — Finely Cred operator edition.*
`,

  'corporate-architect': `

---

## Chapter 7 — Experian Business vs Equifax Business

Pull both before vendor apps. Ghost listings with wrong SIC codes auto-decline.

**Alignment checklist:**

- Legal name character match
- Address suite format consistent
- Phone listed on 411
- Website email domain matches entity

---

## Chapter 8 — Net-30 vendor matrix (starter tier)

Target vendors with **predictable** reporting — not forum hype lists.

**Application discipline:**

- Order minimum SKU
- Pay before due date (Paydex loves early pay)
- Wait 45 days before next vendor

---

## Chapter 9 — Business credit card PG matrix

| Stage | Action |
| --- | --- |
| 0 trades | Wait — build vendors first |
| 3+ trades | First PG business card |
| 6+ trades | Second card, different bureau reporter |
| 12+ months | LOC conversation with relationship bank |

---

## Chapter 10 — UCC lien awareness

Search state UCC index before collateralized loans. Stale liens delay new funding.

---

## Chapter 11 — Revenue story vs deposit story

Underwriters match stated revenue to bank deposits. Misalignment triggers instant document requests or decline.

---

*Volume 02 — Business structure operator edition.*
`,

  'administrative-remedy': `

---

## Module 6 — State AG escalation paths

Attorney General consumer divisions accept pattern complaints — not single-item frustration letters.

Attach: timeline, bureau copies, prior CFPB reference number if any.

---

## Module 7 — Method of verification (MOFV) deep dive

After "verified," your Round 2 asks:

> Identify the person or system that verified the account and describe the method of verification pursuant to FCRA §611(a)(7).

Responses often reveal furnisher auto-confirm — basis for CFPB escalation.

---

## Module 8 — Parallel bureau strategy

Never wait for one bureau while others stall. Independent branches per bureau per item.

---

## Module 9 — Partner SLA for client cases

Finely partners track:

- Mail date + statutory deadline
- Client evidence upload SLA (48h)
- Response parsing within 24h of client upload

---

*Volume 03 — Escalation workflow edition.*
`,

  'tradeline-funding-manual': `

---

## Part VII — AU piggyback underwriting reality

Mortgage overlays often exclude AU tradelines from DTI-sensitive calculations. Know your loan type before buying AU products.

---

## Part VIII — Primary seasoning without resellers

Secured card → graduate to unsecured → credit builder loan is slow but clean.

**90-day runway minimum** before expecting funding-grade stability.

---

## Part IX — Bank-verified tradeline myth filter

No sticker makes a tradeline "bank verified." Verification means issuer + deposit relationship + consistent identity.

---

## Part X — Combo + mortgage timing

Do not add combos within 12 months of mortgage application if overlay ignores AU age.

---

*Volume 05 — Tradeline insider edition.*
`,

  'ai-credit-operator': `

---

## Part VI — Response parser prompts

Train AI to extract: outcome code, fields changed, deadline for next action.

Never auto-mail AI output.

---

## Part VII — Inquiry budget simulator

Model: "If I apply to Issuer A (EXP) and Issuer B (EQF) this month, what is my 90-day pull count?"

---

## Part VIII — Red team your own letters

Prompt: "Find three factual claims in this letter that lack exhibit support."

---

*Volume 06 — AI workflow edition.*
`,
};

export function applyCoreExpansions(content: Record<string, string>): Record<string, string> {
  const out = { ...content };
  for (const [slug, expansion] of Object.entries(CORE_BOOK_EXPANSIONS)) {
    if (out[slug] && !out[slug].includes('operator edition')) {
      out[slug] = `${out[slug].trim()}${expansion}`;
    } else if (out[slug]) {
      // already expanded in v3 — replace trailing if re-run
      out[slug] = out[slug].split('\n\n---\n\n## Part VI')[0]?.trim() + expansion;
    }
  }
  return out;
}
