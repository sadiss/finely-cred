/** Rich author-mode markdown for seeded bookstore products. */
import { applyCoreExpansions } from './bookstoreCoreExpansions';
import { NICHE_BOOK_CONTENT, NICHE_BOOK_PRODUCTS } from './bookstoreNicheBooks';

const BASE_RICH_CONTENT: Record<string, string> = {
  'sovereign-blueprint': `# Finely Blueprint — Personal Restoration

## Who this is for

You are not here for motivational quotes. You are here because something on your file is blocking the life you already decided to build — and you want a **client-first, evidence-driven** path that respects your time and your risk tolerance.

This playbook is what Finely operators use internally before they ever draft a letter or recommend a funding sequence.

---

## Part I — Triage without panic

Most people start by disputing everything at once. That is the fastest way to get generic bureau responses and wasted inquiries.

**The Finely triage order:**

1. Pull tri-bureau reports the same week (not three months apart).
2. Classify negatives: reporting error vs legitimate debt vs unknown ownership.
3. Rank by funding impact — what will an underwriter actually see in 90 days?
4. Build one evidence branch per item per bureau. Never merge branches.

> Insider note: underwriters weight **recent** behavior and **aggregate utilization** more than a five-year-old paid collection in many consumer products — but mortgage overlays differ. Triage for your *goal*, not for internet score fantasies.

---

## Part II — Metro2 contradiction mapping

Your disputes win when the file cannot be simultaneously true in all fields. Learn to read:

- Status code vs 24-month payment grid
- Date opened vs date of first delinquency vs date closed
- Balance vs past due vs high credit across bureaus

We include field-by-field worksheets in the portal Documents vault. Screenshot before you dispute. Always.

---

## Part III — Dispute cadence that compounds

**Round 1:** One claim. Minimum evidence. Clean ask + method of verification.

**Round 2:** Use the bureau's own words against the updated tradeline. New contradiction only.

**Round 3:** Escalation ladder — CFPB, AG, furnisher direct — only with documented non-response.

Each round gets its own Task board column in Finely Cred. If you cannot explain your round in one sentence, it is not ready to mail.

---

## Part IV — Utilization control for underwriting optics

Statement close date beats due date. Know it for every revolving account you care about.

Target band: under 9% aggregate on reporting cards when prepping funding — not because "9 is magic," but because manual reviewers bucket utilization visually.

---

## Part V — Readiness checklist

Before any major application:

- [ ] No active disputes on accounts that will re-pull
- [ ] Inquiry budget documented (6mo / 12mo)
- [ ] Identity consistent across bureaus
- [ ] Proof pack labeled and current

---

*Educational only. Not legal advice. You execute; we equip.*
`,

  'corporate-architect': `# Corporate Architect — Business Structure & Fundability

## The thesis

Business credit is not "personal credit with an EIN pasted on." It is a **reporting ecosystem** — D&B, Experian Business, Equifax Business, vendor trade lines, bank relationships, and how your story reads on paper.

This volume is the sequencing playbook Finely uses before recommending vendor stacks or business card applications.

---

## Chapter 1 — Entity hygiene

Your Secretary of State name, EIN letter, business bank, and first vendor application must match **character-for-character**. Variations ("LLC" vs "L.L.C.", DBA confusion) create ghost denials.

**Week 1 deliverables:**
- Verified legal name on all documents
- Business phone in 411 + Google Business Profile
- Address strategy documented (commercial vs virtual — know lender policies)

---

## Chapter 2 — Bureau alignment before applications

Register D-U-N-S when building Paydex. Pull Experian Business and Equifax Business **before** tier-1 vendor apps.

Fix NAICS, address, and phone mismatches first. Many "denials" are never-match errors.

---

## Chapter 3 — Vendor stacking logic

**Tier 1:** Net-30 vendors with predictable reporting. Small orders. Pay early.

**Tier 2:** Mid-tier after 2–3 positive cycles. Space applications 30+ days.

**Tier 3:** Higher limits only with 5+ clean trades and bank history.

Never stack five applications in one week because a forum said so.

---

## Chapter 4 — Business revolving & PG exposure

First business cards usually require personal guarantee. Understand the cross-default risk.

Choose issuers that report to **business** bureaus. Personal-only reporting wastes the slot.

---

## Chapter 5 — Shelf corps & aged entities

Aged entities can help **seasoning narratives** but cannot substitute for activity, deposits, or financials.

Underwriters verify beneficial ownership and bank history. A shelf without activity is a fraud signal — not a funding hack.

---

## Chapter 6 — Documentation discipline

Maintain a live folder: articles, EIN, lease, vendor statements, bank letters. Underwriters request paper on a clock. Speed wins manual review.

---

*Educational only. Consult CPAs and attorneys for tax and entity decisions.*
`,

  'administrative-remedy': `# Administrative Remedy — Escalation & Compliance Workflow

## What this book is (and is not)

This is **not** a collection of magic phrases. It is the escalation workflow Finely clients use when bureau processes stall — documented, timed, and compliance-safe.

It is **not** legal advice. Summons, lawsuits, and bankruptcy timing require licensed counsel.

---

## Module 1 — Response decoding

When a bureau says "verified," your next move depends on **what** they verified:

- Furnisher contact only → request method of verification
- Field update only → re-screenshot and branch
- Deletion → archive proof, stop disputing the ghost

Track every letter in the portal timeline. Mixing branches destroys credibility.

---

## Module 2 — CFPB & AG escalation

Escalate only with:

1. Complete mail log (sent/received dates)
2. Bureau response copies
3. Specific regulatory cite (FCRA 611, 623 as applicable)
4. Narrow ask

Generic rage letters get closed as "resolved — consumer dissatisfied."

---

## Module 3 — Furnisher direct path

Some wins happen faster at the furnisher — especially duplicate inquiries, ownership disputes, and post-sale collection chains.

Call with documentation ready. Every verbal promise → written follow-up.

---

## Module 4 — Template library usage

Finely templates are starting points. You must:

- Replace placeholders with your facts
- Attach exhibits by label
- One claim per letter

Never mail a template you have not read aloud slowly once.

---

## Module 5 — Case tracking for partners

If you are a Finely partner managing clients:

- One project per client file branch
- Tasks for every mail date + statutory deadline
- Evidence vault permissions scoped per case

---

*Educational only. Laws vary by jurisdiction.*
`,

  'tradeline-funding-manual': `# Tradeline & Funding Manual

## Inside the industry language

Resellers talk about combos, primaries, and bank-verified lines. Underwriters talk about AAoA, inquiry load, and payment depth. This manual translates both sides — without selling you fantasy.

---

## Part I — Primary tradelines

If your name is on the contract, it is primary. Authorized user status is not interchangeable for every funding product.

**Reporting cadence:** Most issuers report monthly at statement close. Plan a 90-day runway after new primaries before expecting score and underwriting stability.

**Insider signals funders watch:**
- Payment depth (24-month grid) vs limit on paper
- Address and identity consistency across bureaus
- Inquiry load in the 90 days before application

---

## Part II — Authorized user (AU) tradelines

AU status can help utilization optics but does not carry the same weight as primaries for many underwriters.

**When AU helps:** Aggregate utilization control, seasoning narrative for certain consumer products.

**When AU misleads:** Mortgage overlays, some business funding, files with identity mismatches.

Never stack AU products without a baseline pull and duplicate-tradeline check.

---

## Part III — Combo ladders (12 / 18 / 21 / 24 months)

Combos target average age of accounts and oldest tradeline — not magic score boosts.

**Before purchasing anything:**
1. Baseline tri-bureau pull — document AAoA and oldest trade
2. Inquiry budget for your funding goal (6mo / 12mo)
3. Duplicate check — same tradeline type on one bureau looks synthetic

**Timeline:** Month 0 baseline → Month 1–2 posts land (volatility) → Month 3 re-pull → Month 6+ maintain (do not close old accounts abruptly)

---

## Part IV — Inquiry budgeting

Real strategy beats "500-app lists" circulating online.

Track every pull: bureau, date, result, next eligible date. Space hard pulls 30–45 days minimum when building; 90 days is safer for mortgage-adjacent goals.

Apply after statement close when utilization reports low — know each card's reporting date.

---

## Part V — Funding sequence

Personal file readiness: inquiries controlled, utilization staged, no active disputes on accounts that will re-pull.

Business file readiness: 3+ reporting tradelines, consistent entity data, bank history.

**Stack order:** vendor lines → business cards → term loans / LOC — not all at once.

---

## Part VI — Red flags (compliance filter)

- Promises of guaranteed funding or deletion
- Tactics requiring claims you cannot prove
- Misrepresenting entity age or revenue

---

*Educational only. Tradeline products vary widely in compliance and reporting.*
`,

  'ai-credit-operator': `# AI Credit Operator

## The Finely loop

1. Upload report + evidence
2. AI extracts Metro2 fields into structured cards
3. Human selects ONE claim
4. AI drafts letter tied to exhibits — you review every sentence
5. Mail, log dates, AI parses bureau response for next branch

This volume is how Finely operators use AI without replacing human judgment.

---

## Part I — What AI is good at

- Spotting Metro2 field contradictions across screenshots faster than manual scan
- Drafting first-pass dispute language scoped to one claim
- Summarizing long bureau responses into action items with deadlines
- Modeling inquiry budget: "If I apply here and here, what's my 90-day pull count?"

---

## Part II — What AI cannot do

- Guarantee deletions or know private furnisher policies
- Replace licensed legal advice on lawsuits, summons, or bankruptcy timing
- Invent facts, account numbers, or dates not in your evidence pack

If output includes claims you cannot support with exhibits, delete them before mailing.

---

## Part III — Prompt discipline

- Always attach screenshots; never ask AI to "guess" balances or dates
- Request "method of verification" language only when your claim is unverifiable/inaccurate
- Ban emotional adjectives — bureaus respond to field-level contradictions
- One claim per letter; never merge bureau branches in one prompt

---

## Part IV — Privacy & compliance

- Redact full SSN in prompts; use last-4 only when necessary
- Store outputs in portal Documents vault — not random chat histories
- Run every draft through human review before certified mail

---

## Part V — Portal integration

Upload → structured tradeline cards → Task board per bureau branch → letter studio → mail log → response parser.

Each round gets its own column. If you cannot explain your round in one sentence, it is not ready to mail.

---

*Educational only. You remain responsible for mailed disputes.*
`,
};

