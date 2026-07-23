/**
 * Curated playbook distilled from consumer-debt defense practice materials
 * (assignment chain, discovery, affidavits, FDCPA/RMCPA angles).
 * Educational — not legal advice. Jurisdiction-specific procedure varies.
 */

export type DebtDefenseSourceDoc = {
  file: string;
  category: 'court_filing' | 'discovery' | 'validation' | 'affidavit' | 'negotiation' | 'reference' | 'video' | 'unknown';
  summary: string;
  finelyMapping: string[];
};

/** Inventory of the imported “Kill Debt letters” folder (Jul 2026). */
export const KILL_DEBT_SOURCE_INVENTORY: DebtDefenseSourceDoc[] = [
  {
    file: 'courtroom-defense-package.md',
    category: 'court_filing',
    summary: 'Educational courtroom pack: pretrial proof/preservation notice, written answer + certificate, court-day kit (opening, witness Qs, objections, closing, checklist). Merge fields only — no default party PII.',
    finelyMapping: [
      'courtroom_pretrial_proof_notice',
      'courtroom_written_answer',
      'courtroom_day_kit',
      'court_courtroom_pretrial_proof',
      'court_courtroom_written_answer',
      'court_courtroom_day_kit',
    ],
  },
  {
    file: 'creditor-discovery-v-citibank.docx',
    category: 'discovery',
    summary: 'Full discovery set: RFAs on securitization, mini-Miranda on pleadings, interrogatories on chain of title/servicing, RFPs for original agreement, account-level assignments, payment proof, securitization docs.',
    finelyMapping: ['court_discovery_bank', 'coach_standing', 'letter_assignment_chain_demand'],
  },
  {
    file: 'citibank-counter-claim-template.docx',
    category: 'court_filing',
    summary: 'FDCPA + Michigan RMCPA counterclaim when complaint bears debt-collector disclosure language; Bassett/Brownbark/Riley assignment cases; securitization/standing theories.',
    finelyMapping: ['court_counterclaim_research', 'coach_fdcpa_pleading'],
  },
  {
    file: 'citibank-v-debtor-answer-ad-and-pos.docx',
    category: 'court_filing',
    summary: 'Answer denying each allegation; affirmative defenses (no account stated, standing, SOL, hearsay, mini-Miranda on summons); securitization exhibits referenced.',
    finelyMapping: ['summons_response_affidavit', 'affidavit_of_dispute', 'court_answer_outline'],
  },
  {
    file: 'motion-to-compel-discovery-citibank.docx',
    category: 'court_filing',
    summary: 'Motion to compel supplemental discovery responses after plaintiff admits securitization but withholds trust-to-bank assignments.',
    finelyMapping: ['court_motion_compel', 'discovery_supplement_demand'],
  },
  {
    file: 'det-collector-validation-to-citibank-using-mini-miranda-in-the-lawsuit.docx',
    category: 'validation',
    summary: 'Post-suit validation demand triggered by mini-Miranda on collection lawsuit; demands assignments, securitization proof, cease collection until validated.',
    finelyMapping: ['post_suit_validation_demand'],
  },
  {
    file: 'assignment-letter-to-creditor-for-assignment-proof.docx',
    category: 'validation',
    summary: 'Demand to original creditor/servicer for complete assignment registry (Upstart/Cross River example) when debt buyer sues without chain of title.',
    finelyMapping: ['assignment_chain_demand'],
  },
  {
    file: 'citibank-affidavit-with-validation-sample-1.docx',
    category: 'affidavit',
    summary: 'Sworn affidavit disputing account-stated claim, demanding validation, noting mini-Miranda on complaint pages.',
    finelyMapping: ['affidavit_of_dispute', 'summons_response_affidavit'],
  },
  {
    file: 'velocity-and-stillman-law-affidavit.docx',
    category: 'affidavit',
    summary: 'Affidavit attacking generic bill of sale, missing exhibit A, broken chain from trust/seller to debt buyer.',
    finelyMapping: ['affidavit_of_dispute', 'coach_chain_of_title'],
  },
  {
    file: 'portfolio-recovery-associates-and-weber-olcese-affidavit.docx',
    category: 'affidavit',
    summary: 'Debt-buyer lawsuit affidavit pattern — dispute lack of account-specific assignment.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'rock-creek-capital-and-mancinelli-goeman-law-group-with-sallie-mae-affidavit.docx',
    category: 'affidavit',
    summary: 'Student-loan/trust affidavit — assignment and servicer standing dispute.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'slm-private-education-loan-trust-and-lloyd-mcdaniel-for-sallie-may-affidavit.docx',
    category: 'affidavit',
    summary: 'SLM/private education loan trust fact pattern (duplicate copies in folder).',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'uhg-i-and-dobberstein-law-affidavit.docx',
    category: 'affidavit',
    summary: 'Medical/debt-buyer affidavit template (duplicate copy in folder).',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'sun-federal-credit-union-and-weltman-weinberg-affidavit.docx',
    category: 'affidavit',
    summary: 'Credit union collection affidavit dispute template.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'bank-of-america-and-shermeta-law-affidavit.docx',
    category: 'affidavit',
    summary: 'Bank plaintiff affidavit dispute — standing and records.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'velocity-and-stillman-law-for-mpli-affidavit.docx',
    category: 'affidavit',
    summary: 'Extended Velocity/Stillman affidavit with exhibit gaps.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'velocity-and-timothy-baxter-affidavit.docx',
    category: 'affidavit',
    summary: 'Velocity fact pattern variant.',
    finelyMapping: ['affidavit_of_dispute'],
  },
  {
    file: 'citigroup-securitization.docx',
    category: 'reference',
    summary: 'Plain-language outline of credit-card receivable securitization (pooling, tranches, servicing retained by originator).',
    finelyMapping: ['coach_securitization', 'discovery_securitization_rfas'],
  },
  {
    file: 'top-ten-tips-on-how-to-talk-with-a-collection-attorney-show-notes.docx',
    category: 'negotiation',
    summary: 'Do not admit debt on recorded calls; file answer before negotiating; attorney CYA dynamics; default-judgment timeline games.',
    finelyMapping: ['coach_negotiation', 'coach_summons_deadline'],
  },
  {
    file: 'letter-to-court-fill-in-addresses-etc.docx',
    category: 'court_filing',
    summary: 'Court filing shell — caption/addresses only.',
    finelyMapping: ['court_filing_shell'],
  },
  {
    file: 'actual-securitization-answer-to-citibank.pdf',
    category: 'court_filing',
    summary: 'PDF — securitization-focused answer (needs PDF ingest for full text).',
    finelyMapping: ['summons_response_affidavit'],
  },
  {
    file: 'shownotes-on-defending-acitibank-collection-lawsuit.pdf',
    category: 'reference',
    summary: 'PDF show notes — Citibank defense strategy (needs PDF ingest).',
    finelyMapping: ['coach_court_overview'],
  },
  {
    file: 'settling-collection-debts-framework.pdf',
    category: 'negotiation',
    summary: 'PDF — settlement negotiation framework (needs PDF ingest).',
    finelyMapping: ['coach_negotiation'],
  },
  {
    file: 'GAME.mp4 / video1281626937.mp4',
    category: 'video',
    summary: 'Training video — not yet transcribed into portal KB.',
    finelyMapping: ['future_video_transcripts'],
  },
  {
    file: 'Untitled document.docx',
    category: 'unknown',
    summary: 'Unrelated CRM feature notes — discard for debt KB.',
    finelyMapping: [],
  },
  {
    file: 'New/repossession-claim-and-delivery-defense-answer-ad-and-appearance.docx',
    category: 'court_filing',
    summary: 'Ally lease trust claim-and-delivery: turn-in refusal, UCC 9-609/9-610, MCL 440.2971, wrongful detention, FDCPA mini-Miranda on pleadings.',
    finelyMapping: ['repossession_answer_claim_delivery', 'repo_lease_turn_in'],
  },
  {
    file: 'New/securitization-answer-ad-and-appearance-vs-discover-bank.docx',
    category: 'court_filing',
    summary: 'Discover ABS pooling agreement excerpt; denial of standing without trust-to-bank reassignment; Bassett/Brownbark/Riley.',
    finelyMapping: ['securitization_answer_discover'],
  },
  {
    file: 'New/securitization-v-amex-answer-ad-and-appearance.docx',
    category: 'court_filing',
    summary: 'Amex securitization answer pattern with counter-affidavit angles.',
    finelyMapping: ['securitization_answer_amex'],
  },
  {
    file: 'New/boa-v-securitization-answer-ad-and-appearance.docx',
    category: 'court_filing',
    summary: 'Bank of America securitization answer and affirmative defenses.',
    finelyMapping: ['securitization_answer_boa'],
  },
  {
    file: 'New/counter-affidavit-of-dispute-for-discover-securitization.docx',
    category: 'affidavit',
    summary: 'Counter-affidavit disputing Discover securitization ownership.',
    finelyMapping: ['securitization_counter_affidavit'],
  },
  {
    file: 'New/amex-counter-affidavit-for-securitization.docx',
    category: 'affidavit',
    summary: 'Amex securitization counter-affidavit template.',
    finelyMapping: ['securitization_counter_affidavit'],
  },
  {
    file: 'New/securitization-answer-ad-and-appearance-vs-weltman.docx',
    category: 'court_filing',
    summary: 'Weltman Weinberg collector pattern with securitization defenses.',
    finelyMapping: ['securitization_answer_discover'],
  },
  {
    file: 'New/drive-download zip',
    category: 'reference',
    summary: 'Bulk archive of additional answer/affidavit variants — ingest as needed.',
    finelyMapping: ['catalog_expansion'],
  },
];

