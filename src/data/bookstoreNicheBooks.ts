/** Niche premium titles — topics rarely explained honestly in consumer credit education. */
export const NICHE_BOOK_SLUGS = {
  metro2Forensics: 'metro2-field-forensics',
  eoscarProtocols: 'eoscar-furnisher-protocols',
  reagingDofd: 'reaging-dofd-trap',
  ofacFraudMatrix: 'ofac-fraud-alert-matrix',
  depositScorecards: 'deposit-relationship-scorecards',
  paydexGap: 'paydex-intelliscore-gap',
  studentLoanOperator: 'student-loan-metro2-operator',
  mortgageOverlayManual: 'mortgage-underwriter-overlay-manual',
  auUnderwriterMatrix: 'authorized-user-underwriter-matrix',
  chargeOffDeletionMath: 'charge-off-paydown-deletion-math',
} as const;

export const NICHE_BOOK_PRODUCTS = [
  {
    slug: NICHE_BOOK_SLUGS.metro2Forensics,
    title: 'Metro2 Field Forensics',
    sub: 'Technical Dispute Angles',
    vol: '07',
    priceAmount: 79700,
    accentColor: '#0ea5e9',
    desc: 'The field-level dispute playbook operators use when generic letters fail — status codes, payment grids, K-segments, and cross-bureau drift.',
    bullets: [
      'Account Status vs Payment Rating contradictions',
      '24-month grid decoding (0–9, X, B, D, R codes)',
      'K-segment & special comment traps',
      'Cross-bureau field drift worksheets',
      'One-claim letter scaffolds per contradiction type',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.eoscarProtocols,
    title: 'e-OSCAR & Furnisher Protocols',
    sub: 'Industry Plumbing',
    vol: '08',
    priceAmount: 89700,
    accentColor: '#64748b',
    desc: 'How disputes actually move between CRAs and furnishers — ACDV/audits, e-OSCAR response codes, and why "verified" rarely means what consumers think.',
    bullets: [
      'ACDV vs direct dispute paths',
      'e-OSCAR response code decoder',
      'Furnisher reinvestigation timelines',
      'When to pivot furnisher-direct',
      'Documentation that survives audit',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.reagingDofd,
    title: 'Re-Aging & DOFD Warfare',
    sub: 'Date Field Strategy',
    vol: '09',
    priceAmount: 74700,
    accentColor: '#f97316',
    desc: 'Date of First Delinquency drift, re-aging patterns, and statute-of-limitations optics — the date fields 99% of DIY disputers never audit.',
    bullets: [
      'DOFD vs Date Opened vs Date Closed logic',
      'Re-aging red flags in Metro2',
      'SOL optics (not legal advice)',
      '7-year reporting window math',
      'Multi-bureau DOFD mismatch playbooks',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.ofacFraudMatrix,
    title: 'OFAC & Fraud Alert Matrix',
    sub: 'Identity Layer',
    vol: '10',
    priceAmount: 69700,
    accentColor: '#ef4444',
    desc: 'OFAC screens, extended fraud alerts, credit freezes, and identity suppression traps that block funding even when scores look fine.',
    bullets: [
      'OFAC false positives & clearance',
      'Extended fraud alert lifecycles',
      'Lift vs thaw timing for apps',
      'Name/SSN/address mismatch cascades',
      'Manual review recovery checklist',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.depositScorecards,
    title: 'Deposit Relationship Scorecards',
    sub: 'Banking Insiders',
    vol: '11',
    priceAmount: 84700,
    accentColor: '#14b8a6',
    desc: 'How relationship bankers score files internally — average daily balance, deposit velocity, NSF patterns, and warm-handoff timing.',
    bullets: [
      '90-day relationship runway',
      'ADB vs statement balance optics',
      'NSF & return item recovery',
      'Warm intro vs cold app outcomes',
      'Business vs personal deposit discipline',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.paydexGap,
    title: 'Paydex vs Intelliscore Gap',
    sub: 'Business Bureaus',
    vol: '12',
    priceAmount: 74700,
    accentColor: '#a855f7',
    desc: 'Why your D&B Paydex and Experian Intelliscore tell different stories — and how to close the gap before vendor and LOC applications.',
    bullets: [
      'Paydex calculation mechanics',
      'Intelliscore Plus vs Vantage overlap',
      'Vendor reporting lag windows',
      'NAICS & SIC mismatch fixes',
      'Tier vendor sequencing by bureau',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.studentLoanOperator,
    title: 'Student Loan Metro2 Operator Manual',
    sub: 'Servicer Forensics',
    vol: '13',
    priceAmount: 69700,
    accentColor: '#3b82f6',
    desc: 'Federal and private servicer reporting decoded — status codes, rehab optics, transfer duplicates, and field disputes when generic student loan letters fail.',
    bullets: [
      'Deferment/forbearance remark traps',
      'Servicer transfer duplicate tradelines',
      'Rehab vs consolidation reporting paths',
      'IDR payment vs scheduled amount fields',
      'Mortgage DTI interaction playbook',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.mortgageOverlayManual,
    title: 'Mortgage Underwriter Overlay Manual',
    sub: 'Pre-Approval Discipline',
    vol: '14',
    priceAmount: 89700,
    accentColor: '#059669',
    desc: 'Investor overlays beyond FICO — collections, dispute flags, AU rules, inquiry shopping windows, and dispute freeze timing before rate lock.',
    bullets: [
      '45-day inquiry shopping math',
      'Open dispute freeze rules',
      'AU inclusion/exclusion by investor',
      'Collection threshold overlays',
      'Re-pull stabilization after deletions',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.auUnderwriterMatrix,
    title: 'Authorized User Underwriter Matrix',
    sub: 'Piggyback Reality',
    vol: '15',
    priceAmount: 74700,
    accentColor: '#d97706',
    desc: 'Which investors count AU for payment history vs utilization — and when buying AU tradelines helps, hurts, or triggers manual review.',
    bullets: [
      'FHA/VA/Conventional AU treatment',
      'Utilization inheritance risk',
      'Combo ladder timing vs mortgage',
      'Removal before tri-merge checklist',
      'Primary-first alternative paths',
    ],
  },
  {
    slug: NICHE_BOOK_SLUGS.chargeOffDeletionMath,
    title: 'Charge-Off Challenge & Validation Warfare',
    sub: 'Never Pay as Default',
    vol: '16',
    priceAmount: 79700,
    accentColor: '#dc2626',
    desc: 'Validation-first doctrine — challenge charge-offs and collections on FCRA/FDCPA/UCC terms. We do not default to paydown or settlement.',
    bullets: [
      'FDCPA §809 validation before any payment',
      'FCRA field disputes — not emotional deletion',
      'Affidavit + summons response sequencing',
      'Collector licensing & chain-of-title challenges',
      'When PFD is last resort only (written contract)',
    ],
  },
];

export const NICHE_BOOK_CONTENT: Record<string, string> = {
  [NICHE_BOOK_SLUGS.metro2Forensics]: `# Metro2 Field Forensics — Technical Dispute Angles

## Who needs this volume

You already know how to mail a dispute letter. What you do not have is a **field-level map** of Metro2 — the language furnishers actually speak when they update your tradeline. This book is for operators who lost Round 1 with generic templates and need contradictions that survive reinvestigation.

> Insider truth: bureaus rarely "investigate" the way consumers imagine. They route an Automated Credit Dispute Verification (ACDV) to the furnisher, who often rubber-stamps the existing Metro2 record. Your win comes from fields that cannot all be true at once.

---

## Chapter 1 — Metro2 in one page

Metro2 is the data format creditors and collectors use to report to Equifax, Experian, and TransUnion. Each tradeline is a bundle of **base segments** (account identity, balances, status) plus optional **K-segments** (special comments, payment history).

Your dispute is not about feelings. It is about **data integrity** under FCRA accuracy standards.

**Core segments you must screenshot before every round:**

- Base Account Segment (account number, ECOA code, account type)
- Account Status & Payment Rating
- 24-month (or 48-month) Payment History Profile
- Date Opened, Date Closed, Date of First Delinquency, Date of Last Activity
- Balance, Past Due, Credit Limit, High Credit

---

## Chapter 2 — Status vs Payment Rating contradictions

**Account Status** describes the overall state (Current, Closed, Charge-off, Collection). **Payment Rating** describes the worst recent performance code.

Classic contradiction: Status reads "Paid as agreed" or "Current" while the 24-month grid shows consecutive **3, 4, 5** late codes (30/60/90+ days).

**Dispute scaffold:**

1. Quote the exact status field from your screenshot (Exhibit A).
2. Quote the payment grid months that conflict (Exhibit B).
3. Single claim: reporting is **internally inconsistent** and must be corrected or deleted.
4. Request **method of verification** identifying which field the furnisher considers authoritative.

---

## Chapter 3 — Payment history grid decoder

| Code | Meaning | Dispute angle |
| --- | --- | --- |
| 0 | Current | Conflicts with charge-off status |
| 1–2 | 30–59 days late | Conflicts with "never late" remarks |
| 3–5 | 60–120+ days late | Must align with DOFD timeline |
| 7 | Charge-off | Conflicts with "Current" status |
| 9 | Collection | Must align with collection agency name |
| X | No data | Gaps can indicate incomplete reporting |
| B | Bankruptcy | Must match public record if present |

**Exercise:** Pull one derogatory tradeline. Mark every month in the last 24 with its code. Circle any month that contradicts the status field or remarks.

---

## Chapter 4 — K-segments & special comments

K-segments carry narrative remarks — "account closed by consumer," "dispute resolved," "affected by natural disaster." These remarks frequently **contradict** status codes or dates.

**High-ROI patterns:**

- "Paid charge-off" with non-zero past due balance
- "Account transferred" without chain-of-title documentation
- "Dispute resolved — consumer disagrees" while negative data remains

Never dispute the remark alone. Tie the remark to the conflicting numeric field.

---

## Chapter 5 — Cross-bureau field drift

The same account often reports differently across EXP/EQF/TUC. Drift is not random — it is **sync failure** between furnisher batches.

**Drift audit worksheet (per account):**

1. List Account Status on each bureau.
2. List DOFD on each bureau.
3. List Balance and Past Due on each bureau.
4. Flag any field with 2+ distinct values.

Dispute each bureau separately with exhibits showing sibling-bureau contradictions. Do not merge bureaus in one letter.

---

## Chapter 6 — Balance / Past Due / High Credit traps

**Trap A:** Balance $0, Past Due $1,400 — mathematically inconsistent for a closed account.

**Trap B:** High Credit $500, Balance $12,000 on a revolving line — limit field wrong or account misclassified.

**Trap C:** Collection balance increases without new activity — possible re-aging signal (see Volume 09).

Attach calculator-style exhibit: show the arithmetic impossibility in plain language.

---

## Chapter 7 — ECOA & account type mismatches

ECOA codes identify responsibility: individual, joint, authorized user, etc. Account Type identifies product: revolving, installment, open, collection.

Mismatch example: ECOA "Authorized User" with collection status on an account you never opened — identity and furnisher chain issue.

---

## Chapter 8 — One-claim letter architecture

**Round 1 template logic (not copy-paste):**

- Paragraph 1: Identity + account identifier + bureau.
- Paragraph 2: ONE contradiction described with exhibit references.
- Paragraph 3: Legal basis label (inaccurate/incomplete/unverifiable) + request investigation.
- Paragraph 4: Method of verification request + deadline.

If you need three contradictions, mail three letters on three dates — not one shotgun letter.

---

## Chapter 9 — Evidence labeling for Metro2 disputes

Prefix exhibits: \`[BUREAU]_[CREDITOR]_Metro2_[FIELD]_[YYYY-MM-DD].png\`

Include zoom crops of the conflicting fields — not 40-page full reports. Reviewers spend 8 seconds on your package.

---

## Chapter 10 — When Metro2 forensics fails

Some accounts are accurately negative. Forensics is not a deletion machine — it is an **integrity filter**.

If fields align internally, pivot to:

- Pay-for-delete negotiation (collection)
- Goodwill adjustment (rare, relationship-driven)
- Time-based decay while building positives elsewhere

---

## Chapter 11 — Finely Cred workflow integration

1. Upload report → structured tradeline cards.
2. Flag contradictions automatically where possible.
3. Human selects ONE field conflict → letter studio.
4. Store exhibits in Documents vault per bureau branch.
5. Parse bureau response → new branch, never merge.

---

## Chapter 12 — Operator checklist

- [ ] Screenshot all Metro2 fields before Round 1
- [ ] Decode 24-month grid on paper
- [ ] Run cross-bureau drift worksheet
- [ ] One claim per letter per bureau
- [ ] Method of verification on every Round 2+

---

*Educational only. Not legal advice. Metro2 specifications change — verify current CRA/furnisher guidelines.*
`,

  [NICHE_BOOK_SLUGS.eoscarProtocols]: `# e-OSCAR & Furnisher Protocols Decoded

## The plumbing nobody explains

When you mail a dispute to Experian, your letter does not sit on a desk. It enters **e-OSCAR** — the electronic system connecting Consumer Reporting Agencies (CRAs) to data furnishers. Understanding this plumbing explains why you receive "verified" in 5 days and what to do next.

---

## Chapter 1 — ACDV lifecycle

**ACDV** = Automated Credit Dispute Verification. Flow:

1. CRA receives your dispute.
2. CRA converts it to ACDV format (Field tags, account selectors).
3. Furnisher has **~5 business days** to respond (industry standard; timelines vary).
4. Furnisher returns code: verified, updated, deleted, or no match.

Your job: force the furnisher to choose **updated** or **deleted** by narrowing the claim to a field they cannot defend.

---

## Chapter 2 — Response code decoder

| Code pattern | What it usually means | Your next move |
| --- | --- | --- |
| Verified | Furnisher affirmed existing Metro2 | Method of verification + field-level rebuttal |
| Updated | Something changed | Re-screenshot — new contradiction branch |
| Deleted | Tradeline removed | Archive proof; stop disputing |
| No match | Furnisher cannot locate account | Identity mismatch or wrong account number — fix selector |

> "Verified" does not mean "we sent investigators." It means the furnisher responded affirmatively through e-OSCAR.

---

## Chapter 3 — Direct furnisher path

You may dispute directly with the furnisher under FCRA §623. Triggers:

- CRA path yields repeated verified with zero field changes
- Ownership/identity dispute (account not yours)
- Duplicate tradeline after sale to collector

Direct path creates a separate paper trail — use portal timeline to avoid mixing CRA and furnisher branches.

---

## Chapter 4 — Furnisher reinvestigation vs CRA reinvestigation

CRA reinvestigation = CRA duty under §611. Furnisher reinvestigation = furnisher duty under §623 when they receive indirect or direct disputes.

**Insider note:** Many furnishers auto-confirm Metro2 without human review unless your claim cites specific field tags.

---

## Chapter 5 — Documentation that survives audit

Furnishers must maintain reasonable procedures. Your exhibits should show:

- Which field is wrong
- Why the current Metro2 record is impossible
- What correct data should be (if known)

Avoid legal threats in Round 1 — they trigger template responses.

---

## Chapter 6 — e-OSCAR limitations you can exploit

- Furnishers batch responses — timing gaps create temporary inconsistencies across bureaus.
- Updated on one bureau may lag others — re-pull all three after any update.
- No-match responses sometimes delete on one bureau while siblings remain — dispute siblings with the no-match proof.

---

## Chapter 7 — CFPB escalation with e-OSCAR context

CFPB complaints work when you attach:

- Mail log + CRA response
- Specific ACDV outcome ("verified" without field change)
- Exhibit showing ongoing inaccuracy

Generic "they won't delete" complaints close quickly.

---

## Chapter 8 — Finely operator playbook

Track dispute channel (CRA vs furnisher) per branch. Never assume one deletion propagates — verify tri-bureau.

---

*Educational only. Not legal advice.*
`,

  [NICHE_BOOK_SLUGS.reagingDofd]: `# Re-Aging & DOFD Warfare

## Dates are weapons — and traps

The **Date of First Delinquency (DOFD)** anchors the 7-year negative reporting window for most items. Re-aging occurs when collectors or furnishers shift dates to keep negative items alive. This volume teaches date-field audits consumers never learn from score apps.

---

## Chapter 1 — DOFD vs Date Opened vs Date Closed

| Field | Purpose | Common error |
| --- | --- | --- |
| Date Opened | Account origination | Confused with DOFD on collections |
| DOFD | Start of delinquency leading to charge-off | Reset illegally on partial payments |
| Date Closed | Account closure | Missing on active collections |
| Date of Last Activity | Last furnisher update | Used inconsistently across bureaus |

**Timeline exercise:** Draw a horizontal line. Place each date. If DOFD comes after charge-off date, you have a contradiction.

---

## Chapter 2 — Re-aging red flags

- Balance drops then DOFD jumps forward after small "good faith" payments.
- Collection account shows DOFD more recent than original creditor charge-off.
- Date of Last Activity updates without payment or status change.

Document with before/after screenshots stored in Evidence vault.

---

## Chapter 3 — 7-year window math

Most derogatory items report 7 years from DOFD — not from collection assignment date.

**Operator math:**

1. Identify DOFD on each bureau.
2. Add 7 years.
3. Compare to today — is reporting legally expired? (Educational analysis only — consult attorney for legal determinations.)

If expired but reporting continues, dispute category shifts to **obsolete reporting** research with counsel.

---

## Chapter 4 — SOL optics vs reporting

Statute of limitations (lawsuits) ≠ credit reporting period. Confusing them wastes disputes.

This book covers **reporting optics** only. Summons or lawsuit = attorney immediately.

---

## Chapter 5 — Multi-bureau DOFD mismatch playbook

When DOFD differs across bureaus for the same account:

1. Screenshot all three DOFD values (Exhibits A/B/C).
2. Dispute each bureau citing sibling inconsistency.
3. Request furnisher identify authoritative DOFD source.

---

## Chapter 6 — Payment restart traps

Some collectors argue partial payment "restarted" delinquency. Metro2 rules are nuanced — your dispute targets **inaccurate DOFD** with payment history grid evidence.

---

## Chapter 7 — Finely workflow

Tag tradelines with DOFD drift flag in case notes. Set calendar reminders for reporting fall-off dates.

---

*Educational only. Not legal advice.*
`,

  [NICHE_BOOK_SLUGS.ofacFraudMatrix]: `# OFAC & Fraud Alert Matrix

## When scores look fine but apps fail

You can have a 740 FICO and still get declined in seconds. **OFAC screens**, **fraud alerts**, and **identity mismatches** create silent blocks this volume maps.

---

## Chapter 1 — OFAC false positives

Office of Foreign Assets Control (OFAC) lists screen names during underwriting. Common names trigger false positives.

**Recovery path:**

- Confirm decline reason code if available
- Provide ID + clearance documentation lender requests
- Allow 48–72 hours for manual review queue

---

## Chapter 2 — Fraud alert types

| Alert | Duration | Effect |
| --- | --- | --- |
| Initial fraud alert | 1 year | Lenders must verify identity |
| Extended fraud alert | 7 years | Stricter verification |
| Active duty alert | 1 year | Military protection |

Plan application timing: alerts help security but slow approvals.

---

## Chapter 3 — Lift vs thaw vs unfreeze

**Credit freeze:** blocks new pulls until thawed per bureau.

**Fraud alert:** allows pulls but triggers extra steps.

Thaw all three bureaus 24–48 hours before mortgage or business funding pulls if frozen.

---

## Chapter 4 — Name / SSN / address cascades

Jr/Sr/II, hyphenated names, maiden names, and recent moves create **fragmented files**.

**Hygiene checklist:**

- [ ] Same legal name on apps as on ID
- [ ] Address history matches last 2 years of reports
- [ ] SSN typo scan on each bureau report

---

## Chapter 5 — Manual review recovery

When auto-decline triggers manual review, submit:

- Pay stubs / bank statements (if income verify)
- Utility bill for address
- Letter explaining name variants

Speed matters — reviewers work queues in order received.

---

*Educational only. Not legal advice.*
`,

  [NICHE_BOOK_SLUGS.depositScorecards]: `# Deposit Relationship Scorecards

## What bankers score that apps never show

Underwriters use credit bureaus **plus** internal bank scorecards. Relationship banking is not a slogan — it is a **scoring layer** this book exposes.

---

## Chapter 1 — The 90-day runway

Open business checking with your target lender **90+ days** before asking for credit. Deposits establish behavior patterns algorithms read.

---

## Chapter 2 — Average daily balance (ADB)

ADB matters more than one flashy deposit. Spikes followed by withdrawals signal instability.

**Discipline:**

- Maintain steady ADB relative to stated revenue
- Avoid NSF and overdraft cycles — 1 NSF can flag 6 months

---

## Chapter 3 — Deposit velocity & source of funds

Lenders watch for round-number Zelle-only "business" with no invoices. Paper trail: invoices, contracts, 1099 alignment.

---

## Chapter 4 — Warm handoff vs cold application

Relationship banker can flag file for manual review when they know your deposit story. Cold online apps hit algorithms without context.

**Script:** Schedule branch meeting; bring EIN letter, articles, 3 months statements.

---

## Chapter 5 — Personal vs business deposit separation

Mixing deposits confuses underwriters and can trigger fraud review. Pay yourself on schedule from business account.

---

## Chapter 6 — Recovery after NSF

If NSF occurs: deposit cover same day if possible, request fee reversal once, document explanation letter for future credit asks.

---

*Educational only. Not financial advice.*
`,

  [NICHE_BOOK_SLUGS.paydexGap]: `# Paydex vs Intelliscore Gap Analysis

## Two business scores, one confused owner

D&B **Paydex** and Experian **Intelliscore** measure different behaviors. Vendors report on different schedules. This gap kills applications that "should" approve.

---

## Chapter 1 — Paydex mechanics

Paydex (0–100) reflects **payment speed** to vendors reporting to D&B. 80+ = pays on time; 100 = pays early.

**Lag:** New vendor trades take 30–90 days to appear.

---

## Chapter 2 — Intelliscore Plus

Experian business score blends commercial tradelines, public records, and sometimes owner personal credit (BLENDED products).

A strong Paydex with weak Intelliscore means **Experian-side** gaps — not D&B problems.

---

## Chapter 3 — NAICS / SIC mismatch

Wrong industry code auto-declines tier-1 vendors. Pull D&B and Experian business reports — align NAICS before applications.

---

## Chapter 4 — Vendor sequencing by bureau

| Goal | Target bureau | Vendor type |
| --- | --- | --- |
| Paydex lift | D&B reporters | Net-30 office/industrial |
| Intelliscore lift | Experian reporters | Vendor credit cards |
| Both | Dual reporters | Research before apply |

Space applications 30+ days.

---

## Chapter 5 — Closing the gap — 90-day plan

**Days 1–30:** Fix entity data, open tier-1 vendor, pay early.

**Days 31–60:** Add second vendor on weak bureau side.

**Days 61–90:** Pull business reports, compare Paydex vs Intelliscore, then apply for revolving.

---

*Educational only. Not financial advice.*
`,

  [NICHE_BOOK_SLUGS.studentLoanOperator]: `# Student Loan Metro2 Operator Manual

## Why this volume exists

Student loans break every generic dispute template. Servicers report through specialized Metro2 paths — deferment codes, rehab statuses, transfer chains, and IDR payment fields that mortgage underwriters read differently than card issuers. This manual is for operators who need **field-level** precision, not "please delete my loans" letters.

---

## Chapter 1 — Federal vs private reporting lanes

**Federal loans** (Direct, FFEL legacy) often route through servicers with batch monthly updates. **Private loans** behave more like standard installment tradelines but still carry servicer-specific remark codes.

| Signal | Federal pattern | Private pattern |
| --- | --- | --- |
| Status during deferment | Often "Deferred" remark | May show "Current" with $0 due |
| Default recovery | Rehab / consolidation paths | Charge-off → collection possible |
| Transfer | New tradeline + old "closed/transferred" | Same |

Always tag tradeline type before drafting — one letter per servicer per bureau.

---

## Chapter 2 — Status code decoder

High-value contradictions:

- **"Current" + default remark** — cannot coexist without documented cure event
- **Past due amount on $0 balance rehab account** — field mismatch
- **Payment grid late codes during documented deferment** — attach deferment letter as Exhibit A
- **DOFD after origination without default narrative** — request method of verification

Screenshot all fields before Round 1. Student loan disputes often need Round 2 MOFV because servicers auto-confirm via e-OSCAR.

---

## Chapter 3 — Servicer transfer forensics

Navient → Aidvantage, FedLoan → MOHELA, etc. create:

1. Duplicate active tradelines (same loan ID family)
2. DOFD drift between old and new reporter
3. Balance double-count on DTI until one deletes

**Workflow:**

- Request full transfer history from servicer (written)
- List every furnisher name that ever reported
- Dispute duplicates as separate claims — never bundle unrelated loan IDs

---

## Chapter 4 — Rehabilitation & consolidation optics

**Rehab** removes default status but history may remain — know what *should* change:

- Default status → current or paid
- Collection sub-status removed if applicable
- Payment grid may still show historical lates (may be accurate)

**Consolidation** creates new loan — old tradeline should show paid/transferred. If both show active balances, that's a dispute angle.

Wait one full reporting cycle after rehab/consolidation before mortgage tri-merge.

---

## Chapter 5 — IDR, PAYE, SAVE payment fields

Mortgage underwriters may read:

- Reported payment amount
- Scheduled payment
- Actual IDR $0 payment certification

Mismatch blocks approval even at 740 FICO. Dispute inaccurate **payment amount** field with IDR documentation — not "delete my loan."

---

## Chapter 6 — Mortgage & auto funding interaction

**Before pre-approval:**

- Finish student loan field disputes that affect DTI
- Document deferment/forbearance end dates
- Remove duplicate tradelines from transfer errors

**Inquiry discipline:** student loan servicer "credit check" for consolidation counts — track in inquiry ledger.

---

## Chapter 7 — Round 2 MOFV for servicers

When CRA returns "verified" in 5 days:

> Identify the method of verification and documents reviewed for the payment amount and status fields reported.

Attach: prior response + unchanged screenshot + servicer correspondence.

Pivot furnisher-direct if two CRA verified responses with zero field movement.

---

## Chapter 8 — Finely Cred operator checklist

- [ ] Tag all student loan tradelines in case file
- [ ] One field conflict per letter per bureau
- [ ] Store servicer mail in Documents vault
- [ ] Task reminders at day 35 and day 45 post-mail
- [ ] Re-pull before funding apps

---

*Educational only. Not legal or financial advice. For federal program eligibility consult official servicer channels.*
`,

  [NICHE_BOOK_SLUGS.mortgageOverlayManual]: `# Mortgage Underwriter Overlay Manual

## Overlays are the hidden gate

Your FICO is the front door. **Investor overlays** are the deadbolt — rules that vary by lender, product (FHA/VA/Conventional), and even branch underwriter. This volume maps the overlays credit restore operators must clear **before** rate shopping.

---

## Chapter 1 — The 45-day inquiry shopping window

FICO treats mortgage/auto/student inquiries in a 14–45 day window (version-dependent) as one shopping event **if** same purpose code.

**Operator ledger:**

| Date | Lender | Bureau | Purpose | Count toward window? |
| --- | --- | --- | --- | --- |
| | | | | |

Space unrelated card apps outside mortgage window — they don't shop together.

---

## Chapter 2 — Dispute freeze rule

Many investors decline files with **open disputes** on tradelines appearing on tri-merge.

**Pre-approval sequence:**

1. Complete disputes or withdraw dispute flags
2. Wait one reporting cycle after resolution
3. Re-pull tri-merge
4. Then lock rate

Mid-process disputes delay closing 2–6 weeks — finish cleanup first.

---

## Chapter 3 — Collection & charge-off thresholds

Overlays often specify:

- No collections under $X (varies $500–$2000)
- No charge-offs in last 24 months
- Paid collections OK vs unpaid not OK

**Strategy:** settle or dispute inaccurate collections **before** LO submission — not after conditional approval.

---

## Chapter 4 — Authorized user overlay matrix

| Investor type | AU counts for history? | AU utilization counts? |
| --- | --- | --- |
| FHA (typical) | Sometimes ignored for DTI | Often ignored |
| Conventional (varies) | Case-by-case | Often yes |
| Portfolio | Relationship bank decides | Yes |

Remove AU from high-utilization cards before tri-merge if overlay requires.

---

## Chapter 5 — Utilization & statement timing

Underwriters see tri-merge snapshot — not your live app balance.

**90 days before app:**

- Calendar each card reporting date
- Target statement balance under 30% (10% for aggressive files)
- Avoid new accounts unless planned in inquiry budget

---

## Chapter 6 — Employment & asset verification

Overlays add layers beyond credit:

- VOE (verification of employment) timing
- Large deposit sourcing (gift letters, asset seasoning)
- Self-employed: 2-year tax return patterns

Credit cleanup without asset story still fails.

---

## Chapter 7 — Re-pull stabilization after deletions

Deleted tradelines don't instantly rebalance scores. Wait **one full cycle** (30–45 days) after deletion before expecting stable scores for lock.

Document deletion letters — LO may request proof disputes resolved.

---

## Chapter 8 — Conditional approval traps

Common late-stage failures:

- New credit inquiry after pre-approval
- Dispute opened mid-process
- Utilization spike on existing card
- Job change without disclosure

**Rule:** freeze credit behavior from pre-approval to closing.

---

## Chapter 9 — Finely workflow integration

- Tasks board: overlay checklist per client lane
- Documents: store tri-merge PDFs dated T-90, T-30, T-7
- Letter Studio: no new disputes during active mortgage pipeline

---

*Educational only. Overlays change frequently — verify with your LO for current investor guides.*
`,

  [NICHE_BOOK_SLUGS.auUnderwriterMatrix]: `# Authorized User Underwriter Matrix

## Piggyback is not one-size-fits-all

Authorized user (AU) tradelines can help utilization and age metrics — or trigger manual review when names don't match, limits look synthetic, or mortgage overlays ignore AU entirely. This matrix tells you **when to buy, when to remove, and when to build primary instead.**

---

## Chapter 1 — What AU actually reports

AU tradelines inherit:

- Payment history (sometimes)
- Credit limit / high balance
- Account age from primary open date
- **Not** contractual obligation — you're not the obligor

Issuers report AU status inconsistently across bureaus.

---

## Chapter 2 — FICO vs underwriting

FICO may include AU in score calculation (version/model dependent). **Underwriters** apply overlay rules that may exclude AU for:

- Payment history depth requirements
- DTI calculations
- Manual "synthetic file" review

Score went up ≠ mortgage approval guaranteed.

---

## Chapter 3 — Utilization inheritance risk

AU on a card with 90% utilization hurts even if you never swiped the card.

**Before funding:**

- Pull AU primary's reported balance
- Remove AU if utilization exceeds your target
- Wait one cycle for removal to reflect

---

## Chapter 4 — Combo ladders (12/18/21/24 month)

Resellers market age buckets. Underwriting cares about:

- Oldest tradeline date
- Average age of accounts
- Number of primaries vs AU mix

**Insider rule:** combos without primaries look thin to manual reviewers.

---

## Chapter 5 — Mortgage timing

Do **not** add AU tradelines within 6–12 months of mortgage application if:

- Overlay excludes AU from qualifying history
- File already has identity fragmentation
- Inquiry budget is exhausted

Primary secured path may be slower but cleaner.

---

## Chapter 6 — Auto & personal loan AU treatment

Auto lenders often weight **installment primaries** over AU revolving history.

AU on old high-limit card helps less than 12-month clean auto loan for certain captive lenders.

---

## Chapter 7 — Red flags that trigger review

- AU open date before your 18th birthday (impossible history)
- Address mismatch between AU and your identity
- Multiple AUs added same month from same reseller pattern
- AU limit $50k+ with no income story

---

## Chapter 8 — Primary-first alternative (90-day plan)

**Days 1–30:** Secured card, perfect payment

**Days 31–60:** Credit builder loan or second secured product

**Days 61–90:** Re-pull, evaluate AU need from deficit map

Slower — but survives underwriting scrutiny.

---

## Chapter 9 — Removal checklist before tri-merge

- [ ] List all AU tradelines on tri-bureau report
- [ ] Contact primary holder for removal (or dispute if unauthorized)
- [ ] Confirm removal on re-pull
- [ ] Screenshot before/after for LO file

---

*Educational only. Not financial advice. Tradeline products carry cost and compliance risk — verify before purchase.*
`,

  [NICHE_BOOK_SLUGS.chargeOffDeletionMath]: `# Charge-Off Challenge & Validation Warfare

## Finely Cred doctrine — challenge first, never pay as default

We **do not** default to paying charge-offs, collections, or settlements as a first option. We challenge on consumer-law terms: FCRA accuracy, FDCPA validation, UCC holder burden, state collector licensing, proper service, and chain of title.

Payment without validation waives leverage. This volume is for operators who want **dominion through documentation** — not fear-based paydown.

> Educational only — not legal advice. Consult licensed counsel for lawsuits, bankruptcy, foreclosure, or wage garnishment.

---

## Chapter 1 — The validation-first sequence

**Day 0–30:** FDCPA §809 validation letter (certified mail) upon first collector contact.

**Demand:** Original signed agreement, complete chain of assignment, itemized accounting, collector license in your state.

**Effect:** Collector must **cease collection** until validation — create paper trail before any payment conversation.

---

## Chapter 2 — Charge-off Metro2 challenges (not payment)

Dispute **fields**, not feelings:

- Status "charge-off" with current payment grid
- DOFD re-aged forward without default event
- Duplicate tradelines (original + collector both active)
- Balance past-due after alleged settlement

Cite **15 U.S.C. § 1681s-2(a)(1)(A)** — furnishers must report accurately.

---

## Chapter 3 — Collections: license, title, service

Before any pay discussion:

- Is collector licensed in your state?
- Can they produce chain of title from original creditor?
- Was account sold twice — duplicate reporting?

Challenge on **unverifiable** and **incomplete** — not "delete because I want."

---

## Chapter 4 — Summons before validation mail

If lawsuit arrives first:

- Calendar response deadline **immediately**
- File answer + **affidavit of dispute** (lack of valid contract)
- Assert validation never provided if FDCPA timeline applies
- Challenge **proper service** — defective service may void judgment

Consult attorney same week — procedure beats slogans.

---

## Chapter 5 — Wage garnishment & illegal collection patterns

Educational framework:

- Verify judgment exists and was properly entered
- Exemption laws vary by state (head of household, federal limits)
- Document FDCPA violations for pattern complaints
- Affidavit + timeline for CFPB/state AG escalation

---

## Chapter 6 — UCC & contract burden

**UCC § 3-308:** Party claiming right to enforce bears burden of proof.

Debt buyers often lack original note. Validation exposes gaps — **challenge**, don't pay to make fear stop.

---

## Chapter 7 — Bankruptcy & foreclosure lanes (overview)

When foreclosure or garnishment threatens:

- **Chapter 7** — discharge unsecured; lien treatment varies
- **Chapter 13** — repayment plan; may stop foreclosure if filed in time
- **Automatic stay** — powerful but requires licensed bankruptcy counsel

Credit reporting post-discharge: dispute **inaccurate** post-BK fields only.

---

## Chapter 8 — When payment is last resort only

Pay-for-delete or settlement **only after**:

1. Validation response reviewed and insufficient
2. Written contract specifying reporting outcome
3. Funding lane understood ("settled for less" remark optics)
4. 1099-C tax implications reviewed with CPA

Never verbal promises. Never pay without written agreement.

---

## Chapter 9 — Finely Cred operator workflow

- Debt & Summons Center → validation letter → certified mail receipt
- Documents vault → affidavit, court mail, collector responses
- Letter Studio → law-per-negative auto-citations
- Tasks → 30-day FDCPA clock, re-pull after field changes

---

*Educational only. Not legal or tax advice.*
`,
};
