/**
 * Laws & Rights Reference — structured knowledge pack.
 * Distilled + elaborated from Finely_Cred_Laws_Rights_Reference_v3.pdf (educational).
 * MA-focused examples generalized with federal anchors. Not legal advice.
 */

export type LawRightsSection = {
  id: string;
  title: string;
  eyebrow: string;
  useWhen: string;
  nextAction: string;
  citeChips: Array<{ label: string; href?: string; external?: boolean }>;
  plainEnglish: string;
  howToUse: string[];
  doNotOverclaim: string[];
  pairsWithDefenseIds?: string[];
};

export const LAWS_RIGHTS_COMPLIANCE =
  'Educational reference · not legal advice · re-verify authority, dates, and local court rules before filing or hearing · results vary.';

export const LAWS_RIGHTS_META = {
  title: 'Laws & Rights Reference',
  subtitle:
    'Plain-English authority guide for debt-buyer lawsuits: what each law does, how to use it, and what not to overclaim.',
  sourceLabel: 'Finely Cred Laws & Rights Reference v3 (elaborated)',
  compliance: LAWS_RIGHTS_COMPLIANCE,
} as const;

export const LAW_STACK_MAP = {
  title: 'How to use the law stack',
  rule: 'Do not stack statutes like decoration. Pick the two or three that fit the actual documents. A precise factual attack beats a pile of legal words.',
  layers: [
    { id: 'procedure', title: 'Procedure', question: 'Does the filing comply with small-claims / assigned-debt requirements?' },
    { id: 'capacity', title: 'Capacity', question: 'Is the named plaintiff the real party in interest or otherwise authorized to sue?' },
    { id: 'assignment', title: 'Assignment', question: 'Did rights actually transfer, and do documents identify this exact account?' },
    { id: 'assignee_defenses', title: 'Assignee defenses', question: 'Did original-transaction claims, payments, or fee defects travel with the receivable?' },
    { id: 'collection', title: 'Collection law', question: 'Did the collector misstate amount, legal status, authority, fees, or reporting?' },
    { id: 'remedy', title: 'Remedy', question: 'Dismissal, judgment for defendant, continuance, reduction, complaint leverage, or settlement leverage?' },
  ],
};