/** Key cases cited in Michigan collection-defense materials (verify in your jurisdiction). */
export const DEBT_DEFENSE_CASE_ANCHORS = [
  {
    name: 'Midland Funding, LLC v. Michael Bassett',
    cite: 'Mich. Ct. App. No. 338404 (2018)',
    use: 'Pool bill of sale without account-level identifying information is insufficient to prove assignment of a specific debt.',
  },
  {
    name: 'Brownbark II LP v. Bay Area Floorcovering & Design Inc.',
    cite: 'Mich. Ct. App. No. 296660 (2011)',
    use: 'Michigan statute of frauds — assignment of things in action must be in writing with authorized signature.',
  },
  {
    name: 'Unifund CCR Partners v. Nishawn Riley',
    cite: 'Mich. Ct. App. No. 287599 (2010)',
    use: 'Bare assertion of assignment in pleadings without contract evidence is insufficient.',
  },
  {
    name: 'Weston v. Dowty',
    cite: '163 Mich. App. 238 (1987)',
    use: 'Valid assignment requires perfected transaction vesting present right in assignee.',
  },
  {
    name: 'Harvey v. Great Seneca Fin. Corp.',
    cite: '453 F.3d 324 (6th Cir. 2006)',
    use: 'FDCPA least-sophisticated-consumer standard for false/misleading representations.',
  },
];