export const BOOKSTORE_RICH_CONTENT: Record<string, string> = applyCoreExpansions({
  ...BASE_RICH_CONTENT,
  ...NICHE_BOOK_CONTENT,
});

export const BOOKSTORE_EXTRA_PRODUCTS = [
  {
    slug: 'tradeline-funding-manual',
    title: 'Tradeline & Funding Manual',
    sub: 'Insider Education',
    vol: '05',
    priceAmount: 59700,
    accentColor: '#10b981',
    desc: 'Primary tradelines, combo ladders, inquiry budgeting, and funding sequencing — the topics most consumers never hear explained honestly.',
    bullets: [
      'Primary vs AU mechanics',
      'Combo 12/18/24 month logic',
      'Bank-verified tradeline reality',
      '90-day funding runway planner',
    ],
  },
  {
    slug: 'ai-credit-operator',
    title: 'AI Credit Operator',
    sub: 'Workflow Systems',
    vol: '06',
    priceAmount: 39700,
    accentColor: '#8b5cf6',
    desc: 'How to use AI for Metro2 mapping, bureau response parsing, and letter drafting — without replacing human judgment or inventing facts.',
    bullets: [
      'Finely AI dispute loop',
      'Prompt discipline rules',
      'Privacy redaction checklist',
      'Portal vault integration',
    ],
  },
  ...NICHE_BOOK_PRODUCTS,
];
