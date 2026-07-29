import type { FreeGuide } from './freeGuides';
import { enhancePartnerGuides } from './fundabilityRoadmapGuideCopy';

/**
 * Core FREE_GUIDES bodies (excludes credit-dispute-letter-guide).
 * Full partner-facing education copy for PDF generation.
 */
const CORE_PARTNER_GUIDES_RAW: FreeGuide[] = [
  {
    id: 'primary-tradeline-insider',
    title: 'Primary Tradeline Insider',
    desc: 'Authorized user vs primary tradelines, timing, inquiry discipline, and how tradelines fit a broader restore plan — no hype. Results vary · not legal advice · funding subject to underwriting.',
    sections: [
      {
        heading: '1. What this guide is for',
        bullets: [
          'KEY: Primary vs AU mistakes waste money and delay funding — know which signal your next underwriter actually counts.',
          'Help partners decide whether primary tradelines, authorized-user (AU) lines, or neither fits their restore and funding plan.',
          'Separate marketing claims from what underwriters and scoring models typically weigh.',
          'Give you a checklist you can run before paying any reseller or stacking new accounts.',
          'KEY: This is education — not a promise of score jumps, approvals, or deletions.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '2. Primary vs authorized user (the real split)',
        bullets: [
          'Primary tradeline: you are the contractual obligor — your name is on the credit agreement and you are responsible for the debt.',
          'Authorized user (AU): you are permitted to use someone else\'s account; history may post to your file, but you are not the primary obligor.',
          'Many underwriters treat AU history as weaker signal than primary payment depth — especially for mortgage overlays and some auto lenders.',
          'Utilization optics can improve with a well-managed AU line; contractual creditworthiness usually still rests on primaries you own.',
          'TIP: Pull tri-bureau reports and mark each tradeline P (primary) or AU before you buy anything.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '3. How primaries actually land on a file',
        bullets: [
          'Issuers report on their own cadence — often monthly, commonly aligned to statement close rather than payment due date.',
          'Some accounts report to one bureau only; a "thick" file requires knowing which bureau each issuer feeds.',
          'New primaries can create short-term score pressure (hard inquiry + new account age hit) before they help — plan a 60-120 day runway.',
          'Realistic range: many partners reassess after one full reporting cycle (about 30-45 days) and again at 90 days — not the next morning.',
          'WARNING: Impossible open dates, mismatched addresses, or cloned account numbers are red flags — walk away.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '4. Bank-verified and seasoned claims',
        bullets: [
          '"Bank verified" in reseller copy usually means the seller claims a real deposit relationship — verify independently; do not trust screenshots alone.',
          'Underwriters may cross-check name, address, and sometimes identity consistency before treating a primary as fundable signal.',
          'Seasoning (account age) matters for average age of accounts and oldest tradeline — but age without clean payment history is incomplete.',
          'Ask: which bureau(s), expected post window, whether the line is primary or AU, and what happens if it fails to post.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '5. Installment vs revolving primaries',
        bullets: [
          'Revolving primaries (cards) affect utilization math; installment primaries (auto, personal loan) affect mix and payment history differently.',
          'A clean auto loan reported on-time for 12+ months can matter more than three brand-new revolving cards for certain auto lenders.',
          'Mortgage primaries are heavy signals but slow to build; do not use them as a quick-score tool.',
          'TIP: Match tradeline type to your next goal (cards vs auto vs mortgage vs business PG) instead of buying whatever is on sale.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. Timing and sequencing with disputes',
        bullets: [
          'Adding tradelines before dispute cleanup can mask — not fix — underlying file problems underwriters will still see.',
          'Finish high-impact accuracy work (wrong balances, DOFD errors, collection contradictions) before stacking new primaries when possible.',
          'Space new credit applications to avoid inquiry stacking — many partners use 30-45 days between hard pulls; 60-90 days is safer near mortgage shopping.',
          'Align tradeline strategy with utilization control: a new primary at 80% utilization can hurt more than it helps.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Inquiry discipline checklist',
        bullets: [
          'List every planned hard pull for the next 90 days before you add tradelines.',
          'Prefer soft pre-qual where available; treat hard pulls as a budget.',
          'Do not apply for five cards the week a new primary posts — you will not isolate what moved.',
          'Log inquiry name, bureau, date, and result in your portal case notes.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Risk-aware seller checklist',
        bullets: [
          'Verify seller reputation, reporting behavior, and account age claims independently (reviews alone are not enough).',
          'Request written terms: post window, refund if non-post, primary vs AU, bureau targets.',
          'Avoid anyone who promises a specific score outcome or approval.',
          'Document everything in your portal case log before you pay.',
          'WARNING: Promises of fixed FICO points or lender approval are marketing — not underwriting.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '9. When tradelines may help',
        bullets: [
          'Thin files sometimes benefit from additional positive history — after hygiene (identity, address, major errors) is stable.',
          'Business funding paths may weight primary business tradelines more heavily than AU personal lines.',
          'Partners rebuilding after cleanup may use primaries to rebuild average age and mix over months — not days.',
          'Talk with a Finely Cred Credit Specialist about fit before buying tradelines.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '10. When to skip or pause',
        bullets: [
          'Active identity theft, fraud alerts that block new credit, or unresolved public records that still block funding.',
          'Mid-mortgage underwriting — new tradelines can trigger re-pulls and delays.',
          'You cannot afford the account or do not understand the personal liability.',
          'Seller pressure tactics ("buy today or lose the slot") — pause and re-pull your own reports first.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '11. 90-day partner execution plan',
        bullets: [
          'Day 0: Tri-bureau pull; map existing primaries vs AU; screenshot open date, limit, status, payment grid.',
          'Days 1-14: Finish priority disputes; set utilization targets per card; freeze non-essential apps.',
          'Days 15-45: If still a fit, add at most one primary strategy; calendar expected post date.',
          'Days 45-90: Re-pull, verify fields match claims, then decide on funding apps — Results vary.',
          'Store all screenshots in Documents Vault with [BUREAU]_[CREDITOR]_[YYYY-MM-DD]_PRIMARY labels.',
        ],
      },
      {
        heading: '12. Partner quick checklist',
        bullets: [
          'I know which of my accounts are primary vs AU.',
          'I know my next funding goal and whether AU is even counted there.',
          'I have a 60-120 day runway before I need the file to look stable.',
          'I have written seller terms and a portal log entry before payment.',
          'I am controlling utilization and inquiries in the same window.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Decision rules partners actually use',
        bullets: [
          'If mortgage overlays discount AU: prioritize primary depth or skip AU purchases entirely.',
          'If funding is <60 days away: do not open a new primary that adds inquiry shock — stage util instead.',
          'If Metro2 contradictions remain on funding-critical accounts: dispute first, thicken later.',
          'If seller cannot name target bureau(s) and post window in writing: walk away.',
          'KEY: Match tradeline type to the next underwriting lane — not to a sale price.',
          'TIP: Reassess at day ~35–45 and again at ~90 — not the morning after payment.',
          'WARNING: Promises of fixed FICO points or guaranteed approvals are marketing — not underwriting.',
        ],
      },
      {
        heading: '13. Power moves inside Finely Cred',
        bullets: [
          '1) Map primaries vs AU on all three bureaus in Documents vault.',
          '2) Ask Finely to flag thin-file vs overlay risk before you buy anything.',
          '3) Freeze non-essential hard pulls in Tasks for 60–90 days.',
          '4) Book a session if a reseller promises fixed FICO points — walk that offer through a Credit Specialist first.',
          'KEY: Primaries thicken a fundable file; they do not erase Metro2 contradictions.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal or financial advice. Tradeline strategies carry risk — verify compliance and lender policies before acting.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'metro2-consistency-trap',
    title: 'Metro2 Consistency Map',
    desc: 'A high-signal field map for internal contradictions across status, dates, balances, and 24-month payment history — so partners dispute one clean claim at a time. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. The core idea',
        bullets: [
          'KEY: One internal contradiction + dated screenshots beats five emotional paragraphs every round.',
          'Metro2 is the common credit reporting format furnishers use. Your leverage is internal consistency: a file cannot be simultaneously true in all fields.',
          'Your job is not to argue feelings — it is to force validation of a clean, internally consistent record.',
          'One contradiction + screenshots + a narrow claim beats five emotional paragraphs.',
          'KEY: Isolate one contradiction per dispute branch per bureau.',
          'Worth it for partners who want a decisive next action — not another vague tip list.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '2. Status vs 24-month payment grid',
        bullets: [
          '"Current / Paid as agreed" should not coexist with recent derogatory payment codes without a clear explanation on the same tradeline.',
          'Collection or charge-off status with a clean recent grid needs documentation — screenshot both fields the same day.',
          'Cross-bureau: same account "current" on one bureau and "collection" on another is a classic consistency branch.',
          'TIP: Print or PDF the payment grid; circle the conflicting month codes before you draft.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '3. Date timeline checks',
        bullets: [
          'Date Opened should not be after Date of First Delinquency (DOFD) or Date Closed in a way that breaks chronology.',
          'Last Reported should be recent enough for an open account; stale "last reported" with new activity can be incomplete reporting.',
          'DOFD is critical for aging of negatives — a DOFD that resets (re-aging) without a new delinquency is a high-signal issue.',
          'Compare Date Opened across bureaus; multi-year mismatches often support an incompleteness claim.',
          'WARNING: Do not invent dates — only dispute what your screenshots show.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '4. Balance and limit math',
        bullets: [
          'Balance should not exceed credit limit / high credit without explanation (some products differ — note product type).',
          'Past Due should not exceed Balance on a simple revolving snapshot without supporting detail.',
          'High Balance vs Current Balance vs Credit Limit should tell one coherent story across bureaus.',
          'Zero balance with a past-due amount greater than zero is a frequent contradiction worth capturing.',
          'Realistic expectation: some updates fix one field and break another — re-check after every response.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '5. Account type vs responsibility',
        bullets: [
          'Account type (revolving, installment, collection, mortgage) should match how the account behaves in the payment grid.',
          'Responsibility (individual, joint, authorized user) should match your knowledge and any contract you have.',
          'Collection accounts listing an original creditor that conflicts with the collector name need a paper trail.',
          'TIP: If you are AU on the account, say so — do not claim primary ownership errors you cannot support.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. Cross-bureau consistency map',
        bullets: [
          'Build a one-page table: Account | Equifax field | Experian field | TransUnion field | Conflict?',
          'Prioritize conflicts that change status, DOFD, balance, or ownership — not cosmetic spelling alone.',
          'Same creditor, different account numbers across bureaus may be duplicates or splits — document both.',
          'Never mix three bureaus into one letter; keep one bureau branch per mail packet.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Evidence capture standard',
        bullets: [
          'Capture conflicting fields with full tradeline context (not cropped mystery numbers).',
          'Store in Documents Vault / Evidence Vault with [BUREAU]_[CREDITOR]_[YYYY-MM-DD]_CONFLICT.',
          'Keep a case log line: claim in one sentence + exhibit filenames.',
          'Re-screenshot after each bureau response — the baseline changes.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. How to phrase the claim',
        bullets: [
          'Lead with: inaccurate, incomplete, or unverifiable — pick the best fit for the contradiction.',
          'State the two (or more) fields that cannot both be true, with dates of your report pull.',
          'Request reinvestigation and, when appropriate, method of verification for the furnisher process.',
          'Avoid threats, slogans, or unrelated statutes in the first round — stay field-level.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. Execution cadence',
        bullets: [
          'Round 1: one claim, minimum exhibits, certified mail with tracking.',
          'On response: open a new branch — do not paste old exhibits that no longer match the updated tradeline.',
          'If verified with no field change, tighten evidence and consider method-of-verification follow-up.',
          'If updated, re-run the full consistency map — updates often create new contradictions.',
          'Realistic range: CRA reinvestigation windows are commonly discussed around 30 days (plus mailing time) — track your calendar; do not assume overnight results.',
        ],
      },
      {
        heading: '10. Partner field checklist (print this)',
        bullets: [
          'Status vs 24-month grid consistent?',
          'Opened / DOFD / Closed / Last Reported form a sane timeline?',
          'Balance / Past Due / High Credit / Limit coherent?',
          'Type + responsibility match reality?',
          'Cross-bureau conflicts listed in a table?',
          'One claim per letter; exhibits labeled?',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Insider field pairs that win rounds',
        bullets: [
          'Status "current" + recent charge-off or collection codes in the payment grid.',
          'DOFD newer than charge-off / collection open with no new delinquency event.',
          'Past due > balance on a simple revolving snapshot.',
          'Responsibility AU on your knowledge vs individual on the bureau — only dispute if true.',
          'KEY: Quote both fields with pull dates — "as you can see here on [bureau]…"',
          'WARNING: Emotional "delete everything" letters burn the same 30-day clock as precise ones.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Build a three-bureau conflict table and upload it to Documents vault.',
          '2) Ask Finely: “Which contradiction should be Round 1 on Equifax only?”',
          '3) Draft the one-claim letter in Letter Studio; mail certified; Task Day 35.',
          '4) On “updated,” re-run the full map — do not celebrate until fields agree.',
          'TIP: Watch how after your first upload if you are new to exhibit labeling.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. Credit reporting outcomes vary by facts, furnisher, and bureau process.',
          'COMPLIANCE: Results vary · not legal advice.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'bureau-response-decoder',
    title: 'Bureau Response Decoder',
    desc: 'Translate bureau language into next actions: reinvestigation, verification requests, escalation, and clean follow-up timing. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. How to use this decoder',
        bullets: [
          'KEY: Bureau letters are branch labels — match each outcome to one next action, not a shotgun follow-up.',
          'Read the bureau response as a branch label — not a final verdict on your life.',
          'Match the response type to one next action; avoid shotgun follow-ups.',
          'Always re-pull or re-screenshot the tradeline after a response before you write again.',
          'KEY: One bureau, one item, one claim lineage — never merge branches.',
          'Worth it for partners who want a decisive next action — not another vague tip list.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '2. Verified as accurate',
        bullets: [
          'Meaning: the CRA says the furnisher confirmed the data (or the CRA process closed as verified).',
          'Next action: request method of verification; ensure your evidence still matches the live tradeline.',
          'Tighten the claim to a single field contradiction with dated screenshots.',
          'If the response is boilerplate with no engagement of your exhibits, document that for escalation.',
          'TIP: Do not send the same letter again unchanged — change the claim precision or exhibits.',
        ],
      },
      {
        heading: '3. Updated / information modified',
        bullets: [
          'Treat as a new baseline — something changed; your old screenshots may be stale.',
          'Re-run Metro2 consistency checks across status, dates, balances, and payment grid.',
          'Ask: did the update fix your claim, create a new contradiction, or change nothing material?',
          'If material error remains, open a new dispute branch with fresh exhibits.',
          'Realistic range: partners often wait one reporting cycle (about 30 days) after an update before funding applications.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '4. Deleted / removed',
        bullets: [
          'Archive the response PDF and a post-deletion screenshot of the file section.',
          'Update your case log: item, bureau, date deleted, exhibit IDs.',
          'Avoid reintroducing the tradeline via sloppy future disputes or confirm-all-accounts online portals.',
          'Check the other two bureaus — deletion on one does not auto-clear the others.',
          'KEY: Celebrate in the log, then protect the win with clean future mail.',
        ],
      },
      {
        heading: '5. Frivolous or irrelevant',
        bullets: [
          'Usually means the CRA claims your dispute was not specific enough or lacked a factual basis they will process.',
          'Next action: rewrite with one concrete inaccuracy, attach only the minimum proof, and resubmit.',
          'Remove slogans, UCC myths, and multi-item laundry lists from the packet.',
          'WARNING: Repeating an identical frivolous packet can burn goodwill and delay real claims.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. No response / late response',
        bullets: [
          'Track sent date, delivery date (USPS), and response due window on a calendar.',
          'Confirm the mailing address and that identity documents were included if required.',
          'Prepare a polite status inquiry with tracking proof before jumping to regulators.',
          'If timelines are exhausted with no substantive response, escalate with a clean packet (see section 9).',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Partial wins and mixed results',
        bullets: [
          'One field fixed, another wrong: open a new branch on the remaining error only.',
          'Balance updated but DOFD still wrong: prioritize the field that controls aging or underwriting.',
          'Do not restart from zero emotionally — inherit the evidence set that still applies.',
          'TIP: Keep a before/after table in your portal notes for every mixed result.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Timing discipline',
        bullets: [
          'Maintain one timeline per bureau per item: sent / delivered / response / next action.',
          'Do not shotgun five weak claims the week a strong claim is pending.',
          'Freeze non-essential credit applications while a material dispute is mid-flight if underwriting is near.',
          'Realistic cadence: many partners work in 30-45 day loops per bureau branch — plan life events around that.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. Escalation ladder (when letters stall)',
        bullets: [
          'Step 1: Method of verification / tightened reinvestigation with fresh exhibits.',
          'Step 2: Direct furnisher dispute with the same field-level claim (keep CRA and furnisher tracks labeled).',
          'Step 3: CFPB complaint with chronology and PDFs attached — factual, calm, exhibit-driven.',
          'Step 4: State AG consumer division when you have a clear pattern and complete file.',
          'WARNING: Escalation without a clean chronology often fails — organize first.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '10. Partner response action table',
        bullets: [
          'Verified -> method of verification + tighter claim.',
          'Updated -> new baseline + consistency rematch.',
          'Deleted -> archive + protect + check other bureaus.',
          'Frivolous -> one claim, minimum proof, rewrite.',
          'Silence -> calendar + status inquiry + escalate with packet.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Decision tree after every CRA letter',
        bullets: [
          '1) Re-screenshot the live tradeline before drafting anything.',
          '2) Classify outcome (verified / updated / deleted / frivolous / silence).',
          '3) Choose one next action only — MOFV, new branch, archive, rewrite, or escalate.',
          '4) Update Tasks + Documents vault the same day the letter arrives.',
          '5) Freeze non-essential apps if the item is funding-critical.',
          'TIP: Partial wins still need a before/after table — mixed results create new contradictions.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Tag each CRA letter Verified / Updated / Deleted / Frivolous / Silence in the dispute case.',
          '2) Ask Finely to draft the next-branch outline — you edit facts before mail.',
          '3) Keep EXP / EQF / TUC timelines separate in Tasks.',
          '4) Escalate to CFPB only with a chronology + exhibits from Documents vault.',
          'KEY: Response type chooses the next action — emotion does not.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. Bureau processes and outcomes vary.',
          'COMPLIANCE: Results vary · not legal advice.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'collections-proof-pack',
    title: 'Collections Proof Pack Checklist',
    desc: 'The documentation stack that prevents he-said/she-said disputes — what to upload, how to label it, and how to reuse it across bureau and collector tracks. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. Why a proof pack beats memory',
        bullets: [
          'KEY: Collectors and bureaus respond to labeled exhibits — not memory. Build the pack once; reuse for months.',
          'Collectors and bureaus respond to documents, dates, and field contradictions — not recollections.',
          'A reusable pack lets you answer validation, CRA disputes, and (if needed) counsel from one folder.',
          'Partners who label once reuse the same exhibits for months without rebuilding chaos.',
          'KEY: If you cannot explain a file in five seconds, it is mislabeled.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '2. Identity layer (minimum)',
        bullets: [
          'Government photo ID (current).',
          'Proof of address dated within the last 30-90 days (utility, bank, lease).',
          'Any name-variation note (maiden name, Jr/II) if reports show aliases.',
          'TIP: Redact full SSN on copies you upload to portals; use last-4 only when required.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '3. Account chronology layer',
        bullets: [
          'Original creditor statements or bills if you have them.',
          'Collector letters (first notice, validation responses, settlement offers) — every page.',
          'Your outbound letters with certified mail receipts and tracking pages.',
          'Bureau responses tied to this item (PDF + screenshots).',
          'Payment records if any payment was ever made — never guess amounts.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '4. Bureau screenshot layer',
        bullets: [
          'Full tradeline: status, balance, past due, high credit, dates, original creditor.',
          '24-month payment history grid.',
          'Any cross-bureau inconsistency captured the same week.',
          'Inquiry list if the collector or creditor appears as a pull.',
          'WARNING: Cropped mystery snippets waste rounds — capture context.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '5. Validation / chain-of-title layer',
        bullets: [
          'Your written validation request (FDCPA context for collectors) with send date.',
          'Their response — or written note that none arrived by your calendar date.',
          'Any assignment, bill of sale, or affidavit they produce (even if incomplete).',
          'Itemization of principal, interest, fees if provided.',
          'TIP: "We cannot locate" responses still belong in the pack — they are evidence.',
        ],
      },
      {
        heading: '6. Labeling rules (non-negotiable)',
        bullets: [
          'Prefix: [BUREAU_OR_COLLECTOR]_[CREDITOR]_[YYYY-MM-DD]_[TYPE].pdf/png',
          'TYPE examples: ID, ADDR, LETTER_OUT, LETTER_IN, SCREEN_EF, SCREEN_EX, SCREEN_TU, VALIDATION, CMS_RECEIPT.',
          'Never upload random.pdf or IMG_4521.jpg as the final name.',
          'One exhibit = one concept; do not merge five letters into one unlabeled PDF.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Folder structure partners use',
        bullets: [
          '00_Identity',
          '01_Chronology_Letters',
          '02_Bureau_Screens',
          '03_Validation_Chain',
          '04_Mail_Tracking',
          '05_Responses_And_Wins',
          'Mirror the same folders in your Finely Cred Documents Vault when possible.',
        ],
      },
      {
        heading: '8. Reuse rules across tracks',
        bullets: [
          'CRA dispute: attach only exhibits that prove the reporting contradiction.',
          'Collector validation: attach identity + your validation letter + their gaps — not every bureau screenshot unless relevant.',
          'Escalation (CFPB/AG): attach the chronology index + key PDFs, not a 200-page dump without a cover list.',
          'KEY: Minimum necessary evidence wins clarity contests.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. 14-day build sprint',
        bullets: [
          'Days 1-2: Identity + address proofs uploaded and labeled.',
          'Days 3-5: Tri-bureau screenshots for the collection item.',
          'Days 6-8: Scan all collector letters; build chronology index (date | from | summary).',
          'Days 9-11: Draft validation or CRA claim using only pack exhibits.',
          'Days 12-14: Certified mail + log tracking numbers in portal Tasks.',
        ],
      },
      {
        heading: '10. Partner readiness checklist',
        bullets: [
          'Identity + address current and labeled.',
          'Chronology index exists (even a one-page table).',
          'Screenshots show status, dates, balances, and grid.',
          'Mail tracking stored for every outbound letter.',
          'I know whether today\'s letter is CRA track or collector track.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Collector vs CRA pack slices',
        bullets: [
          'CRA slice: identity + conflicting Metro2 screenshots + prior CRA response if Round 2.',
          'Validation slice: first collector letter + your validation request + their gaps + itemization asks.',
          'Escalation slice: one-page chronology + tracking + 3–7 key PDFs — not a 200-page dump.',
          'KEY: Minimum necessary exhibits win clarity contests.',
          'TIP: "We cannot locate" replies are exhibits — vault them.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Mirror the 00–05 folder structure inside Documents vault today.',
          '2) Ask Finely: “Build a chronology index from these collector PDFs.”',
          '3) Link the pack to both CRA and validation Tasks — one source of truth.',
          '4) Book a session before settlement talks if validation is incomplete.',
          'WARNING: Paying without a written agreement and a complete pack is how partners lose leverage.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. If you receive a summons or court deadline, contact a licensed attorney in your jurisdiction immediately.',
          'COMPLIANCE: Results vary · not legal advice.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'permissible-purpose-scriptbook',
    title: 'Permissible Purpose Scriptbook',
    desc: 'Practical templates and tracking rules for disputing inquiries you do not recognize — by bureau process and response handling. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. Permissible purpose in plain English',
        bullets: [
          'KEY: Hard inquiries you do not recognize need narrow authorization claims — soft promo pulls usually waste dispute energy.',
          'Hard inquiries generally require a permissible purpose — often tied to a credit application or consent you gave.',
          'Soft inquiries typically do not affect scores — do not spend dispute energy on promo soft pulls you authorized.',
          'This guide focuses on hard inquiries you do not recognize or did not authorize.',
          'KEY: Do not invent fraud claims. Stick to authorization and documentation.',
          'Worth it for partners who want a decisive next action — not another vague tip list.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '2. Build your inquiry inventory',
        bullets: [
          'List: Inquiry name | Date | Bureau | Soft/Hard | Do I recognize? (Y/N/Unsure).',
          'Pull all three bureaus — the same pull may not appear everywhere.',
          'Group duplicates (same lender, same day) vs truly unknown names.',
          'TIP: Screenshot the inquiry section with the pull date visible.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '3. Core claim language (keep it narrow)',
        bullets: [
          'Script A: "I do not recall authorizing this inquiry. Please provide the permissible purpose for this pull or remove it."',
          'Script B: "I did not apply for credit with this company on or about [date]. Please investigate and delete if no permissible purpose exists."',
          'Script C (duplicate): "This appears to be a duplicate hard inquiry for a single application. Please review and remove the duplicate entry."',
          'Avoid long life stories — authorization and purpose are the claim.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '4. CRA dispute path (step-by-step)',
        bullets: [
          '1. Pick one bureau and one inquiry (or one clear duplicate set).',
          '2. Attach identity proof and the inquiry screenshot.',
          '3. Use Script A or B; mail certified with tracking.',
          '4. Log sent/delivered dates in your portal timeline.',
          '5. On response, decode: deleted, verified, or updated — then branch.',
          'Realistic range: plan on multi-week cycles including mail time; Results vary.',
        ],
      },
      {
        heading: '5. Direct furnisher / lender path',
        bullets: [
          'Some inquiries clear faster when the lender deletes the pull record at the source.',
          'Call or write the creditor credit bureau / underwriting contact with your claim and application denial or non-application proof if you have it.',
          'Keep a phone log: date, agent, summary, reference number.',
          'TIP: Use the furnisher path for same-lender duplicate pulls the same day.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. When the inquiry is legitimate',
        bullets: [
          'If you applied, the inquiry usually remains until it ages off scoring models (commonly discussed around 12 months of heavier impact, longer on the report).',
          'Shift to explanation letters for mortgage files instead of removal theater.',
          'WARNING: Fabricating identity theft for a pull you caused creates legal exposure.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'TIP: Log the action and exhibit filenames in portal case notes before you move to the next branch.',
        ],
      },
      {
        heading: '7. Response handling scripts',
        bullets: [
          'Deleted: archive proof; check other bureaus; update inventory.',
          'Verified: request documentation of permissible purpose; consider furnisher path + tighter CRA follow-up.',
          'No response: calendar follow-up; then escalate with chronology (CFPB) if warranted.',
          'Frivolous: resubmit with one inquiry, one screenshot, one sentence claim.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Partner phone script (optional)',
        bullets: [
          '"Hello, I am calling about a hard inquiry on my [bureau] report dated [date] under the name [inquiry name]."',
          '"I do not recall authorizing a credit pull. Can you confirm whether an application exists and provide the permissible purpose?"',
          '"Please note my request reference and mail confirmation to [address]."',
          'Stay calm; take names; do not argue statutes on the phone — follow with written mail.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. Tracking sheet columns',
        bullets: [
          'Inquiry name · Date · Bureau · Letter sent · Tracking # · Response date · Outcome · Next action · Next eligible date.',
          'Treat each bureau separately; do not combine timelines.',
          'Freeze non-essential new apps while cleaning a dense inquiry cloud before funding.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '10. Partner checklist',
        bullets: [
          'Inventory complete across three bureaus.',
          'Soft vs hard separated.',
          'One claim per packet.',
          'Screenshots + ID labeled in the proof pack.',
          'No fabricated fraud language.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Inquiry decision rules',
        bullets: [
          'Soft / promo pulls you authorized: ignore for score work.',
          'Hard pulls you applied for: explanation letter for mortgage — not fake "not mine."',
          'Unknown hard pulls: one CRA claim per inquiry + identity pack.',
          'Same lender / same day duplicates: try furnisher-direct first.',
          'KEY: Authorization truth beats template volume.',
          'COMPLIANCE: Do not fabricate fraud claims for inquiries you caused.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Inventory hard inquiries across three bureaus; vault screenshots.',
          '2) Ask Finely to triage authorized vs unknown vs soft (ignore soft for score work).',
          '3) One inquiry per CRA packet; log tracking in Tasks.',
          '4) Use furnisher path for same-day duplicate pulls when that is faster.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. Inquiry disputes depend on facts and creditor records.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'utilization-sniper-rules',
    title: 'Utilization Control Rules',
    desc: 'How partners reduce score volatility: reporting dates, statement balance control, and what tends to look cleaner to underwriting. Results vary · not legal advice · funding subject to underwriting.',
    sections: [
      {
        heading: '1. Utilization in one sentence',
        bullets: [
          'KEY: Statement-close balances move scores and underwriting optics — due-date payments alone are not enough.',
          'Utilization is roughly balances divided by credit limits on revolving accounts — reported as of the issuer reporting snapshot, not always your due date.',
          'Scoring models and many underwriters watch both aggregate utilization and single-card spikes.',
          'KEY: Control the statement/reporting balance, not only the payment you make on the due date.',
          'Worth it for partners who want a decisive next action — not another vague tip list.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '2. Statement close vs due date',
        bullets: [
          'Most issuers report a balance near statement close — paying on the due date helps interest, not always the reported snapshot.',
          'Map each card: statement close date | due date | typical report lag (often a few days after close).',
          'Partner tactic: pay down 2-5 days before statement close on cards you care about for the next pull.',
          'TIP: Autopay minimum for late-fee protection + manual paydown before close for utilization control.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '3. Target ranges (realistic, not magic)',
        bullets: [
          'Many partners aim for under ~30% aggregate on revolvers before important applications.',
          'Single-card spikes above ~50-70% can still hurt optics even if aggregate looks fine.',
          'All zeros on every card can look inactive to some models — a small reported balance on one card is a common building pattern.',
          'Results vary by model, issuer, and file; treat ranges as planning bands, not promises.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '4. Sniper calendar setup',
        bullets: [
          'Create a 90-day calendar with each card statement close.',
          'Color-code: green = paydown week, amber = do not swipe heavy, red = hard-pull freeze near funding.',
          'Align big purchases after close if you need a clean snapshot for a known underwriting date.',
          'Re-pull 7-14 days after a coordinated paydown cycle to confirm reporting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '5. Aggregate vs per-card tactics',
        bullets: [
          'If one card is high, either pay it down or shift spend temporarily — do not ignore the spike.',
          'Requesting credit limit increases can lower utilization math — but may involve a hard pull; ask first.',
          'Opening a new card to fix utilization adds inquiry + new account age effects — net math is not always positive short-term.',
          'WARNING: Manufactured spend / cycling schemes can violate cardholder agreements — stay within normal use.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. Building vs funding modes',
        bullets: [
          'Building mode: keep light reported activity, on-time autopay, avoid maxing new lines.',
          'Funding mode (30-45 days pre-app): drive aggregate and spike cards into your target band; freeze new hard pulls.',
          'Dispute mode: finish material reporting errors before you read too much into score swings from utilization alone.',
          'TIP: Pick one mode for the next 30 days — mixed modes create confusing data.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Business cards and PG notes',
        bullets: [
          'Some business cards report to personal files when a personal PG is attached — know where yours report.',
          'Business utilization can matter for vendor and LOC underwriting even when personal scores look fine.',
          'Keep business spend on business cards; mixing muddies both optics and bookkeeping.',
          'COMPLIANCE: Funding subject to underwriting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Volatility troubleshooting',
        bullets: [
          'Score drop after payday shopping: check which card reported a spike.',
          'Score flat after big paydown: reporting lag — wait a cycle, then re-pull.',
          'One bureau moved, others did not: issuer may report unevenly — map per bureau.',
          'Realistic expectation: utilization changes can move scores within days to a few weeks after reporting — not always same-day.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. Partner weekly checklist',
        bullets: [
          'Which cards close in the next 7 days?',
          'Are paydowns scheduled 2-5 days before those closes?',
          'Any card above my personal spike threshold?',
          'Any hard pulls planned in the next 30 days?',
          'Did I log balances in the portal after the last re-pull?',
        ],
      },
      {
        heading: '10. Pre-application 14-day checklist',
        bullets: [
          'Aggregate utilization in target band on the bureaus that matter for this product.',
          'No single-card spike surprises on the last screenshots.',
          'No new hard pulls pending that you forgot about.',
          'Bank statements and income docs ready if underwriters will ask.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: 'Sniper ranges and decision rules',
        bullets: [
          'Building band: often aim aggregate revolvers under ~30%; avoid single-card spikes above ~50–70%.',
          'Funding band (30–45 days out): drive target cards into band before statement close; freeze hard pulls.',
          'All-zeros on every card can look inactive — a small reported balance on one card is a common pattern.',
          'CLI requests can lower util math but may hard-pull — ask issuer first.',
          'KEY: Statement close controls the snapshot; due date controls interest.',
          'WARNING: Manufactured spend / cycling can violate cardholder agreements.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Enter every statement close date into portal Tasks for the next 90 days.',
          '2) Ask Finely: “Which cards should I sniper-pay before my funding week?”',
          '3) Re-pull 7–14 days after a coordinated paydown; vault the before/after.',
          '4) Book a session if you are within 45 days of mortgage/auto apps.',
          'KEY: Control reported balances — due-date payments alone are not enough.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal or financial advice. Scoring models and lender policies change.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'business-sequence-ladder',
    title: 'Business Sequence Ladder',
    desc: 'A step-by-step blueprint for partners: entity + address hygiene, vendor stacking logic, and do-not-apply-yet red flags. Results vary · not legal advice · funding subject to underwriting.',
    sections: [
      {
        heading: '1. Foundation overview',
        bullets: [
          'KEY: Entity truth before vendor volume — most early denials are match failures, not "bad credit."',
          'Sequence matters: entity truth -> identity footprint -> bank history -> reporting vendors -> revolving business credit -> funding asks.',
          'Skipping steps wastes inquiries and trains underwriters to see chaos.',
          'KEY: Align Secretary of State, EIN, bank, phone, web, and bureau files before volume applications.',
          'COMPLIANCE: Funding subject to underwriting · Results vary.',
          'Worth it for partners who want a decisive next action — not another vague tip list.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '2. Entity correctness',
        bullets: [
          'Confirm LLC/Corp is filed and in good standing in your state.',
          'Legal name must match character-for-character across filings, bank accounts, and applications.',
          'Update registered agent and annual reports if outdated.',
          'TIP: Save stamped articles and good-standing certificate in your proof pack.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '3. EIN and tax standing',
        bullets: [
          'Obtain an EIN from the IRS if you do not have one; keep the CP 575 / EIN letter PDF.',
          'File required federal and state returns on time.',
          'Resolve tax liens before aggressive credit applications when possible.',
          'WARNING: Misrepresenting revenue or ownership crosses from optimization into fraud.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '4. Business address hygiene',
        bullets: [
          'Use a real, consistent business address across SoS, bank, and bureau files.',
          'Know which lenders reject pure virtual/home addresses for your product type.',
          'Suite numbers and formatting must match — Ste 200 vs Suite 200 can break auto-match.',
          'Document lease or mail policy if underwriters ask.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '5. Phone and web presence',
        bullets: [
          'Dedicated business phone (not only a personal cell) listed consistently.',
          'Simple website or landing page with entity name and contact paths.',
          'Google Business Profile / directory listings where appropriate.',
          'Email on your domain beats only free webmail for many tier-1 vendor optics.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. Business bank account',
        bullets: [
          'Open checking in the exact legal name; keep personal funds separate.',
          'Maintain consistent deposits; avoid NSF/overdraft patterns.',
          'Realistic range: many partners wait 3-6 months of clean history before heavier funding asks.',
          'TIP: Build relationship at the bank you may later ask for a LOC.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. D-U-N-S and bureau alignment',
        bullets: [
          'Register D-U-N-S if you plan a Dun & Bradstreet file / Paydex path.',
          'Check Experian Business and Equifax Business for ghost listings and name/address mismatches.',
          'Fix NAICS / industry and address errors before vendor volume.',
          'KEY: Many denials are match failures — the bureau never linked EIN to entity cleanly.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Vendor tier 1 — starter reporters',
        bullets: [
          'Start with net-30 / starter vendors known to report to business bureaus.',
          'Order small, pay on time or early; reporting often lags 30-45 days.',
          '2-3 starter vendors are enough to begin — do not apply to ten in one week.',
          'Log each approval, limit, and first report date in a vendor matrix.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '9. Vendor tier 2 — mid-tier',
        bullets: [
          'After roughly 60-90 days of on-time tier-1 payments, add mid-tier reporters.',
          'Prefer vendors that report to D&B and/or Experian Business.',
          'Keep utilization modest; pay before statement when you need clean optics.',
          'Space applications; track hard/soft pulls on business files too.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '10. Vendor tier 3 — higher limits',
        bullets: [
          'With several positive trades posting, consider higher-limit vendors.',
          'Maintain a mix of net-30 and revolving if available.',
          'Do not stack ten apps in 30 days — inquiry and desperation optics are real.',
          'Realistic range: thickness builds over months; plan 90-180 day ladders.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '11. Business credit cards',
        bullets: [
          'Apply after you have reporting trades and entity hygiene — not as step one.',
          'A personal PG is common for newer entities; understand personal exposure.',
          'Prefer cards that report to business bureaus when your goal is business file strength.',
          'Keep personal utilization controlled if PG links the risk.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '12. Funding paths — when to apply',
        bullets: [
          'LOC and term loans often prefer 12+ months of history for better terms — newer files face tighter boxes.',
          'Underwriters weigh revenue, cash flow, deposits, and bureau trades together.',
          'Sequence: vendors -> cards -> larger credit — not all at once.',
          'COMPLIANCE: Funding subject to underwriting · Results vary.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '13. Red flag — applying too early',
        bullets: [
          'Apps before address/phone/EIN/bank alignment waste pulls.',
          'Incomplete profiles signal risk even if the owner is skilled.',
          'Wait until identity footprint + at least early tradeline activity is in motion.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '14. Red flag — mixing personal and business',
        bullets: [
          'Mixing signals confuses underwriters and bookkeeping.',
          'Use business accounts for business expenses.',
          'Do not use SSN when EIN is required on the form.',
          'WARNING: Shelf entities without real activity are a red flag — do not misrepresent age or revenue.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '15. Red flag — weak documentation',
        bullets: [
          'Keep articles, EIN letter, bank statements, address proof, and vendor statements ready.',
          'Stale docs trigger manual review delays.',
          'Update the pack every quarter while you are in funding mode.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'TIP: Log the action and exhibit filenames in portal case notes before you move to the next branch.',
        ],
      },
      {
        heading: '16. Red flag — inquiry stacking',
        bullets: [
          'Too many applications in a short window can look desperate.',
          'Space apps by roughly 30-90 days when the file is new.',
          'Track who pulled what and when — duplicate pulls happen.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '17. Maintenance and scaling',
        bullets: [
          'Do not close old positive trades abruptly without a reason.',
          'Add credit in line with revenue and operational need.',
          'Re-check business bureau files at least yearly for errors.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'TIP: Log the action and exhibit filenames in portal case notes before you move to the next branch.',
        ],
      },
      {
        heading: '18. Troubleshooting denials',
        bullets: [
          'Request the reason for denial; address the specific mismatch before reapplying.',
          'Common fixes: address match, thin file, personal PG score, short deposit history.',
          'Wait a full cycle after fixes; reapplying weekly rarely helps.',
          'TIP: Keep a denial log: date | lender | reason | fix | next eligible date.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '19. Long-term partner practices',
        bullets: [
          'Pay trades on time or early — one late can hit a thin business file hard.',
          'Keep books and bank activity aligned with the story you tell lenders.',
          'Document everything; disputes and corrections are easier with proof.',
          'Revisit the ladder whenever you change entity name, address, or ownership.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '20. Partner milestone checklist',
        bullets: [
          'Entity + EIN + good standing documented.',
          'Phone, web, address consistent everywhere.',
          'Business bank 3-6 months clean (or on that path).',
          'D-U-N-S / business bureau match reviewed.',
          'Tier-1 vendors reporting; matrix updated.',
          'No inquiry stacking; funding apps sequenced.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Numbered partner ladder (print this)',
        bullets: [
          '1) Entity truth: SOS / EIN / bank / phone / address match character-for-character.',
          '2) Bureau footprint: D-U-N-S (if used) + ghost listings fixed; NAICS consistent.',
          '3) Tier-1 vendors: 2–3 reporting net-30s; pay early; max ~2 apps/month early stage.',
          '4) Revolving: first business card knowing PG exposure; util often under ~30% before LOC apps.',
          '5) Funding pack: 3–6 mo bank PDFs + ownership docs; soft-qualify then one hard ask.',
          'KEY: Many denials are match failures — fix the file before the ask.',
          'TIP: Upload every denial letter to Documents vault; it trains the next application.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: '21. Power moves inside Finely Cred',
        bullets: [
          '1) Complete the Business Credit OS fundability scorecard this week.',
          '2) Upload EIN + SOS + bank statements to Documents vault before Vendor A.',
          '3) Ask Finely for a Tier-1 spacing calendar matched to your entity state.',
          '4) Book a session before your first PG-backed business card if the personal file is mid-dispute.',
          'KEY: Entity truth → bureau match → vendors → revolving → funding — never reverse.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal or financial advice. Consult qualified professionals for entity, tax, and lending decisions.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'ucc-article-3-primer',
    title: 'UCC Article 3 Primer (Negotiable Instruments)',
    desc: 'A plain-language overview of what Article 3 covers — and what it does NOT do — so partners can spot misinformation fast. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. What this primer is (and is not)',
        bullets: [
          'KEY: Article 3 is about negotiable instruments — not a consumer bureau delete button or debt-discharge spell.',
          'This is an education filter for viral claims about UCC deleting debt or negotiable instrument magic.',
          'It helps partners ask clearer questions when a claim involves a note, draft, or enforcement rights.',
          'It is not a DIY lawsuit strategy and not a substitute for a licensed attorney.',
          'KEY: Article 3 is about negotiable instruments — not a consumer credit bureau delete button.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '2. What Article 3 actually covers',
        bullets: [
          'UCC Article 3 addresses negotiable instruments (for example: certain checks, promissory notes, drafts) under state-adopted UCC rules.',
          'Key vocabulary you will hear: holder, holder in due course, endorsement, negotiation, transfer, presentment, dishonor.',
          'Whether a particular writing is a negotiable instrument depends on its form and the facts — not on an internet slogan.',
          'TIP: When someone says your debt is a negotiable instrument, ask which document and which elements they mean.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '3. Ideas that matter when used correctly',
        bullets: [
          'Understanding who claims the right to enforce an instrument can sharpen questions in note-based disputes.',
          'Assignment and transfer paperwork still matter in the real world — courts look at documents and procedure.',
          'Article 3 concepts can appear in litigation about notes; they do not replace FCRA processes for credit report accuracy.',
          'Partners facing a lawsuit over a note should get jurisdiction-specific counsel immediately.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '4. What Article 3 does NOT do',
        bullets: [
          'It does not automatically erase credit card balances, collections, or mortgage debts by mailing a template.',
          'It does not force bureaus to delete tradelines because you stamped UCC on a letter.',
          'It does not replace FDCPA validation, FCRA reinvestigation, or court deadlines.',
          'WARNING: Treating Article 3 as a universal debt discharge tool is a common (and risky) myth pattern.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '5. Myth filter — quick rejects',
        bullets: [
          'UCC 1-308 removes debt -> incorrect; reservation of rights language is not a debt eraser.',
          'Send one affidavit and everything must be deleted -> not true; outcomes depend on facts, law, and procedure.',
          'All debts are negotiable instruments -> not necessarily; documents and elements matter.',
          'Secret Treasury account / strawman pays it -> not reliable legal guidance; see the Strawman guide.',
          'KEY: If a tactic claims it always works, treat it as a red flag.',
        ],
      },
      {
        heading: '6. Credit reporting path (use the right framework)',
        bullets: [
          'For inaccurate credit reporting: use FCRA/CRA processes — document inconsistencies, request reinvestigation, track timelines.',
          'For collector contacts: validation and documentation discipline matter under collection rules that may apply.',
          'Keep Metro2 field contradictions and proof packs in your portal — that is the durable path for report accuracy work.',
          'Do not mix UCC myth language into CRA dispute letters; it often triggers frivolous responses.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. When notes and assignments show up',
        bullets: [
          'Ask for the instrument, allonges/endorsements, and assignment chain if enforcement depends on a note.',
          'Incomplete chains are factual issues for counsel — not slogans for a bureau portal.',
          'Store every page produced (or refused) in your Collections Proof Pack.',
          'TIP: "We cannot produce the note" is still a loggable event.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '8. Safe education-first next steps',
        bullets: [
          '1. Identify whether your issue is reporting accuracy, collection validation, or a lawsuit — different tracks.',
          '2. Build a proof pack and chronology before adopting any advanced theory.',
          '3. If served with a summons, calendar the deadline and contact a licensed attorney the same week.',
          '4. Use this primer to reject magic claims and stay on documentable processes.',
          'Realistic expectation: document-driven processes take weeks to months; Results vary.',
          'TIP: Re-pull or re-screenshot after every material response before you draft the next letter or application.',
        ],
      },
      {
        heading: '9. Partner red-flag checklist',
        bullets: [
          'Does the tactic require claims I cannot prove?',
          'Does it discourage counsel when court deadlines exist?',
          'Does it promise universal deletion or discharge?',
          'Does it confuse UCC jargon with FCRA bureau procedure?',
          'If yes to any — pause and return to evidence-based steps.',
        ],
      },
      {
        heading: '10. Glossary (plain language)',
        bullets: [
          'Negotiable instrument: a writing that meets UCC elements to be transferred as an instrument.',
          'Holder: party in possession with rights under the instrument rules.',
          'Endorsement / negotiation: how rights in an instrument may transfer.',
          'Dishonor: failure to pay/accept when properly presented (context-specific).',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Track selector (do not mix frameworks)',
        bullets: [
          'Inaccurate bureau fields → FCRA / CRA reinvestigation (Metro2 map).',
          'Collector contacts → validation + documentation discipline.',
          'Note enforcement / lawsuit → licensed counsel + civil procedure.',
          'UCC-1 financing statements on business assets → state commercial filings (see UCC-1 primer).',
          'KEY: Article 3 is not a consumer credit delete button.',
          'WARNING: Always-works UCC discharge kits are a compliance red flag.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Classify your issue: reporting accuracy vs collector validation vs lawsuit.',
          '2) Ask Finely for the evidence checklist for that track — refuse myth templates.',
          '3) Build a Collections Proof Pack in Documents vault before advanced theories.',
          '4) Book counsel the same week if a note is in litigation — not after more videos.',
          'WARNING: UCC jargon in CRA letters often triggers frivolous responses.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. UCC adoption and case law vary by jurisdiction. Consult a licensed attorney for legal matters.',
          'COMPLIANCE: Results vary · not legal advice.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
  {
    id: 'strawman-myths-reality',
    title: '"Strawman" Myth vs Reality (Stay Legal, Stay Safe)',
    desc: 'A calm guide that separates internet myths from real-world compliance — so partners do not self-sabotage a case. Results vary · not legal advice.',
    sections: [
      {
        heading: '1. Why this guide exists',
        bullets: [
          'KEY: Courts and creditors respond to facts and deadlines — strawman catchphrases burn credibility and time.',
          'Viral strawman, all-capital name, and secret-account theories circulate in credit and debt spaces.',
          'Partners lose time — and sometimes worsen legal risk — when slogans replace documents and deadlines.',
          'Finely Cred stance: stay legal, stay evidence-based, stay calm.',
          'KEY: Courts and creditors respond to facts, procedure, and documentation — not catchphrases.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '2. Reality check',
        bullets: [
          'A lot of strawman content is not reliable legal guidance.',
          'Filing myth-based documents in court or with bureaus can create credibility damage.',
          'If you want durable results, focus on verifiable inaccuracies, valid defenses, and clean evidence.',
          'WARNING: Anyone selling an always-works-in-every-case strawman kit is a red flag.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '3. Common myth patterns (filter fast)',
        bullets: [
          'The all-caps name is a separate legal person who owes the debt.',
          'A birth certificate account pays your bills if you file the right forms.',
          'UCC stamps void any collection.',
          'Judges must dismiss when you say strawman.',
          'Treat each as a claim that needs primary legal authority — if none is shown, do not mail it.',
          'WARNING: Do not invent facts, fabricate exhibits, or mail myth language — inaccurate or false claims create legal and credibility risk.',
        ],
      },
      {
        heading: '4. What actually moves credit reporting',
        bullets: [
          'Specific reporting inconsistencies: dates, balances, status codes, ownership, DOFD, payment grids.',
          'One claim per dispute with minimum necessary exhibits.',
          'Timelines per bureau; certified mail; case logs.',
          'Method of verification and escalation when responses are hollow.',
          'TIP: Re-read the Metro2 Consistency Map and Bureau Response Decoder — those are the durable tools.',
        ],
      },
      {
        heading: '5. What matters in collections',
        bullets: [
          'Validate facts: ownership, amounts, dates, and documentation.',
          'Organize a Collections Proof Pack (letters, responses, screenshots, identity).',
          'Know whether you are on a CRA track or a collector track.',
          'If there is a summons, procedure and deadlines dominate — myths do not toll the clock.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '6. Court and deadline reality',
        bullets: [
          'Ignoring a summons because of internet theory is one of the fastest paths to default judgment.',
          'Licensed counsel in your jurisdiction is the correct move for lawsuits — same week, not after more research.',
          'Affidavits and answers must be truthful; false statements create new risk.',
          'WARNING: Do not let a guru talk you out of calendaring a response deadline.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '7. Risk filter (print and keep)',
        bullets: [
          'If a tactic requires claims you cannot prove — red flag.',
          'If a tactic says it always works — red flag.',
          'If a tactic discourages real counsel when legal deadlines exist — red flag.',
          'If a tactic asks for large fees before any document review — red flag.',
          'If a tactic mixes trust-language, UCC myths, and bureau deletion promises — red flag.',
        ],
      },
      {
        heading: '8. Partner replacement playbook',
        bullets: [
          '1. Pull reports; build a contradiction table.',
          '2. Build a proof pack; label exhibits.',
          '3. Send narrow CRA or validation letters as appropriate.',
          '4. Decode responses; branch cleanly.',
          '5. Escalate with chronology only when the packet is complete.',
          '6. For summons: attorney + calendar — no myth detours.',
        ],
      },
      {
        heading: '9. How to talk to friends sharing myths',
        bullets: [
          'Show me the primary legal authority and a verifiable case result — not a video.',
          'I am using documentable FCRA/collection processes and tracking deadlines.',
          'If a court date exists, I am calling a licensed attorney.',
          'Stay respectful; protect your own file.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
      {
        heading: '10. Partner safety checklist',
        bullets: [
          'I can explain every sentence in my letters with an exhibit.',
          'I am not mailing all-caps / strawman templates to bureaus.',
          'My court deadlines (if any) are on a calendar with counsel engaged.',
          'My disputes are field-level and calm.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Replace the myth with this numbered playbook',
        bullets: [
          '1) Pull reports; build a contradiction table.',
          '2) Build a proof pack; label exhibits.',
          '3) Send narrow CRA or validation letters as appropriate.',
          '4) Decode responses; branch cleanly.',
          '5) Escalate with chronology only when the packet is complete.',
          '6) For summons: attorney + calendar — no myth detours.',
          'KEY: Courts respond to procedure and documents — not all-caps theories.',
        ],
      },
      {
        heading: '11. Power moves inside Finely Cred',
        bullets: [
          '1) Replace myth kits with Metro2 contradiction work in Letter Studio.',
          '2) Ask Finely only for documentable next steps — never for strawman scripts.',
          '3) Calendar every court deadline; Book a session or counsel immediately if served.',
          '4) Keep your mail log clean so CFPB escalation stays credible.',
          'KEY: Facts, procedure, and exhibits beat catchphrases every time.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: [
          'Educational only; not legal advice. If you need legal guidance, consult a licensed attorney in your jurisdiction.',
          'COMPLIANCE: Results vary · not legal advice.',
          'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        ],
      },
    ],
  },
];

export const CORE_PARTNER_GUIDES: FreeGuide[] = enhancePartnerGuides(CORE_PARTNER_GUIDES_RAW);
