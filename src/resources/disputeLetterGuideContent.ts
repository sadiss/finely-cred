import type { FreeGuide } from './freeGuides';
import { CONSUMER_EXAMPLE_LETTER_LINES } from '../letters/consumerDisputeVoice';
import { buildFiveStepGuidePages } from '../letters/disputeLetterTemplate';
import { DISPUTE_GUIDE_EXTENDED_PAGES } from './disputeGuideExtendedSections';

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

export const DISPUTE_LETTER_GUIDE_COVER = '/free-guide-cover.png';

export type GeneratedGuidePage = {
  id: string;
  title: string;
  subtitle?: string;
  sections: { heading?: string; paragraphs?: string[]; bullets?: string[] }[];
};

/** Full programmatic body — client-ready; no internal editor notes. */
export const DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES: GeneratedGuidePage[] = [
  {
    id: 'five-step-overview',
    title: 'The 5-Step Dispute Framework',
    subtitle: 'One tradeline per letter · your own words · evidence-first · disciplined follow-up',
    sections: [
      {
        paragraphs: [
          'This is the Finely Cred method: identify one target, choose your lane, write in your own words (not a template mill), attach minimum proof, and follow up with round discipline.',
          'Each step in this guide is expanded on its own page — work them in order. Your letters should explain what you noticed, how it is hurting your life, that you pulled your report and learned your FCRA rights, then point to specific facts and exhibits.',
        ],
      },
    ],
  },
  ...buildFiveStepGuidePages(),
  {
    id: 'example-letter',
    title: 'Example Dispute Letter',
    subtitle: 'Written in your own words — adapt bracketed fields to your facts',
    sections: [
      {
        paragraphs: CONSUMER_EXAMPLE_LETTER_LINES,
      },
    ],
  },
  ...DISPUTE_GUIDE_EXTENDED_PAGES,
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

export const DISPUTE_LETTER_GUIDE_INTRO = {
  title: 'Your guide is ready',
  subtitle: 'Personalized introduction — educational only, not legal advice.',
} as const;

export const DISPUTE_LETTER_GUIDE_PAGE_COUNT = 2 + DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.length;
