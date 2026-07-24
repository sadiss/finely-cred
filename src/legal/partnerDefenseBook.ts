/**
 * Partner Defense Book — structured knowledge pack.
 * Distilled + elaborated from Finely_Cred_Client_Defensebook_v3.pdf (educational).
 * Private matter PII scrubbed. Not legal advice. Results vary by facts and jurisdiction.
 */

export type DefenseTrack = 'court' | 'validation' | 'bureau' | 'settlement' | 'all';

export type DefensePlaybookSection = {
  id: string;
  title: string;
  eyebrow: string;
  useWhen: string;
  nextAction: string;
  track: DefenseTrack;
  /** Portal / catalog / external next steps */
  links: Array<{ label: string; href: string; external?: boolean }>;
  steps: string[];
  courtSafePhrases?: string[];
  doNotSay?: string[];
  lawAnchors?: string[];
};

export const DEFENSE_BOOK_COMPLIANCE =
  'Educational self-help · not legal advice · verify court rules and facts · results vary · no outcome guaranteed.';

export const DEFENSE_BOOK_META = {
  title: 'Partner Defense Book',
  subtitle:
    'Admit only what is true. Force the plaintiff to prove ownership, authority, and amount — in plain English.',
  sourceLabel: 'Finely Cred Defense Book v3 (elaborated)',
  compliance: DEFENSE_BOOK_COMPLIANCE,
} as const;

/** One-page stance — generalize original-creditor vs debt-buyer split. */
export const DEFENSE_CORE_STATEMENT = {
  title: 'The defense in one page',
  core:
    'I recognize the original account if that is true. I do not admit that this named plaintiff owns the receivable, calculated the balance correctly, or has proven the right to judgment today.',
  meaning: [
    'Credibility is a weapon: if the original account was yours, say so calmly. Do not invent a false denial.',
    'Separate original-account history from the debt-buyer (or assignee) lawsuit. Account use ≠ proven ownership by the named plaintiff.',
    'Force every bridge: entity authority, account-level transfer, amount math, witness knowledge, and consumer-law compliance.',
    'Ask for judgment for defendant if proof is incomplete; ask for time if central documents appear for the first time at hearing.',
  ],
  sequenceNote:
    'Do not recite every statute in court. Use laws to decide which questions and gaps matter. Speak plain English.',
};

export const FIVE_GATE_STRATEGY = {
  title: 'Five-gate strategy',
  subtitle: 'A debt buyer must cross each gate. One weak gate can change outcome or leverage.',
  gates: [
    {
      id: 'named_plaintiff',
      title: 'Named plaintiff',
      question: 'Is the exact entity on the complaint legally entitled to sue, or only a servicer/collector?',
    },
    {
      id: 'transfer_chain',
      title: 'Transfer chain',
      question: 'What contract, sale agreement, assignment, or schedule moved this exact receivable?',
    },
    {
      id: 'account_level',
      title: 'Account-level match',
      question: 'Does the evidence connect your account number, balance, and identity to the sale file?',
    },
    {
      id: 'amount',
      title: 'Amount legality',
      question: 'Are balance, interest, fees, costs, and post-charge-off additions authorized and traced?',
    },
    {
      id: 'witness',
      title: 'Witness reliability',
      question: 'Can the witness explain original records, imports, field codes, and sale conditions from real knowledge?',
    },
  ],
  pivotIfPapers:
    'A stack of papers is not a judgment. Ask what each document proves, what it does not prove, and whether it connects this exact plaintiff to this exact receivable and amount.',
  courtPhrase:
    'I am not asking the Court to ignore documents. I am asking what each document proves, what it does not prove, and whether it connects this exact plaintiff to this exact receivable and amount.',
};

