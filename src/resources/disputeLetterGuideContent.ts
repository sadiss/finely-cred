import type { FreeGuide } from './freeGuides';

/** Canonical content for the Free Credit Dispute Letter Guide PDF. */

export const DISPUTE_LETTER_GUIDE_ID = 'credit-dispute-letter-guide' as const;

/** Legacy image pages — embedded when assets exist; skipped gracefully otherwise. */
export const DISPUTE_LETTER_GUIDE_IMAGE_PAGES = [
  '/guides/credit-dispute-letter-guide/page-01.png',
  '/guides/credit-dispute-letter-guide/page-02.png',
  '/guides/credit-dispute-letter-guide/page-03.png',
  '/guides/credit-dispute-letter-guide/page-04.png',
  '/guides/credit-dispute-letter-guide/page-05.png',
  '/guides/credit-dispute-letter-guide/page-06.png',
  '/guides/credit-dispute-letter-guide/page-07.png',
  '/guides/credit-dispute-letter-guide/page-08.png',
  '/guides/credit-dispute-letter-guide/page-09.png',
  '/guides/credit-dispute-letter-guide/page-10.png',
  '/guides/credit-dispute-letter-guide/page-11.png',
  '/guides/credit-dispute-letter-guide/page-12.png',
  '/guides/credit-dispute-letter-guide/page-13.png',
] as const;

export const DISPUTE_LETTER_GUIDE_COVER = '/guides/credit-dispute-letter-guide/cover.png';

export type GeneratedGuidePage = {
  id: string;
  title: string;
  subtitle?: string;
  sections: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
};