export const LAWS_RIGHTS_SECTIONS: LawRightsSection[] = [
  {
    id: 'small_claims_foundation',
    title: 'Small claims foundation',
    eyebrow: 'Procedure',
    useWhen: 'You are in (or preparing for) small-claims / limited-jurisdiction collection hearings.',
    nextAction: 'Map disputed issues in a short written answer; focus on ownership, authority, amount.',
    citeChips: [
      { label: 'Assigned-debt filing data (local rules)' },
      { label: 'Burden of proof — preponderance' },
    ],
    plainEnglish:
      'Plaintiff must prove the claim by a preponderance of the evidence. Assigned-debt filings often require original creditor, last four digits, and last payment amount/date when applicable. Evidence rules may be relaxed — argue weight, reliability, missing links, and account-specific proof.',
    howToUse: [
      'Check whether the statement of claim includes required assigned-debt data for your court.',
      'A written answer (even if optional) maps disputes and prevents nervous improvisation — keep it short, not a manifesto.',
      'Court phrasing: ask the Court to weigh whether documents reliably prove ownership, authority, and amount — not to reject every paper blindly.',
    ],
    doNotOverclaim: [
      'Do not claim small claims “has no evidence rules.” Flexibility ≠ meaningless paperwork.',
      'Do not file a wall of internet theories.',
    ],
    pairsWithDefenseIds: ['document_audit', 'hearing_scripts'],
  },
  {
    id: 'real_party',
    title: 'Real party in interest & entity authority',
    eyebrow: 'Capacity',
    useWhen: 'Plaintiff name, affiliate, servicer, or LLC structure does not match the bill of sale / affidavits.',
    nextAction: 'Match names across complaint, bill of sale, license, and account records; ask for authority docs.',
    citeChips: [
      { label: 'Mass. Rule 17 (example framework)' },
      { label: 'Real party / written assignee' },
    ],
    plainEnglish:
      'Actions should be prosecuted by the real party in interest, with frameworks that allow certain authorized parties and written assignees to sue in their own names. The issue is whether this exact entity owns or is authorized to enforce this receivable — not whether LLCs can sue.',
    howToUse: [
      'Exact name match across bill of sale, affidavits, license, and account records.',
      'Owner vs servicer vs collector are different roles — ask which one is the named plaintiff.',
      'If not the owner: request servicing agreement, agency authority, POA, or assignment.',
      'Foreign entity / registration defects may be curable — verify before relying on them.',
      'Court-safe: ask whether this particular legal entity is the real party in interest or otherwise authorized to sue in its own name.',
    ],
    doNotOverclaim: ['Do not argue “LLCs cannot sue.”', 'Do not treat curable capacity defects as automatic dismissal.'],
    pairsWithDefenseIds: ['cross_exam_sequence', 'document_audit'],
  },
  {
    id: 'ucc_article_9',
    title: 'UCC Article 9 — assignment & assignee defenses',
    eyebrow: 'UCC',
    useWhen: 'Credit-card / account receivables were sold or assigned; you need proof and surviving defenses.',
    nextAction: 'Ask what exact rights transferred, to whom, on what date, under what document, subject to what conditions.',
    citeChips: [
      { label: 'UCC § 9-404', href: 'https://www.law.cornell.edu/ucc/9/9-404', external: true },
      { label: 'UCC § 9-406', href: 'https://www.law.cornell.edu/ucc/9/9-406', external: true },
      { label: 'Cornell UCC Art. 9', href: 'https://www.law.cornell.edu/ucc/9', external: true },
    ],
    plainEnglish:
      'For ordinary sold credit-card receivables, Article 9 is usually stronger than Article 3 framing. Assignees can take subject to the original agreement and defenses/recoupment arising from the transaction. Account debtors may request reasonable proof of assignment — useful to identify who is entitled to payment, not an automatic debt eraser.',
    howToUse: [
      '9-404: use for payment, credit, fee, billing, and contract-term defects that traveled with the receivable.',
      '9-406: request reasonable proof of assignment when payee/owner is unclear.',
      '9-203 / 9-607: use only with sale/security documents — what attached, what collateral, who enforces.',
      'Best court use: identify rights transferred, entity entitled to enforce, and defenses that survived — do not say “UCC voids it.”',
    ],
    doNotOverclaim: ['Do not say “UCC voids the debt.”', 'Do not skip the sale documents and argue abstract UCC theories.'],
    pairsWithDefenseIds: ['receivable_flow', 'advanced_pressure', 'amount_audit'],
  },
  {
    id: 'fdcpa_state_collection',
    title: 'FDCPA & state collection / unfair practices',
    eyebrow: 'Consumer protection',
    useWhen: 'Wrong amount/status, unauthorized charges, misleading entity name, or disputed-debt reporting issues appear in the file.',
    nextAction: 'Tie each violation theory to a specific document or statement — then use for leverage or complaint strategy.',
    citeChips: [
      { label: '15 U.S.C. § 1692e', href: 'https://www.law.cornell.edu/uscode/text/15/1692e', external: true },
      { label: '15 U.S.C. § 1692f', href: 'https://www.law.cornell.edu/uscode/text/15/1692f', external: true },
      { label: 'FTC debt collection', href: 'https://www.ftc.gov/debt-collection', external: true },
      { label: 'CFPB debt collection', href: 'https://www.consumerfinance.gov/compliance/compliance-resources/other-applicable-requirements/debt-collection/', external: true },
    ],
    plainEnglish:
      'Federal FDCPA bars false/misleading representations about amount or legal status, and unfair practices including unauthorized charges. Many states add unfair/deceptive debt-collection rules (example frameworks: 940 CMR 7 / Chapter 93A in Massachusetts). Facts, injury, and procedure matter.',
    howToUse: [
      'False amount/status → 1692e (+ state analogues).',
      'Unauthorized interest/fees/expenses → 1692f (+ state analogues).',
      'Wrong business name / misleading creditor status when facts support.',
      'After dispute, failure to communicate debt as disputed can create reporting issues under applicable rules.',
      'State unfair-practices claims need facts, injury, and proper procedure — not slogans.',
      'Leverage: wrong entity, wrong amount, unauthorized add-ons, or contradictory reporting turns a small claim into a compliance problem.',
    ],
    doNotOverclaim: [
      'Do not claim every paperwork gap is an automatic FDCPA payday.',
      'Do not invent damages without injury and procedure.',
    ],
    pairsWithDefenseIds: ['amount_audit', 'advanced_pressure', 'settlement_fallback'],
  },
  {
    id: 'licensing',
    title: 'Licensing — collector, buyer, attorney',
    eyebrow: 'Licensing',
    useWhen: 'You need to identify which actor collected and whether license/registration/exemption applies.',
    nextAction: 'Identify each actor and timing; use licensing to question authority and conduct — not as a magic erase.',
    citeChips: [
      { label: 'State debt-buyer / collector licensing (local)' },
      { label: 'Attorney / professional conduct overlay' },
    ],
    plainEnglish:
      'Licensing is fact-specific. Some states require debt collectors and certain debt buyers that directly collect consumer debt to be licensed; passive buyers using licensed collectors or attorneys may be treated differently. Attorneys still face FDCPA and professional-conduct rules.',
    howToUse: [
      'Identify each actor: owner, servicer, collector, attorney, data provider, purchaser.',
      'Check timing: licensed/registered when collection activity occurred?',
      'Attorney exception may apply for licensed counsel — still not a free pass on FDCPA/professional rules.',
      'Court use: question authority, regulatory compliance, and misleading collection conduct.',
      'Question: which entity directly collected, what role, what license/registration/attorney authority/exemption?',
    ],
    doNotOverclaim: [
      'Licensing pressure does not automatically erase principal.',
      'Do not assume every out-of-state LLC is illegally collecting.',
    ],
    pairsWithDefenseIds: ['advanced_pressure', 'cross_exam_sequence'],
  },
  {
    id: 'arbitration_agreement',
    title: 'Card agreement & arbitration',
    eyebrow: 'Agreement',
    useWhen: 'Amount, fees, assignment rights, or arbitration may change leverage — pull the exact historical agreement.',
    nextAction: 'Locate product-matched agreement (CFPB database is a starting point); match opening period and amendments.',
    citeChips: [
      { label: 'CFPB card agreements', href: 'https://www.consumerfinance.gov/credit-cards/agreements/', external: true },
    ],
    plainEnglish:
      'The exact cardmember agreement can define interest, fees, arbitration, governing law, assignment rights, account-stated language, payment application, default, and collection costs. Generic database copies help — account-specific version still matters.',
    howToUse: [
      'Product match: same product, opening period, governing law, amendments.',
      'Arbitration: who can elect, when, forum, fees, delegation, small-claims carve-out.',
      'Fees/interest: no agreement term → challenge lawful add-on.',
      'Assignment clause: allowed? What defenses survive? What notice required?',
      'Court-safe: ask plaintiff to identify the exact agreement and provisions authorizing balance, fees, interest, assignment, and enforcement.',
    ],
    doNotOverclaim: [
      'Do not assume arbitration always helps or always hurts — carve-outs matter.',
      'Do not rely on the wrong year’s agreement.',
    ],
    pairsWithDefenseIds: ['amount_audit', 'advanced_pressure'],
  },
  {
    id: 'case_studies_rights',
    title: 'What the cases teach',
    eyebrow: 'Case studies',
    useWhen: 'You need honest limiting principles alongside favorable reasoning patterns.',
    nextAction: 'Use as persuasion for account-level proof — not as local guarantees.',
    citeChips: [{ label: 'Persuasive examples (fact-specific)' }],
    plainEnglish:
      'Favorable examples show: admitting unspecified original-account use ≠ conceding debt-buyer ownership; bill of sale + statements can fail without sale-file link; bare ownership affidavits can fail without assignment documents. Limiting principle: matched account-level evidence + competent witness forces a pivot to amount, terms, Article 9, consumer law, and settlement.',
    howToUse: [
      'Frame: “I am asking for the account-level connection,” not magic spells.',
      'If proof is strong, pivot strategies instead of repeating a dead attack.',
    ],
    doNotOverclaim: ['These are not jurisdiction guarantees.', 'Do not cite cases you have not verified for your court.'],
    pairsWithDefenseIds: ['case_logic', 'hearing_scripts'],
  },
  {
    id: 'authority_checklist',
    title: 'Authority checklist (working file)',
    eyebrow: 'Sources',
    useWhen: 'Building or refreshing a hearing folder.',
    nextAction: 'Print with Defense Book court card; re-verify before filing or appearing.',
    citeChips: [
      { label: 'FDCPA overview (Cornell)', href: 'https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-V', external: true },
      { label: 'FCRA disputes (CFPB)', href: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-an-error-on-my-credit-report-en-313/', external: true },
      { label: 'NAAG consumer protection', href: 'https://www.naag.org/issues/consumer-protection/', external: true },
    ],
    plainEnglish:
      'Keep a short authority list with the working file: local small-claims assigned-debt rules; real-party framework; UCC 9-404/9-406; FDCPA 1692e/1692f; state fair-debt rules; card agreement source; case studies as persuasive only.',
    howToUse: [
      'Re-verify all authority, dates, and court rules before filing or appearing.',
      'A law is strongest when tied to the exact document in the file.',
      'Pair with Bureau track (FCRA) when reporting remains inaccurate after debt work.',
    ],
    doNotOverclaim: ['Do not file unverified citations.', 'Do not treat checklists as pleadings.'],
    pairsWithDefenseIds: ['court_card', 'bureau_crossover'],
  },
  {
    id: 'answer_deadlines',
    title: 'Answer & appearance deadlines',
    eyebrow: 'Procedure',
    useWhen: 'Summons just served or hearing is inside two weeks — calendar controls strategy.',
    nextAction: 'Set hearing date in Litigation Command; file/appear before the deadline in your summons.',
    citeChips: [
      { label: 'Local answer window (read summons)' },
      { label: 'Proof of service date' },
    ],
    plainEnglish:
      'Answer windows are court- and summons-specific (often counted from service). Missing an answer can lead to default. Appearance/hearing dates on the docket override guesswork — use the paper deadlines.',
    howToUse: [
      'Find date served and the answer-by language on the summons.',
      'If hearing is sooner than a comfortable discovery cycle: prioritize written answer + affidavit + hearing card.',
      'Always serve plaintiff counsel; keep proof of mailing/filing.',
    ],
    doNotOverclaim: ['Do not assume a 30-day federal window applies in every state court.'],
    pairsWithDefenseIds: ['written_answer_playbook', 'docket_strategy', 'hearing_scripts'],
  },
  {
    id: 'standing_challenge',
    title: 'Standing / assignment challenge',
    eyebrow: 'Capacity',
    useWhen: 'Debt buyer, trust, or assignee plaintiff with thin bill of sale or no account-level schedule.',
    nextAction: 'Demand account-level assignment; plead standing defenses; use discovery RFPs on sale file.',
    citeChips: [
      { label: 'Real party in interest' },
      { label: 'UCC § 9-406', href: 'https://www.law.cornell.edu/ucc/9/9-406', external: true },
    ],
    plainEnglish:
      'The named plaintiff must show it owns or is authorized to enforce this receivable. A generic bill of sale without your account row is often the weak gate — ask for the schedule and field definitions.',
    howToUse: [
      'Compare plaintiff name across complaint, bill of sale, and affidavits.',
      'Ask for the sale-file row: account number, balance at sale, sale date.',
      'Court phrasing: ownership/authority/amount each need proof — papers alone are not judgment.',
    ],
    doNotOverclaim: ['Do not claim every debt buyer case is automatically void.'],
    pairsWithDefenseIds: ['cross_exam_sequence', 'discovery_pressure', 'document_audit'],
  },
  {
    id: 'fdcpa_1692e',
    title: 'FDCPA § 1692e — false / misleading',
    eyebrow: 'FDCPA',
    useWhen: 'Wrong amount, false legal status, or misleading creditor identity appears in collection or suit papers.',
    nextAction: 'Tie the exact sentence to a document; use for leverage, validation, or counterclaim outline when facts fit.',
    citeChips: [
      { label: '15 U.S.C. § 1692e', href: 'https://www.law.cornell.edu/uscode/text/15/1692e', external: true },
    ],
    plainEnglish:
      'Debt collectors may not use false or misleading representations about character, amount, or legal status of a debt. Mini-Miranda on a lawsuit can matter for collector status — fact-specific.',
    howToUse: [
      'Quote the exact misstatement.',
      'Compare to ledger and ownership docs.',
      'Pair with state unfair-practices rules when available.',
    ],
    doNotOverclaim: ['Not every paperwork gap is an FDCPA claim.'],
    pairsWithDefenseIds: ['fdcpa_counterclaim_track', 'amount_audit'],
  },
  {
    id: 'fdcpa_1692f',
    title: 'FDCPA § 1692f — unfair practices',
    eyebrow: 'FDCPA',
    useWhen: 'Unauthorized interest, fees, or collection costs appear after charge-off or outside the agreement.',
    nextAction: 'Force the amount walk; challenge unauthorized add-ons with agreement terms.',
    citeChips: [
      { label: '15 U.S.C. § 1692f', href: 'https://www.law.cornell.edu/uscode/text/15/1692f', external: true },
    ],
    plainEnglish:
      'Unfair practices include collecting amounts not permitted by agreement or law. Amount audit is the factual engine — agreement terms decide what can be added.',
    howToUse: [
      'Map statement → charge-off → sale → lawsuit balance.',
      'Ask which agreement authorizes each fee/interest line.',
    ],
    doNotOverclaim: ['Do not invent fee defects without the ledger.'],
    pairsWithDefenseIds: ['amount_audit', 'fdcpa_counterclaim_track'],
  },
  {
    id: 'evidence_weight_hearsay',
    title: 'Evidence weight & affidavit foundation',
    eyebrow: 'Evidence',
    useWhen: 'Plaintiff relies on conclusory affidavits, imported screens, or records the witness cannot explain.',
    nextAction: 'Ask foundation questions; request limited weight without account-specific knowledge.',
    citeChips: [
      { label: '28 U.S.C. § 1746 (unsworn declarations)', href: 'https://www.law.cornell.edu/uscode/text/28/1746', external: true },
      { label: 'Local small-claims evidence flexibility' },
    ],
    plainEnglish:
      'Small-claims evidence rules may be flexible, but flexibility is not a free pass. A partner can ask the Court to weigh reliability: personal knowledge, business-record foundation, field-code meaning, and whether the affiant can explain the original creditor’s system — not only Midland’s screen.',
    howToUse: [
      'Ask: Did the witness create the record, work for the original creditor, or only read a purchased file?',
      'Ask for field definitions and how the lawsuit balance was calculated.',
      'Court phrasing: limited weight unless account-specific records and a competent witness are before the Court.',
      'Pair with discovery if hearing is not immediate.',
    ],
    doNotOverclaim: [
      'Do not claim every affidavit is automatically hearsay that must be excluded in every court.',
      'Do not accuse fraud without proof.',
    ],
    pairsWithDefenseIds: ['cross_exam_sequence', 'document_audit', 'continuance_if_new_exhibits'],
  },
  {
    id: 'hearing_day_procedure',
    title: 'Hearing-day procedure (partner self-help)',
    eyebrow: 'Procedure',
    useWhen: 'Hearing is set (including Jul 27 demo path for Roosevelt) and you need courtroom logistics.',
    nextAction: 'Print court card; confirm counsel service; arrive with organized exhibits.',
    citeChips: [
      { label: 'Litigation Command', href: '/portal/debt?tab=litigation&stage=hearing' },
      { label: 'Local court appearance rules' },
    ],
    plainEnglish:
      'Hearing day is about calm proof questions, not statute speeches. Confirm you are in the right courtroom or remote session, have copies for the court and plaintiff counsel, and know your three asks: judgment for defendant if unproven, continuance if new central exhibits, limited weight for unexplained records.',
    howToUse: [
      'Check docket for judge, time, and remote login.',
      'Bring written answer / affidavit copies if previously filed.',
      'Speak plain English; cite laws only when they map to a document gap.',
      'After hearing: note orders, deadlines, and next portal tasks.',
    ],
    doNotOverclaim: ['Do not treat educational scripts as guaranteed outcomes.'],
    pairsWithDefenseIds: ['court_card', 'prehearing_72h_checklist', 'hearing_scripts'],
  },
];

export function searchLawsRights(query: string): LawRightsSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return LAWS_RIGHTS_SECTIONS;
  return LAWS_RIGHTS_SECTIONS.filter((s) => {
    const hay = [
      s.title,
      s.eyebrow,
      s.useWhen,
      s.nextAction,
      s.plainEnglish,
      ...s.howToUse,
      ...s.doNotOverclaim,
      ...s.citeChips.map((c) => c.label),
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
