/**
 * Case Desk Operator Guide — handbook for paralegal / attorney / consultant applicants.
 * Educational only. Not legal advice. Debt & summons guide remains the validation prerequisite.
 */

import { LAW_REFERENCES, REGULATORY_PORTALS } from '../../lib/legalResources';

export const CASE_DESK_GUIDE_PATH = '/case-desk-guide';
export const CASE_DESK_GUIDE_READ_PATH = '/case-desk-guide/read';
export const CASE_DESK_CAREERS_PATH = '/careers/case-help';
export const DEBT_GUIDE_PREREQ_PATH = '/free-debt-guide';
export const DEBT_GUIDE_PREREQ_READ_PATH = '/free-debt-guide/read';

export const CASE_DESK_GUIDE_META = {
  title: 'Case Desk Operator Guide',
  shortTitle: 'Case Desk Guide',
  edition: 'Operator handbook · v1',
  tagline: 'Packet anatomy. Scope discipline. Validation first. Escalate with evidence.',
  description:
    'Free Case Desk Operator handbook — how Finely Cred case help works assigned partner matters: packets, scope, validation-first sequence, escalation portals, and complaint ladders.',
  valueLabel: 'Free · no signup to read',
  compliance:
    'Educational platform handbook · not legal advice · attorney applicants must be licensed where they practice · results vary · not an offer of employment',
} as const;

export type CaseDeskGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
  resources?: Array<{ label: string; href: string; note?: string; external?: boolean }>;
};

export type CaseDeskGuideChapter = {
  id: string;
  number: number;
  sheet: string;
  kicker: string;
  title: string;
  subtitle: string;
  readMinutes: number;
  accent: 'stone' | 'rose' | 'emerald' | 'sky' | 'amber';
  sections: CaseDeskGuideSection[];
};

const LAW_LINKS = LAW_REFERENCES.filter((l) =>
  ['fdcpa-1692g', 'fdcpa-1692e', 'fcra-611', 'fcra-623'].includes(l.id),
).map((l) => ({ label: l.label, href: l.href, note: l.hint, external: true as const }));

const PORTAL_LINKS = REGULATORY_PORTALS.map((p) => ({
  label: p.label,
  href: p.href,
  note: p.hint,
  external: true as const,
}));