/** Core procedural themes to encode in letters/coach (not “magic bullet” defenses). */
export const DEBT_DEFENSE_PLAYBOOK_THEMES = [
  {
    id: 'account_level_proof',
    title: 'Account-level proof beats pool documents',
    detail:
      'Demand the original signed agreement, complete ledger, and assignments that identify THIS account — not a generic bill of sale or spreadsheet covering thousands of accounts.',
  },
  {
    id: 'standing_chain',
    title: 'Standing & chain of title',
    detail:
      'Plaintiff must prove current owner/servicer, each transfer date, and authority to sue. Missing links support denial, discovery, and evidentiary objections.',
  },
  {
    id: 'securitization_discovery',
    title: 'Securitization as a discovery topic',
    detail:
      'Credit card and loan receivables may be pooled into trusts while the bank retains servicing. Use interrogatories/RFPs and SEC EDGAR research to test ownership claims — without arguing transfer alone voids the debt.',
  },
  {
    id: 'mini_miranda_pleading',
    title: 'Mini-Miranda on court papers',
    detail:
      'FDCPA § 1692e(11) generally exempts formal pleadings from initial debt-collector disclosure — but inconsistent pleadings (creditor suing while using collector language) can support discovery and, in some cases, counterclaims. Verify with counsel in your state.',
  },
  {
    id: 'account_stated',
    title: 'Account stated vs breach of contract',
    detail:
      'Deny account-stated claims when there is no proof of agreement or payment to the plaintiff. Force plaintiff to elect theory and prove elements.',
  },
  {
    id: 'discovery_continuing',
    title: 'Continuing & supplemental discovery',
    detail:
      'When plaintiff admits securitization but withholds trust assignments, send supplementation letters then motion to compel under local rules (e.g. MCR 2.306 in Michigan).',
  },
  {
    id: 'negotiation_discipline',
    title: 'Negotiation discipline',
    detail:
      'Never admit the debt on recorded calls. File answer + affirmative defenses before settlement talks. Settlement discussions are generally inadmissible to prove liability but shape how collectors litigate.',
  },
];

