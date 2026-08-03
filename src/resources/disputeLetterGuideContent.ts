import type { FreeGuide } from './freeGuides';
import { CONSUMER_EXAMPLE_LETTER_LINES } from '../letters/consumerDisputeVoice';
import { buildFiveStepGuidePages } from '../letters/disputeLetterTemplate';
import { DISPUTE_GUIDE_EXTENDED_PAGES } from './disputeGuideExtendedSections';
import { DISPUTE_GUIDE_FRONT_MATTER_PAGES } from './disputeGuideFrontMatter';

/** Canonical content for the Free Credit Dispute Letter Guide PDF + in-app reader. */

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

export const DISPUTE_LETTER_GUIDE_COVER = '/free-guide-cover.png';

/** Reader-only accent rail per chapter. PDF ignores these. */
export type DisputeGuideAccent = 'sky' | 'ink' | 'amber' | 'violet' | 'emerald' | 'rose';

export type GeneratedGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Reader-only: margin annotation set in the report-analyst voice. */
  annotation?: string;
  /** Reader-only: evidence sticky note. */
  evidence?: { label: string; text: string };
  /** Reader-only: discarded vs worked dispute language. */
  comparison?: { badLabel: string; bad: string[]; goodLabel: string; good: string[] };
  /** Reader-only: monospace letter-draft excerpt. */
  letterExcerpt?: string[];
};

export type GeneratedGuidePage = {
  id: string;
  title: string;
  subtitle?: string;
  sections: GeneratedGuideSection[];
  /** Reader-only chapter eyebrow. */
  kicker?: string;
  /** Reader-only accent rail. */
  accent?: DisputeGuideAccent;
  /** Reader-only estimated read time. */
  readMinutes?: number;
};

const EXAMPLE_LETTER_PAGE: GeneratedGuidePage = {
  id: 'example-letter',
  title: 'The Example Letter',
  subtitle: 'A shape to copy — written in your own words, with your own facts',
  kicker: 'Model draft',
  accent: 'ink',
  readMinutes: 4,
  sections: [
    {
      heading: 'How to use this draft',
      paragraphs: [
        'Do not send this letter as written. Send this letter as structured. The opening establishes that a real person with real consequences pulled a real report; the body isolates one account and points at specific fields; the close asks for two concrete things. That skeleton is what survives intake.',
        'Replace every bracket with your facts. If a sentence does not describe something true about your file, delete it rather than softening it.',
      ],
      annotation: 'Read it out loud before you print it. If it sounds like a form, rewrite the opening.',
    },
    {
      heading: 'Round 1 — bureau dispute',
      letterExcerpt: [...CONSUMER_EXAMPLE_LETTER_LINES],
      paragraphs: CONSUMER_EXAMPLE_LETTER_LINES,
    },
    {
      heading: 'Three edits that make it yours',
      bullets: [
        'Name the actual consequence — the specific apartment, the specific loan, the specific deposit. Generic hardship reads as boilerplate.',
        'Number your reasons and tie each one to an exhibit label. Two precise reasons beat six vague ones.',
        'Close by asking for the reinvestigation result in writing and an updated report copy — not for sympathy.',
      ],
      evidence: {
        label: 'Before you seal it',
        text: 'Hand-sign in ink. Plain white paper, black ink, 11–12 pt. Keep a full copy of the letter, exhibits, envelope front, and certified receipt in one folder.',
      },
    },
  ],
};

const OVERVIEW_PAGE: GeneratedGuidePage = {
  id: 'five-step-overview',
  title: 'The 5-Step Dispute Framework',
  subtitle: 'One tradeline per letter · your own words · evidence-first · disciplined follow-up',
  kicker: 'Page 06 · The framework',
  accent: 'sky',
  readMinutes: 4,
  sections: [
    {
      heading: 'The whole method on one page',
      paragraphs: [
        'This is the Finely Cred method: identify one target, choose your lane, write in your own words, attach the minimum proof that carries the claim, then follow up with round discipline. Five steps, each one expanded into its own page later in this guide.',
        'The order is not decorative. Choosing a lane before you have screenshots produces a theory you cannot support. Writing before you have chosen a lane produces a letter that argues four things at once. Following up before you have read their response produces Round 1 sent twice.',
      ],
    },
    {
      heading: 'The five steps',
      bullets: [
        'Step 1 — Identify the target item. One tradeline. The one costing you the most right now.',
        'Step 2 — Choose your dispute lane. Inaccurate, incomplete, inconsistent, or unverifiable. Commit to one.',
        'Step 3 — Structure the letter. Your story first, your rights second, your numbered findings third.',
        'Step 4 — Attach minimum proof. One labelled exhibit per major claim. Nothing decorative.',
        'Step 5 — Follow up on cadence. Day 35 check, then Round 2 built on their answer — never a resend.',
      ],
      annotation: 'Work them in order. Skipping a step is the most common reason a strong claim comes back verified.',
    },
    {
      heading: 'What each step produces',
      paragraphs: [
        'Every step ends with an artifact, not a feeling. If you finish a step with nothing in your folder, you have not finished it.',
      ],
      bullets: [
        'Step 1 produces a labelled screenshot set and a one-line description of what looks wrong.',
        'Step 2 produces a single named lane and the exhibit that supports it.',
        'Step 3 produces a signed one-page letter with numbered findings.',
        'Step 4 produces a labelled exhibit packet — Exhibit A, B, C — referenced in the body.',
        'Step 5 produces a dated timeline: sent, delivered, responded, result, next action.',
      ],
      evidence: {
        label: 'Round discipline',
        text: 'One tradeline per letter. One lane per letter. One bureau per envelope. This is the rule that makes everything else work.',
      },
    },
  ],
};

