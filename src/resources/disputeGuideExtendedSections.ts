import type { GeneratedGuidePage } from './disputeLetterGuideContent';

/** Restored + upgraded chapters from the original Finely dispute letter guide — consumer voice throughout. */
export const DISPUTE_GUIDE_EXTENDED_PAGES: GeneratedGuidePage[] = [
  {
    id: 'fcra-rights',
    title: 'Your FCRA Rights (After You Pull Your Report)',
    subtitle: 'What you learn when you research — and how to use it without sounding like a lawyer',
    sections: [
      {
        paragraphs: [
          'Most people only discover the Fair Credit Reporting Act after something goes wrong — a denial, a deposit requirement, a rate that makes no sense. You pulled your report, compared it to your life, and realized the file does not tell a true story. That is when FCRA becomes your backbone — not your opening sentence.',
          'Under 15 U.S.C. § 1681i, you have the right to dispute incomplete or inaccurate information. The credit reporting agency must conduct a reasonable reinvestigation — usually within 30 days — and notify you of the results in writing.',
        ],
      },
      {
        heading: 'What you can demand (in plain English)',
        bullets: [
          'Deletion or correction of tradelines, balances, dates, or payment history that do not match reality.',
          'Method of verification — how the furnisher validated the account (not a one-word “verified” form letter).',
          'Updated copies of your report after reinvestigation showing what changed.',
          'A reinvestigation that considers the exhibits you attached — not a rubber-stamp e-OSCAR click.',
        ],
      },
      {
        heading: 'How to talk about FCRA in your letter',
        bullets: [
          'Lead with what you noticed and how it hurt you — then mention you researched your rights under FCRA § 1681i.',
          'Do not paste statute blocks without tying them to a specific field on your report.',
          'One account per letter keeps your FCRA request focused and harder to dismiss as frivolous.',
        ],
      },
      {
        heading: 'Willful noncompliance (when they ignore you)',
        paragraphs: [
          'When a CRA or furnisher willfully fails to comply with FCRA requirements, statutory damages may apply ($100 to $1,000 per violation) plus actual damages. That is why your paper trail — certified mail, dates, exhibits — matters more than sending ten angry letters.',
        ],
      },
    ],
  },
  {
    id: 'ocr-metro2-survival',
    title: 'OCR & Metro2 — Make Your Letter Survive the Machine',
    subtitle: 'Bureaus scan first, humans read second — format for both',
    sections: [
      {
        paragraphs: [
          'Bureau intake often runs your letter through OCR (optical character recognition) before a person ever sees it. Neon fonts, wild templates, all-caps rage paragraphs, and shotgun disputes get flagged as “frivolous” or templated — even when your facts are solid.',
          'Metro2 is the data language furnishers use. Your job is not to become a coder — it is to spot when the fields on your report contradict each other (status vs payment grid, balance vs limit, dates that do not timeline).',
        ],
      },
      {
        heading: 'OCR-friendly letter rules',
        bullets: [
          'Plain white paper, black ink, standard 11–12 pt font (Arial or Times).',
          'Hand-sign in ink — no stamp signatures for bureau disputes.',
          'One tradeline per letter — OCR flags multi-account “delete everything” letters.',
          'Number your factual reasons; reference exhibits by label (Exhibit A, B).',
          'Avoid ALL CAPS shouting, clip art, and obvious mail-merge markers.',
        ],
      },
      {
        heading: 'Metro2 contradictions worth screenshotting',
        bullets: [
          'Status says “Current” or “Paid” but payment history shows 90-day lates.',
          'Balance exceeds credit limit with no explanation.',
          'Date of first delinquency (DOFD) does not match the payment grid story.',
          'Same account reports differently on Equifax vs Experian vs TransUnion.',
          'Collection status vs original creditor fields — name or balance mismatch.',
        ],
      },
      {
        heading: 'Power move',
        paragraphs: [
          'Circle the exact conflicting field on your screenshot exhibit — guide the analyst’s eye. A reviewer who sees a clean contradiction often overrides a lazy “verified” response in Round 2.',
        ],
      },
    ],
  },
  {
    id: 'online-traps',
    title: 'Online Dispute Traps',
    subtitle: 'Why certified mail beats one-click bureau portals when the stakes are real',
    sections: [
      {
        paragraphs: [
          'Online dispute buttons feel easy — but when you have been denied for an apartment or a car loan, “easy” is not the same as effective. Portals often limit what you can say, hide your full paper trail, and sometimes bury terms that weaken your position.',
          'For serious inaccuracies — the ones blocking your life — certified mail creates a dated record you can escalate to CFPB, your state attorney general, or counsel if needed.',
        ],
      },
      {
        heading: 'Waiving leverage when disputing online',
        bullets: [
          'Character limits prevent detailed, evidence-linked arguments tied to Metro2 fields.',
          'Some flows produce no durable PDF of what you submitted — only a confirmation screen.',
          'You may not receive method-of-verification details in writing when they click “verified.”',
          'Multiple items in one web form = shotgun dispute pattern — same OCR problem as letters.',
        ],
      },
      {
        heading: 'When online is acceptable',
        bullets: [
          'Simple factual errors with obvious proof (wrong address, duplicate account, wrong employer).',
          'Identity-theft blocks when the bureau provides a dedicated fraud process.',
          'Always download or screenshot confirmation and any response — store in Evidence vault.',
        ],
      },
    ],
  },
  {
    id: 'letter-stream',
    title: 'Letter Stream & Certified Mail Workflow',
    subtitle: 'Your repeatable mailing system — one person, one account, one paper trail',
    sections: [
      {
        paragraphs: [
          'A letter stream is how disciplined consumers win: one tradeline per letter, certified mail, copies of everything, dates logged like a case file. You are building a timeline a regulator or attorney can follow — not venting into the void.',
        ],
      },
      {
        heading: 'Before you mail',
        bullets: [
          'Print on plain white paper with black ink — OCR-friendly (see prior chapter).',
          'Hand-sign each letter; wet ink matters for bureau disputes.',
          'Attach only exhibits that prove this specific claim — label Exhibit A, B, C.',
          'Keep a complete copy: letter + exhibits + envelope front + certified receipt.',
          'Log sent date in Tasks; set follow-up for day 35 (30-day FCRA window + buffer).',
        ],
      },
      {
        heading: 'Mailing checklist',
        bullets: [
          'USPS Certified Mail with Return Receipt — keep tracking + green card.',
          'Use the bureau dispute address on your report — not a random P.O. from a blog.',
          'Include ID + proof of address when the bureau requests identity verification.',
          'When the response arrives, scan it the same day and link to the same project/task.',
        ],
      },
      {
        heading: 'Round discipline',
        bullets: [
          'Round 1: one clean inaccuracy claim with minimum proof — personal opening (your story first), then your FCRA rights.',
          'Round 2: new contradictions from the bureau or furnisher response — never recycle the same paragraph.',
          'Never mix unrelated accounts in one envelope stream — open a new letter per tradeline.',
        ],
      },
    ],
  },
  {
    id: 'complaints',
    title: 'Complaints & Escalation',
    subtitle: 'When reinvestigation stalls — escalate with documentation, not emotion',
    sections: [
      {
        paragraphs: [
          'If you did the work — pulled your report, mailed certified, attached exhibits — and still get a boilerplate “verified” with no method of verification, escalation is rational. Regulators respond to timelines and copies, not caps-lock anger.',
        ],
      },
      {
        heading: 'CFPB — Consumer Financial Protection Bureau',
        bullets: [
          'File at consumerfinance.gov/complaint when a CRA or large furnisher mishandles your dispute.',
          'Attach: your letter, tracking, bureau response, exhibits, and a one-page timeline.',
          'Reference FCRA § 1681i reinvestigation duty and method-of-verification request.',
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
        heading: 'State Attorney General & BBB',
        bullets: [
          'Many states accept consumer credit reporting complaints — search “[your state] attorney general consumer complaint.”',
          'BBB complaints can prompt corporate review (not a legal ruling) and supplement your timeline.',
        ],
      },
    ],
  },
  {
    id: 'validation-first-doctrine',
    title: 'Validation First — Challenge Before You Pay',
    subtitle: 'Finely Cred doctrine — never default to paying charge-offs or collections as step one',
    sections: [
      {
        paragraphs: [
          'When collections or charge-offs show up on your report, the industry wants you to pay first and ask questions later. That often does not fix reporting — and it waives leverage. Our approach: challenge accuracy and demand validation on your terms before any payment conversation.',
          'This is educational strategy, not legal advice. If you receive a summons or garnishment notice, consult a licensed attorney the same week.',
        ],
      },
      {
        heading: 'FDCPA §809 validation sequence (collections)',
        bullets: [
          'Within 30 days of the collector’s first written communication, send a validation request (certified mail).',
          'Collector must cease collection until it validates — demand chain of assignment, signed agreement, itemization.',
          'Write in your own words: explain how the unknown debt is affecting your credit and housing goals — then cite your validation rights.',
          'If validation is insufficient, escalate with affidavit of dispute and CFPB/state AG documentation.',
        ],
      },
      {
        heading: 'What we never default to',
        bullets: [
          'Settling for less as step one — settlement remarks can block funding for years.',
          'Pay-for-delete without a written contract — verbal promises fail.',
          'Paying charge-offs to “help” score without field-level dispute — often does not remove history.',
          'Paying unvalidated debt because of pressure — validation first, payment only with counsel/strategy.',
        ],
      },
    ],
  },
  {
    id: 'law-per-negative',
    title: 'Law Per Negative — Match the Statute to the Account',
    subtitle: 'Each tradeline type has a governing challenge framework — cite the law after you tell your story',
    sections: [
      {
        paragraphs: [
          'After you explain what you noticed and how it hurt you, the right statute gives your letter teeth. Letter Studio and Reasons OS attach these citations based on negative type — one clean claim per letter, never a statute dump.',
        ],
      },
      {
        heading: 'Charge-off / collection',
        bullets: [
          'FCRA §1681s-2(a)(1)(A) — accuracy; Metro2 status vs payment grid contradictions.',
          'FDCPA §1692g — validation before collection continues (collector targets).',
          'State collector licensing — unlicensed collector may not collect in your state.',
        ],
      },
      {
        heading: 'Inquiries & re-aging',
        bullets: [
          'FCRA §1681b — permissible purpose for inquiries you do not recognize.',
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
    ],
  },
  {
    id: 'affidavit-court-system',
    title: 'Affidavits & Court Response System',
    subtitle: 'When validation is ignored or a summons arrives before your mail',
    sections: [
      {
        paragraphs: [
          'Sometimes collectors sue before you finish mailing. Sometimes they ignore validation entirely. An affidavit of dispute is a sworn statement of your position — not magic, but a structured record that you challenged the debt and lack knowledge of a valid contract.',
        ],
      },
      {
        heading: 'Affidavit of dispute',
        bullets: [
          'Sworn statement that you dispute the debt and lack knowledge of a valid contract.',
          'Supports answer/motion when plaintiff cannot produce chain of title or signed agreement.',
          'Store in Documents vault — link to debt case in portal.',
          'Use plain language: what you noticed, what you requested, what was never provided.',
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
          'Different from FCRA bureau disputes — use the right framework for the right target.',
        ],
      },
    ],
  },
];