export const DEFENSE_PLAYBOOK_SECTIONS: DefensePlaybookSection[] = [
  {
    id: 'hearing_scripts',
    title: 'Hearing scripts — short answers',
    eyebrow: 'Script',
    useWhen: 'You have a hearing date, or you are practicing calm answers for summons defense.',
    nextAction: 'Open Court workstation → Written answer / Affidavit → print the one-page court card.',
    track: 'court',
    links: [
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
      { label: 'Validation workstation', href: '/portal/debt?tab=validation' },
    ],
    steps: [
      'Opening: recognize the original account if true; state that plaintiff must still prove ownership, transfer, and amount.',
      'If asked “Was it your account?”: recognize the original creditor account; do not admit plaintiff ownership or amount.',
      'If asked “Do you owe the balance?”: you cannot agree without account-level transfer records, governing agreement, and complete balance calculation.',
      'If plaintiff says you never disputed: a prior dispute is not the transfer document. Plaintiff still must prove its claim.',
      'If new records appear at trial: request time to review identifiers, exhibits, sale conditions, and balances before responding.',
      'Closing: recognition of the original account is not proof of plaintiff’s ownership, authority, or amount — request judgment for defendant if links are unproven.',
    ],
    courtSafePhrases: [
      'I recognize the original account. My defense is that plaintiff still must prove this named entity owns this specific receivable, that it was validly transferred, and that the amount is accurate.',
      'I cannot agree that I owe this plaintiff this amount without the account-level transfer records, the governing agreement, and a complete balance calculation.',
      'These documents appear central. I request time to review the identifiers, referenced exhibits, sale conditions and balances before being required to respond.',
    ],
    doNotSay: [
      'Do not deny the original account if it was yours.',
      'Do not say securitization “paid” the debt.',
      'Do not claim “no wet ink” automatically wins.',
      'Do not call documents fraudulent without proof.',
      'Do not admit the lawsuit balance.',
    ],
    lawAnchors: ['real_party', 'ucc_9404', 'fdcpa_1692e'],
  },
  {
    id: 'cross_exam_sequence',
    title: 'Cross-examination sequence',
    eyebrow: 'Questions',
    useWhen: 'Plaintiff brings a witness or affidavit; you need ordered questions, not arguments.',
    nextAction: 'Use Court coach chips → Discovery / Motion to compel if answers are vague.',
    track: 'court',
    links: [
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
      { label: 'CFPB debt collection', href: 'https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-collector-en-329/', external: true },
    ],
    steps: [
      'Entity & authority: Who owns the receivable today? Is that the named plaintiff? Owner, servicer, secured party, collector, or attorney client?',
      'Assignment & conditions: What document transferred this account? Does the bill of sale name you or your account? Closing, eligibility, exclusion, recall, repurchase conditions?',
      'Account-level proof: Where is the row identifying this exact account? Field codes? Who created the file? Balance at transfer?',
      'Amount & add-ons: Final statement → charge-off → sale → lawsuit balance. What agreement authorizes every interest, fee, cost?',
      'Witness foundation: Did they work for the original creditor? Create records? Participate in the sale? Understand field definitions? Independently verify the balance?',
      'If vague: ask the Court to give limited weight unless account-specific records and a competent witness are before the Court.',
    ],
    courtSafePhrases: [
      'I ask the Court to give limited weight to that conclusion unless the underlying account-specific record and a witness capable of explaining it are before the Court.',
    ],
    lawAnchors: ['ucc_9406', 'real_party'],
  },
  {
    id: 'document_audit',
    title: 'Document audit grid',
    eyebrow: 'Packet review',
    useWhen: 'You received a packet, bill of sale, affidavits, or sale-file excerpts.',
    nextAction: 'Upload packet to Debt case proof → open Validation or Court letter for assignment demand.',
    track: 'validation',
    links: [
      { label: 'Debt Letters overview', href: '/portal/debt' },
      { label: 'Validation letters', href: '/portal/debt?tab=validation' },
    ],
    steps: [
      'Agreement: exact product, version, amendments, arbitration, interest, and fee terms.',
      'Bill of sale: parties match complaint; effective date; portfolio description; conditions; exclusions.',
      'Sale file: account-level row; last four; balance; sale date; field definitions; eligibility.',
      'Statements: final statements; last payment; charge-off; credits; transaction trail.',
      'Entity authority: owner vs servicer vs collector; agency, POA, or assignment authorization.',
      'Witness proof: personal knowledge, record adoption, data import, source-system understanding, calculation ability.',
      'Hunt legal mismatches — not “missing paperwork” alone: wrong named plaintiff, bill of sale without schedule, undefined field codes, unmet sale conditions, unauthorized balance.',
    ],
    lawAnchors: ['ucc_9406', 'fdcpa_809'],
  },
  {
    id: 'amount_audit',
    title: 'Amount audit — attack the dollars',
    eyebrow: 'Balance chain',
    useWhen: 'Ownership looks stronger than the math, or fees/interest appear after charge-off.',
    nextAction: 'Ask plaintiff to walk the math; use FDCPA leverage only when facts support unauthorized charges.',
    track: 'court',
    links: [
      { label: 'FTC debt collection', href: 'https://www.ftc.gov/debt-collection', external: true },
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
    ],
    steps: [
      'Map the chain: last reliable statement → last payment → charge-off → sale balance → plaintiff system → lawsuit amount → court costs.',
      'Interest: agreement authorization? Post-charge-off? Rate changes?',
      'Fees: late, annual, NSF, and costs must be authorized by agreement or law.',
      'Credits: refunds, chargebacks, payments, adjustments must reduce the amount.',
      'Sale balance must reconcile with charge-off and demand.',
      'Court costs: permitted by rule/law and not double-counted into account balance.',
      'Court ask: a single affidavit balance is not a calculation — demand the documents for each dollar.',
    ],
    courtSafePhrases: [
      'I ask plaintiff to walk the Court through the math. A single balance in an affidavit is not a calculation.',
    ],
    lawAnchors: ['fdcpa_1692f', 'fdcpa_1692e'],
  },
  {
    id: 'receivable_flow',
    title: 'Receivable flow & securitization (correct use)',
    eyebrow: 'Advanced',
    useWhen: 'Plaintiff mentions trusts, investors, or portfolio sales — and you need court-safe framing.',
    nextAction: 'Do not claim “funds paid the debt.” Trace ownership of the specific receivable.',
    track: 'court',
    links: [
      { label: 'Cornell LII — UCC Art. 9', href: 'https://www.law.cornell.edu/ucc/9', external: true },
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
    ],
    steps: [
      'Ask what property transferred: account, receivable, principal, finance charges, servicing rights, or collection rights.',
      'Ask default treatment: retained, removed, reassigned, repurchased, substituted, or sold after charge-off.',
      'Ask authority to sell: what proves the seller owned the receivable on the sale date.',
      'Ask double-transfer risk: could another trust/affiliate claim a superior interest.',
      'Proof standard: identify the missing assignment, reassignment, repurchase, or ownership document — do not argue mystery.',
    ],
    courtSafePhrases: [
      'I am not saying financial transfers automatically discharged the account. I am asking plaintiff to trace ownership of the specific receivable and show that this entity acquired enforceable rights from an entity that actually had them.',
    ],
    doNotSay: ['Do not say “securitization paid it off.”', 'Do not overclaim that trusts void every debt.'],
    lawAnchors: ['ucc_9404', 'ucc_9406'],
  },
  {
    id: 'advanced_pressure',
    title: 'If they produce a strong packet',
    eyebrow: 'Advanced layer',
    useWhen: 'Account-level papers look complete — pivot to conditions, Article 9, consumer law, settlement.',
    nextAction: 'Pull the exact card agreement; review arbitration carve-outs; check licensing/capacity carefully.',
    track: 'all',
    links: [
      { label: 'CFPB credit card agreements', href: 'https://www.consumerfinance.gov/credit-cards/agreements/', external: true },
      { label: 'Laws & Rights Reference', href: '/portal/debt?tab=overview#laws-rights-reference' },
    ],
    steps: [
      'Arbitration clause: find the exact historical agreement; note small-claims carve-outs.',
      'Sale conditions: “upon closing,” eligible accounts, exclusions, warranties, recalls, repurchases, data delivery.',
      'Receivable tracing: sold, pledged, repurchased, removed from a trust, or transferred through affiliates?',
      'Article 9: assignee takes subject to applicable defenses and recoupment from the original transaction.',
      'False status/amount: wrong owner, wrong balance, unsupported fees → FDCPA / state collection pressure when facts support.',
      'Licensing/capacity: fact-specific; pressure ≠ automatic erase of principal.',
      'Winning language: show the legal condition, document, authority, amount, and entity status that makes this claim enforceable today — not “the debt vanished.”',
    ],
    courtSafePhrases: [
      'If plaintiff relies on a transfer, I ask whether the transfer included this receivable, whether every condition was met, and whether the named plaintiff is the entity authorized to enforce it.',
    ],
    lawAnchors: ['ucc_9404', 'fdcpa_1692e', 'licensing'],
  },
  {
    id: 'case_logic',
    title: 'Case logic (persuasive examples)',
    eyebrow: 'Reasoning',
    useWhen: 'You need principles — not magic citations — for account-level proof.',
    nextAction: 'Use lessons to frame questions; do not treat foreign-jurisdiction cases as local guarantees.',
    track: 'court',
    links: [
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
    ],
    steps: [
      'Lesson A: admitting use of an unspecified original account does not concede account-specific debt-buyer ownership.',
      'Lesson B: bill of sale + statements can still fail without the account-level sale-file link.',
      'Lesson C: a conclusory ownership affidavit without assignment documents may be insufficient at summary judgment — test conclusions against records.',
      'Limiting reality: matched statements, sale records, identifiers, and a competent witness weaken the basic proof attack — then pivot to amount, entity, conditions, Article 9, consumer law, settlement.',
      'Court phrasing: ask for the account-level link; do not deny reality.',
    ],
    courtSafePhrases: [
      'The cases I reviewed teach why account-level transfer proof matters. I am asking for that same basic connection in this case.',
    ],
  },
  {
    id: 'settlement_fallback',
    title: 'Settlement without surrender',
    eyebrow: 'Settlement',
    useWhen: 'Settlement is offered, or proof looks strong and you need controlled risk.',
    nextAction: 'Read for judgment vs dismissal; never sign a consent judgment you do not understand.',
    track: 'settlement',
    links: [
      { label: 'Debt Letters overview', href: '/portal/debt' },
      { label: 'CFPB dealing with debt collectors', href: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-negotiate-a-settlement-with-a-debt-collector-en-1447/', external: true },
    ],
    steps: [
      'Before signing, check: judgment or no judgment; total amount; interest; court costs; default clause; payment schedule; credit reporting; dismissal terms; release; tax language; late-payment consequence; admission of liability.',
      'Safe response: willing to review a settlement — not admitting liability — not signing a consent judgment without understanding full legal effect.',
      'Request: dismissal upon completion; no judgment if current; written balance; no added interest; clear credit-reporting language; written release; no confession of judgment; cure period; proof the accepting entity is authorized.',
      'When settlement may still be smart: clean account-level chain, solid witness, accurate balance, no consumer-law defects — shift objective to reduction, time, no judgment, reporting terms.',
    ],
    courtSafePhrases: [
      'I am willing to review a settlement, but I am not admitting liability and I am not signing a consent judgment without understanding the full legal effect.',
    ],
  },
  {
    id: 'court_card',
    title: 'One-page hearing card',
    eyebrow: 'Court card',
    useWhen: 'Hearing day — print and keep on the table.',
    nextAction: 'Print this section + open Court workstation for filings.',
    track: 'court',
    links: [
      { label: 'Court workstation', href: '/portal/debt?tab=court' },
      { label: 'Validation workstation', href: '/portal/debt?tab=validation' },
    ],
    steps: [
      'Opening: recognize original account; dispute ownership, authority, account-level transfer, and amount; ask plaintiff to prove each link.',
      'Five questions: Who owns the receivable? Is that the named plaintiff? Where is the account-level sale record? How is the balance calculated? What does this witness actually know?',
      'Three requests: judgment for defendant if unproven; continuance if central documents appear first at trial; limited weight for records not tied to account-level source + competent witness.',
      'Closing: recognition ≠ proof of ownership/authority/amount — request judgment for defendant.',
    ],
    doNotSay: [
      'Do not say the account was not yours if it was.',
      'Do not say securitization paid it.',
      'Do not say no wet ink automatically wins.',
      'Do not call documents fraudulent without proof.',
      'Do not admit the lawsuit balance.',
    ],
  },
  {
    id: 'bureau_crossover',
    title: 'Bureau track crossover',
    eyebrow: 'Credit Letters',
    useWhen: 'The same account is also reporting on credit — after (or alongside) validation/court work.',
    nextAction: 'Open Credit Letters → Bureaus for FCRA disputes; keep debt-buyer court work in Debt Letters.',
    track: 'bureau',
    links: [
      { label: 'Credit Letters', href: '/portal/letters' },
      { label: 'CFPB credit report disputes', href: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-an-error-on-my-credit-report-en-313/', external: true },
    ],
    steps: [
      'Do not conflate FDCPA validation with FCRA bureau disputes — different tracks, different portals.',
      'After validation or court updates, dispute inaccurate furnishing with bureaus using factual findings from screenshots.',
      'Furnisher disputes can run in parallel when reporting remains inaccurate after investigation windows.',
      'Log every round in the portal so evidence stays auditable.',
    ],
    lawAnchors: ['fcra_611', 'fcra_623'],
  },
  {
    id: 'written_answer_playbook',
    title: 'Written answer — contested issues',
    eyebrow: 'Pleadings',
    useWhen: 'Summons served; hearing approaching; you need a short contested answer, not a manifesto.',
    nextAction: 'Litigation Command → Build Written answer + certificate of service. Admit only what is true.',
    track: 'court',
    links: [
      { label: 'Litigation Command', href: '/portal/debt?tab=litigation&stage=answer' },
      { label: 'Written answer letter', href: '/portal/debt?tab=litigation&stage=answer' },
    ],
    steps: [
      'Caption: match court name, case number, parties exactly as on the summons.',
      'Admit only undisputed identity/original-account facts you can honestly state; deny plaintiff ownership, amount, and authority you cannot verify.',
      'Affirmative defenses to preserve: standing/real party, lack of account-level assignment, amount/fee defects, hearsay/foundation, SOL if facts support, FDCPA setoff/counterclaim if collector on pleadings.',
      'Certificate of service: serve plaintiff counsel at the address on the summons the same day you file.',
      'Do not argue securitization theories in the answer — save for discovery and hearing questions.',
    ],
    courtSafePhrases: [
      'Defendant admits only those facts expressly stated as admitted. Defendant denies that the named plaintiff has proven ownership, authority, account-level transfer, and the amount claimed.',
    ],
    doNotSay: [
      'Do not admit the lawsuit balance.',
      'Do not deny the original account if it was yours.',
      'Do not plead “securitization paid the debt.”',
    ],
    lawAnchors: ['real_party', 'small_claims_foundation'],
  },
  {
    id: 'discovery_pressure',
    title: 'Discovery pressure — force the file',
    eyebrow: 'Discovery',
    useWhen: 'Answer filed (or due); you need account-level sale file, ledger, and witness foundation before hearing.',
    nextAction: 'Litigation Command → Defendant discovery set; compel if answers are evasive.',
    track: 'court',
    links: [
      { label: 'Discovery letters', href: '/portal/debt?tab=litigation&stage=discovery' },
      { label: 'Motion to compel', href: '/portal/debt?tab=litigation&stage=discovery' },
      { label: 'Assignment chain (validation)', href: '/portal/debt?tab=validation' },
    ],
    steps: [
      'RFP: card agreement, bill of sale, sale schedule naming this account, complete ledger, charge-off, and all assignments.',
      'Interrogatories: who owns the receivable today; who created the sale file; field-code definitions; how the lawsuit balance was calculated.',
      'RFAs: lock admissions that the bill of sale does not name your account, or that affiant did not create original records.',
      'If responses are vague: motion to compel with a short statement of what is missing and why it matters for standing/amount.',
      'Hearing use: unreadiness without account-level docs → request continuance or judgment for defendant if burden unmet.',
    ],
    courtSafePhrases: [
      'I ask for the account-level sale record and the calculation behind the demanded balance — not a summary affidavit alone.',
    ],
    lawAnchors: ['ucc_9406', 'real_party'],
  },
  {
    id: 'fdcpa_counterclaim_track',
    title: 'FDCPA counterclaim track (when facts fit)',
    eyebrow: 'Counterclaim',
    useWhen: 'Complaint or counsel communications use mini-Miranda / collector status, wrong amount, or false legal status — and you can tie facts to documents.',
    nextAction: 'Confirm collector status on pleadings; outline FDCPA counterclaim only with specific false statements.',
    track: 'court',
    links: [
      { label: 'FDCPA counterclaim outline', href: '/portal/debt?tab=litigation' },
      { label: 'Post-suit validation', href: '/portal/debt?tab=validation' },
      { label: 'Cornell FDCPA', href: 'https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-V', external: true },
    ],
    steps: [
      'Identify the exact sentence that misstates amount, legal status, or entity role.',
      'Preserve: validation demand if still collecting; counterclaim outline if plaintiff is a debt collector on the pleadings.',
      'Damages and procedure are fact-specific — do not claim automatic payday.',
      'Settlement leverage: compliance risk can support dismissal or reduction without admitting liability.',
    ],
    doNotSay: ['Do not invent FDCPA damages without injury and procedure.'],
    lawAnchors: ['fdcpa_1692e', 'fdcpa_1692f'],
  },
  {
    id: 'docket_strategy',
    title: 'Docket strategy — work the calendar',
    eyebrow: 'Docket',
    useWhen: 'You have a register of actions / docket PDF with hearing, answer, or motion dates.',
    nextAction: 'Upload docket in Litigation Command scraper → set hearing date → work the nearest deadline first.',
    track: 'court',
    links: [
      { label: 'Litigation Command', href: '/portal/debt?tab=litigation&stage=intake' },
    ],
    steps: [
      'Extract: case number, hearing/trial date, counsel, prior orders, and whether an answer appears filed.',
      'Priority order when days are short: (1) appear/defend, (2) written answer if still open, (3) affidavit of dispute, (4) focused discovery, (5) hearing card.',
      'Bring a one-page court card plus the scrape summary — not a binder of internet theories.',
      'If a new exhibit appears first at hearing: request time to review identifiers and balances before responding.',
    ],
    courtSafePhrases: [
      'These documents appear central. I request time to review the identifiers, exhibits, and balances before being required to respond.',
    ],
    lawAnchors: ['small_claims_foundation'],
  },
];

export function searchDefensePlaybook(query: string): DefensePlaybookSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return DEFENSE_PLAYBOOK_SECTIONS;
  return DEFENSE_PLAYBOOK_SECTIONS.filter((s) => {
    const hay = [s.title, s.eyebrow, s.useWhen, s.nextAction, ...s.steps, ...(s.courtSafePhrases ?? []), ...(s.doNotSay ?? [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

export function defenseSectionsForTrack(track: DefenseTrack): DefensePlaybookSection[] {
  if (track === 'all') return DEFENSE_PLAYBOOK_SECTIONS;
  return DEFENSE_PLAYBOOK_SECTIONS.filter((s) => s.track === track || s.track === 'all');
}