/** Reader-only chapter framing for pages that come from shared modules. */
const READER_META: Record<string, { kicker?: string; accent?: DisputeGuideAccent; readMinutes?: number }> = {
  'step-1': { kicker: 'Step 01 · Target', accent: 'sky', readMinutes: 5 },
  'step-2': { kicker: 'Step 02 · Lane', accent: 'violet', readMinutes: 5 },
  'step-3': { kicker: 'Step 03 · Structure', accent: 'amber', readMinutes: 5 },
  'step-4': { kicker: 'Step 04 · Proof', accent: 'emerald', readMinutes: 4 },
  'step-5': { kicker: 'Step 05 · Cadence', accent: 'ink', readMinutes: 5 },
  'fcra-rights': { kicker: 'Page 12 · Your rights', accent: 'sky', readMinutes: 5 },
  'ocr-metro2-survival': { kicker: 'Page 13 · Format', accent: 'ink', readMinutes: 5 },
  'online-traps': { kicker: 'Page 14 · Channel', accent: 'rose', readMinutes: 4 },
  'letter-stream': { kicker: 'Page 15 · Workflow', accent: 'emerald', readMinutes: 5 },
  complaints: { kicker: 'Page 16 · Escalation', accent: 'amber', readMinutes: 4 },
  'validation-first-doctrine': { kicker: 'Page 17 · Doctrine', accent: 'violet', readMinutes: 5 },
  'law-per-negative': { kicker: 'Page 18 · Statutes', accent: 'sky', readMinutes: 5 },
  'affidavit-court-system': { kicker: 'Page 19 · Court', accent: 'rose', readMinutes: 5 },
};

function withReaderMeta(page: GeneratedGuidePage): GeneratedGuidePage {
  const meta = READER_META[page.id];
  return meta ? { ...page, ...meta } : page;
}

/** Full programmatic body — partner-ready; no internal editor notes. */
export const DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES: GeneratedGuidePage[] = [
  ...DISPUTE_GUIDE_FRONT_MATTER_PAGES,
  OVERVIEW_PAGE,
  ...buildFiveStepGuidePages().map(withReaderMeta),
  EXAMPLE_LETTER_PAGE,
  ...DISPUTE_GUIDE_EXTENDED_PAGES.map(withReaderMeta),
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    subtitle: 'Please read before acting on this guide',
    kicker: 'Compliance',
    accent: 'ink',
    readMinutes: 1,
    sections: [
      {
        paragraphs: [
          'This guide is educational material only — not legal advice. Laws and bureau procedures change. Consult a licensed attorney for legal strategy, especially if you receive a summons or judgment.',
          'Finely Cred provides tools and workflows; outcomes depend on facts, documentation, and timing. No result is guaranteed. Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
    ],
  },
];

/**
 * PDF renderers only understand heading / paragraphs / bullets, so reader-only
 * blocks are flattened into prose here. Keeps the download as full as the reader.
 */
export function flattenGuidePagesForPdf(pages: GeneratedGuidePage[]): GeneratedGuidePage[] {
  return pages.map((page) => ({
    ...page,
    sections: page.sections.map((sec) => {
      const paragraphs = [...(sec.paragraphs ?? [])];
      const bullets = [...(sec.bullets ?? [])];
      if (sec.comparison) {
        bullets.push(
          ...sec.comparison.bad.map((line) => `${sec.comparison!.badLabel}: ${line}`),
          ...sec.comparison.good.map((line) => `${sec.comparison!.goodLabel}: ${line}`),
        );
      }
      if (sec.annotation) paragraphs.push(`Note — ${sec.annotation}`);
      if (sec.evidence) paragraphs.push(`${sec.evidence.label} — ${sec.evidence.text}`);
      return {
        ...(sec.heading ? { heading: sec.heading } : {}),
        ...(paragraphs.length ? { paragraphs } : {}),
        ...(bullets.length ? { bullets } : {}),
      };
    }),
  }));
}

/** @deprecated Use DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES */
export const DISPUTE_LETTER_GUIDE_GENERATED_PAGES = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES;

export function disputeGuideFromFreeGuide(_guide: FreeGuide): GeneratedGuidePage[] {
  return DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES;
}

export const DISPUTE_LETTER_GUIDE_INTRO = {
  title: 'Your guide is ready',
  subtitle: 'Personalized introduction — educational only, not legal advice.',
} as const;

export const DISPUTE_LETTER_GUIDE_PAGE_COUNT = 2 + DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.length;

export const DISPUTE_LETTER_GUIDE_READ_PATH = '/free-guide/read';