/** Full programmatic body — client-ready; no internal editor notes. */
export const DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES: GeneratedGuidePage[] = [
  {
    id: 'fcra-rights',
    title: 'Your FCRA Rights',
    subtitle: 'What the Fair Credit Reporting Act guarantees when you dispute inaccurate information',
    sections: [
      {
        paragraphs: [
          'Under 15 U.S.C. Section 1681i, you have the right to dispute incomplete or inaccurate information on your credit report. The credit reporting agency must conduct a reasonable reinvestigation — usually within 30 days — and notify you of the results.',
        ],
      },
      {
        heading: 'What you can request',
        bullets: [
          'Deletion or correction of inaccurate tradelines, balances, dates, or payment history.',
          'Method of verification — how the furnisher validated the account.',
          'Updated copies of your report after reinvestigation.',
        ],
      },
      {
        heading: 'Willful noncompliance',
        paragraphs: [
          'When a CRA or furnisher willfully fails to comply with FCRA requirements, statutory damages may apply ($100 to $1,000 per violation) plus actual damages. Documentation — not volume — wins disputes.',
        ],
      },
    ],
  },
  {
    id: 'five-step-framework',
    title: 'The 5-Step Dispute Framework',
    subtitle: 'One tradeline per letter, evidence-first, disciplined follow-up',
    sections: [
      {
        heading: 'Step 1 — Identify the target item',
        bullets: [
          'Pull your report and isolate ONE negative tradeline per letter.',
          'Screenshot exact fields: status, balance, dates, payment history grid.',
          'Store evidence in your Documents vault before you draft.',
        ],
      },
      {
        heading: 'Step 2 — Choose your dispute lane',
        bullets: [
          'Inaccurate reporting: internal contradictions across Metro2 fields.',
          'Unverifiable: creditor cannot produce signed agreement or chain of title.',
          'Incomplete: missing required data elements on the tradeline.',
        ],
      },
      {
        heading: 'Step 3 — Structure the letter',
        bullets: [
          'Opening: identity, bureau address, concise request for investigation.',
          'Body: numbered reasons tied to evidence — not emotional arguments.',
          'Closing: deadline for response, request for method of verification, signature block.',
        ],
      },
      {
        heading: 'Step 4 — Attach minimum proof',
        bullets: [
          'Only attach what proves the specific claim — over-attaching weakens the file.',
          'Label exhibits (Exhibit A, B) and reference them in the letter body.',
          'Keep copies of everything sent; track dates in your portal Tasks board.',
        ],
      },
      {
        heading: 'Step 5 — Follow-up cadence',
        bullets: [
          'Round 1: wait for bureau response, then re-evidence what changed.',
          'Round 2: tighten the same claim with new contradictions from responses.',
          'Never mix unrelated items in one letter — it reads as shotgun dispute.',
        ],
      },
    ],
  },
  {
    id: 'example-letter',
    title: 'Example Dispute Letter',
    subtitle: 'Adapt this template — replace bracketed fields with your facts',
    sections: [
      {
        paragraphs: [
          '[Your Full Name]',
          '[Your Address]',
          '[City, State ZIP]',
          '[Date]',
          '',
          '[Credit Bureau Name]',
          '[Bureau Dispute Address]',
          '',
          'Re: Dispute of Inaccurate Information — Account #[XXXX]',
          '',
          'To Whom It May Concern:',
          '',
          'I am writing to dispute inaccurate information on my credit report pursuant to the Fair Credit Reporting Act, 15 U.S.C. Section 1681i.',
          '',
          'The following account is reporting inaccurately:',
          '- Creditor: [Creditor Name]',
          '- Account number: [Last 4 digits only]',
          '- Reason for dispute: [Specific inaccuracy — e.g., balance, status, dates]',
          '',
          'I have enclosed [Exhibit A: supporting document] demonstrating that this reporting is incorrect. Please conduct a reasonable reinvestigation and provide the method of verification used.',
          '',
          'Please send me updated copies of my credit report reflecting any corrections within 30 days as required by law.',
          '',
          'Sincerely,',
          '[Handwritten Signature]',
          '[Printed Name]',
        ],
      },
    ],
  },
  {
    id: 'online-traps',
    title: 'Online Dispute Traps',
    subtitle: 'Why certified mail beats one-click bureau portals',
    sections: [
      {
        paragraphs: [
          'Online dispute forms are convenient but often limit what you can assert, waive certain procedural rights, and produce no durable paper trail. For serious inaccuracies, mail creates a defensible record.',
        ],
      },
      {
        heading: 'Waiving your rights when disputing online',
        bullets: [
          'Some bureau portals include terms that limit your ability to escalate or pursue certain remedies.',
          'Character limits prevent detailed, evidence-linked arguments.',
          'You may not receive method-of-verification details in writing.',
        ],
      },
      {
        heading: 'When online is acceptable',
        bullets: [
          'Simple factual errors with obvious proof (wrong address, duplicate account).',
          'Identity-theft blocks when the bureau provides a dedicated fraud process.',
          'Always download or screenshot confirmation and any response.',
        ],
      },
    ],
  },
  {
    id: 'letter-stream',
    title: 'Letter Stream',
    subtitle: 'How to mail disputes so they survive OCR and create a defensible paper trail',
    sections: [
      {
        paragraphs: [
          'A letter stream is your repeatable mailing workflow: one tradeline per letter, certified mail, copies of everything, and dates logged in your portal Tasks board.',
        ],
      },
      {
        heading: 'Before you mail',
        bullets: [
          'Print on plain white paper with black ink — avoid neon fonts, all-caps shouting, or obvious template markers.',
          'Hand-sign each letter; do not rely on stamped signatures for bureau disputes.',
          'Attach only exhibits that prove the specific claim (label them Exhibit A, B, C).',
          'Keep a complete copy of what you send (letter + exhibits + envelope front).',
        ],
      },
      {
        heading: 'Mailing checklist',
        bullets: [
          'USPS Certified Mail with Return Receipt (keep tracking + green card).',
          'Send to the bureau dispute address listed on your report — not a generic P.O. if a street address is published.',
          'Log sent date in Tasks; set a follow-up task for day 35 (30-day FCRA window + buffer).',
          'When the response arrives, scan it immediately and link it to the same project/task.',
        ],
      },
      {
        heading: 'Round discipline',
        bullets: [
          'Round 1: one clean inaccuracy claim with minimum proof.',
          'Round 2: new contradictions from the bureau or furnisher response — never recycle the same reason code.',
          'Never mix unrelated accounts in one letter; OCR flags shotgun disputes as frivolous.',
        ],
      },
    ],
  },
  {
    id: 'complaints',
    title: 'Complaints and Escalation',
    subtitle: 'When reinvestigation stalls — escalate with documentation, not emotion',
    sections: [
      {
        paragraphs: [
          'If a credit reporting agency or furnisher fails to conduct a reasonable reinvestigation, you may escalate using formal complaint channels. Always attach your paper trail: sent letters, tracking, responses, and exhibits.',
        ],
      },
      {
        heading: 'CFPB — Consumer Financial Protection Bureau',
        bullets: [
          'File at consumerfinance.gov/complaint when a CRA or large furnisher mishandles your dispute.',
          'Include dates, account identifiers, and copies of your dispute + response.',
          'Reference FCRA Section 611 (reinvestigation) and method-of-verification requirements where applicable.',
        ],
      },
      {
        heading: 'FTC — Federal Trade Commission',
        bullets: [
          'Report identity theft and certain CRA/furnisher patterns at ReportFraud.ftc.gov.',
          'Useful when fraud accounts persist after proper identity-theft documentation was submitted.',
        ],
      },
      {
        heading: 'State Attorney General and BBB',
        bullets: [
          'Many states accept consumer credit reporting complaints — search your state attorney general consumer complaint portal.',
          'BBB complaints can prompt corporate review (not a legal ruling) and supplement your timeline.',
        ],
      },
    ],
  },
  {
    id: 'validation-first-doctrine',
    title: 'Validation First — Never Pay as Default',
    subtitle: 'Challenge debt on your terms before any payment conversation',
    sections: [
      {
        paragraphs: [
          'Finely Cred doctrine: we challenge inaccurate reporting and unvalidated debts — we do not default to paying charge-offs, collections, or settlements as a first option. Payment without validation waives leverage and may not fix reporting.',
        ],
      },
      {
        heading: 'FDCPA §809 validation sequence',
        bullets: [
          'Within 30 days of the collector’s first written communication, send a validation request (certified mail).',
          'Collector must cease collection until it validates — demand chain of assignment, signed agreement, itemization.',
          'If validation is insufficient, escalate with affidavit of dispute and CFPB/state AG pattern documentation.',
          'Educational only — not legal advice. Consult counsel for active lawsuits or garnishment.',
        ],
      },
      {
        heading: 'What we never default to',
        bullets: [
          'Settling for less as step one — settlement remarks can block funding for years.',
          'Pay-for-delete without written contract — verbal promises fail.',
          'Paying charge-offs to “help” score without field-level dispute — often does not remove history.',
        ],
      },
    ],
  },
  {
    id: 'law-per-negative',
    title: 'Law Per Negative — Cite the Right Statute',
    subtitle: 'Each tradeline type has a governing challenge framework',
    sections: [
      {
        heading: 'Charge-off / collection',
        bullets: [
          'FCRA §1681s-2(a)(1)(A) — accuracy; Metro2 status vs payment grid contradictions.',
          'FDCPA §1692g — validation before collection continues.',
          'State collector licensing — unlicensed collector may not collect in your state.',
        ],
      },
      {
        heading: 'Inquiries & re-aging',
        bullets: [
          'FCRA §1681b — permissible purpose for inquiries.',
          'FCRA §1681c — DOFD anchors 7-year reporting; re-aged DOFD is an accuracy dispute.',
        ],
      },
      {
        heading: 'Foreclosure / garnishment / summons',
        bullets: [
          'Respond to summons on deadline — affidavit of dispute supports lack of valid contract.',
          'Wage garnishment: verify judgment validity, proper service, exemption laws — counsel required.',
          'Foreclosure: evaluate bankruptcy stay options (Ch. 7 vs 13) with licensed attorney.',
        ],
      },
      {
        paragraphs: [
          'Letter Studio and Reasons OS attach these citations to drafts based on the negative type you select — one clean claim per letter.',
        ],
      },
    ],
  },
  {
    id: 'affidavit-court-system',
    title: 'Affidavits & Court Response System',
    subtitle: 'When validation is ignored or a summons arrives first',
    sections: [
      {
        heading: 'Affidavit of dispute',
        bullets: [
          'Sworn statement that you dispute the debt and lack knowledge of a valid contract.',
          'Supports answer/motion when plaintiff cannot produce chain of title or signed agreement.',
          'Store in Documents vault — link to debt case in portal.',
        ],
      },
      {
        heading: 'If summons arrives before validation mail',
        bullets: [
          'Calendar the response deadline immediately — procedure beats slogans.',
          'File answer + affidavit; assert FDCPA validation was never provided if applicable.',
          'Challenge proper service — defective service may void judgment.',
          'Never ignore court mail — consult licensed attorney same week.',
        ],
      },
      {
        heading: 'UCC & contract challenges (educational)',
        bullets: [
          'UCC §3-308 — party enforcing instrument bears burden of proof.',
          'Debt buyers often lack original note and assignment chain — validation exposes gaps.',
        ],
      },
    ],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    subtitle: 'Please read before acting on this guide',
    sections: [
      {
        paragraphs: [
          'This guide is educational material only — not legal advice. Laws and bureau procedures change. Consult a licensed attorney for legal strategy, especially if you receive a summons or judgment.',
          'Finely Cred provides tools and workflows; outcomes depend on facts, documentation, and timing. No result is guaranteed.',
        ],
      },
    ],
  },
];

/** @deprecated Use DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES */
export const DISPUTE_LETTER_GUIDE_GENERATED_PAGES = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES;

export function disputeGuideFromFreeGuide(guide: FreeGuide): GeneratedGuidePage[] {
  return DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES;
}

export const DISPUTE_LETTER_GUIDE_PAGE_COUNT = 1 + DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.length;