/** High-value discovery requests (RFAs / interrogatories / RFPs) — account-specific. */
export const DISCOVERY_REQUEST_BANK = {
  requestsForAdmission: [
    'Plaintiff is seeking to enforce an agreement not attached to the lawsuit.',
    'Plaintiff is not in possession of the original signed loan/credit agreement.',
    'The specific account was securitized or placed into a trust.',
    'The cardholder agreement attached or referenced is not signed by defendant in defendant’s handwriting.',
    'Another entity, trust, or investor is entitled to receive part of any payment defendant makes.',
    'Mini-Miranda debt-collector language appeared on summons or complaint pages.',
  ],
  interrogatories: [
    'Identify each entity that owned, serviced, or was assigned this account with dates and account numbers.',
    'List every party with any interest in the debt (trustee, servicer, debt buyer, insurer) and consideration received.',
    'State legal basis plaintiff has to enforce this debt and whether claim is contract, account stated, or other.',
    'State date/form of last payment and who received it.',
    'Does plaintiff own the debt today or only servicing rights?',
    'Name custodian of records for securitization and assignment documents.',
  ],
  requestsForProduction: [
    'Original signed agreement for this account only.',
    'Account-level assignment/transfer documents — not a pool schedule omitting this account.',
    'Complete payment transaction history from origination.',
    'All collection notes and call logs for this account.',
    'Documents counsel relied on before filing complaint.',
    'Proof of last payment (check image, ACH record, etc.).',
    'Documents showing payment allocation (servicing fee vs trust/bondholder).',
    'Documents proving account was NOT securitized (if plaintiff denies securitization).',
    'All documents approving mini-Miranda language on pleadings.',
  ],
};

/** Coach chip prompts derived from materials. */
export const COACH_PROMPTS_FROM_SOURCES = {
  validation: [
    'What should I demand when their validation packet is only a bill of sale?',
    'How do I write a Round 2 deficiency after a generic statement?',
    'What assignments should I demand if the account may have been securitized?',
  ],
  court: [
    'What affirmative defenses fit a credit-card collection complaint with no contract attached?',
    'How do I draft RFAs about securitization and mini-Miranda on the summons?',
    'What goes in a motion to compel when discovery answers are evasive?',
    'Should I talk to the plaintiff attorney before filing my answer?',
    'How does Bassett/Brownbark-style assignment law apply to my state?',
  ],
};