const CHAPTER_INPUTS: Array<Omit<CaseDeskGuideChapter, 'number'>> = [
  {
    id: 'welcome',
    sheet: '01',
    kicker: 'Orientation',
    title: 'What the case desk is',
    subtitle: 'Assigned partner matters. Scoped access. Finely runs intake and the platform.',
    readMinutes: 3,
    accent: 'stone',
    sections: [
      {
        paragraphs: [
          'The Finely Cred case desk is not a job board and not a law firm. Approved paralegals, attorneys/counsel, and consultants work assigned partner debt and litigation matters with audited, revocable access.',
          'You see only the partners you are assigned. Letter studio, evidence vault, docket timelines, and escalation routes ship with the role. Pricing, offers, and platform-wide access stay with Finely.',
        ],
        bullets: [
          'Paralegal — prepare packets, dockets, and timelines; never advise or appear',
          'Attorney / counsel — licensed review of formal answers, affidavits, discovery; engagement terms per matter',
          'Consultant — debt-buyer pattern reads and validation sequencing education — never presented as legal advice',
        ],
        callout:
          'Prerequisite: read the Debt & summons guide first so validation clocks and FDCPA notice duties are second nature before you touch a case file.',
        resources: [
          {
            label: 'Debt & summons guide (prerequisite)',
            href: DEBT_GUIDE_PREREQ_PATH,
            note: 'Validation clocks · FDCPA · summons checklist',
          },
          { label: 'Apply to the case desk', href: CASE_DESK_CAREERS_PATH },
        ],
      },
    ],
  },
  {
    id: 'packet-anatomy',
    sheet: '02',
    kicker: 'Craft',
    title: 'Packet anatomy',
    subtitle: 'Every file is a stack: papers, proof, letter chain, and a next-date clock.',
    readMinutes: 5,
    accent: 'amber',
    sections: [
      {
        heading: 'What belongs in a working packet',
        bullets: [
          'Cover: partner name (internal), matter caption, track (validation / court / escalation), next deadline',
          'Court or collector papers: summons, complaint, first contact letter, billing statements',
          'Evidence: account screenshots, mail receipts, call log, credit tradeline captures',
          'Letter chain: validation Round 1 → deficiency → final demand (PDFs + CMRR proofs)',
          'Authority map: named plaintiff vs servicer vs original creditor — who claims what',
        ],
      },
      {
        heading: 'Track separation (non-negotiable)',
        paragraphs: [
          'Validation letters never mix into court filings. Court answers never replace a validation chain. Escalation complaints (CFPB / AG / BBB) attach the letter chain as evidence — they do not invent new facts.',
        ],
        callout: 'If the packet is messy, stop drafting. Re-file the stack before you escalate.',
      },
    ],
  },
  {
    id: 'scope',
    sheet: '03',
    kicker: 'Guardrails',
    title: 'Scope discipline',
    subtitle: 'Per-partner access. Logged sessions. Revocable when the matter closes.',
    readMinutes: 4,
    accent: 'rose',
    sections: [
      {
        paragraphs: [
          'Scope is the product. You never receive raw platform-wide partner lists. Admin assigns matters after review; access is logged and can be pulled when the engagement ends.',
        ],
        bullets: [
          'Work only assigned matters — no browsing other partner files',
          'Video sessions are scheduled and notes write back to the file',
          'Non-attorney roles: prepare and organize — do not advise or appear as counsel',
          'Attorney roles: licensed where you practice; engagement terms set per matter',
          'You do not set pricing or make offers to partners',
        ],
        callout: 'If a request is outside your approved file, stop and route it to Finely intake.',
      },
    ],
  },
  {
    id: 'validation-first',
    sheet: '04',
    kicker: 'Sequence',
    title: 'Validation-first doctrine',
    subtitle: 'Force proof before collection pressure. Court clocks override everything else.',
    readMinutes: 5,
    accent: 'emerald',
    sections: [
      {
        paragraphs: [
          'When a partner faces a collector or debt buyer, the default sequence is validation first — demand account-level proof, licensing, and chain of title before negotiating payment.',
          'A summons changes the ranking. Answer deadlines are primary. Validation and bureau work continue in parallel when useful, but default judgment risk outranks a tidy letter chain.',
        ],
        bullets: [
          'Day 0: first written contact → start the 30-day validation window (FDCPA § 1692g)',
          'Do not admit the debt, promise payment, or negotiate until validation is complete',
          'Incomplete packets get a deficiency notice — not silence',
          'If sued: calendar the answer deadline immediately; packet the summons into Litigation Command',
          'Bureau disputes are optional support — never a substitute for court or validation clocks',
        ],
        resources: LAW_LINKS,
        callout: 'Results vary · not legal advice · verify court rules and facts in the partner’s jurisdiction.',
      },
    ],
  },
  {
    id: 'when-to-escalate',
    sheet: '05',
    kicker: 'Judgment call',
    title: 'When to escalate',
    subtitle: 'Climb only after the written chain is honest and the evidence is attached.',
    readMinutes: 4,
    accent: 'sky',
    sections: [
      {
        heading: 'Escalate when',
        bullets: [
          'Collector keeps collecting or reporting after a complete validation demand',
          'Response is a generic bill of sale or statement with no account-level match',
          'Unlicensed collector in the partner’s state (research first, then file)',
          'Harassment, false threats, or imposter / fraud patterns',
          'Active lawsuit with standing or amount gaps — regulatory pressure in parallel with court',
        ],
      },
      {
        heading: 'Do not escalate when',
        bullets: [
          'The letter chain is incomplete or mailing proof is missing',
          'Facts are still unverified (wrong identity, mixed accounts)',
          'You are asking a regulator to decide a court case for the partner',
        ],
        callout: 'Escalation without evidence wastes the partner’s credibility. Attach the vault.',
      },
    ],
  },
  {
    id: 'complaint-ladder',
    sheet: '06',
    kicker: 'Portals',
    title: 'Complaint ladder',
    subtitle: 'CFPB → state AG → FTC fraud → BBB — real buttons, real evidence.',
    readMinutes: 5,
    accent: 'amber',
    sections: [
      {
        paragraphs: [
          'The ladder is ordered pressure, not a spray of complaints on day one. Finish the validation (or court) chain, then climb with PDFs attached.',
        ],
        bullets: [
          'CFPB — debt collection & credit reporting misconduct',
          'State AG (NAAG Find AG) — consumer protection / licensing',
          'FTC Report Fraud — imposters and fraud collectors',
          'BBB — business complaint trail (supplemental, not a substitute for CFPB/AG)',
        ],
        resources: PORTAL_LINKS,
      },
      {
        heading: 'Statute anchors',
        paragraphs: ['Quote the right section in plain English. Link Cornell LII when you need the full text.'],
        resources: LAW_LINKS,
        callout: CASE_DESK_GUIDE_META.compliance,
      },
    ],
  },
  {
    id: 'apply',
    sheet: '07',
    kicker: 'Next step',
    title: 'Apply with a clear file',
    subtitle: 'Pick Paralegal, Attorney, or Consultant — then wait for scope approval.',
    readMinutes: 2,
    accent: 'stone',
    sections: [
      {
        paragraphs: [
          'Applications are reviewed by hand. When approved, Finely grants scoped portal access and assigns the first matter. There is no hub promise on a bare apply — claim comes after approval.',
        ],
        bullets: [
          'Apply → Scope approval → Assigned matter → Letters/evidence → Escalation portals',
          'Keep the Debt & summons guide open as your validation prerequisite',
          'Use Ask Finely / Dispute Coach for educational sequencing questions while you wait',
        ],
        resources: [
          { label: 'Apply to the case desk', href: CASE_DESK_CAREERS_PATH },
          { label: 'Read Debt & summons guide', href: DEBT_GUIDE_PREREQ_READ_PATH },
        ],
      },
    ],
  },
];

export const CASE_DESK_GUIDE_CHAPTERS: CaseDeskGuideChapter[] = CHAPTER_INPUTS.map((ch, i) => ({
  ...ch,
  number: i + 1,
}));

export function caseDeskGuideChapterIndex(idOrIndex: string | number): number {
  if (typeof idOrIndex === 'number') {
    if (idOrIndex >= 1 && idOrIndex <= CASE_DESK_GUIDE_CHAPTERS.length) return idOrIndex - 1;
    return 0;
  }
  const idx = CASE_DESK_GUIDE_CHAPTERS.findIndex((c) => c.id === idOrIndex);
  return idx >= 0 ? idx : 0;
}
