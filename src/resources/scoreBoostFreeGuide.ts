import type { FreeGuide } from './freeGuides';

export const SCORE_BOOST_GUIDE_ID = 'score-boost-72-roadmap' as const;

/** FreeGuide stub for funnel attribution / PDF kit index — body lives in scoreRoadmapContent. */
export const SCORE_BOOST_FREE_GUIDE: FreeGuide = {
  id: SCORE_BOOST_GUIDE_ID,
  title: 'Boost Your Credit Score in 72 Hours',
  desc: 'Sequenced 72-hour credit score roadmap: baseline pull, utilization control, disciplined disputes, inquiry budgeting, and fundability timing. Results vary · not legal or financial advice · funding subject to underwriting.',
  sections: [
    {
      heading: 'The 72-hour mission',
      bullets: [
        'Lock your funding target before you touch the file.',
        'Hours 0–24: pull reports, map utilization, freeze panic apps.',
        'Hours 24–48: paydown timing against statement closes.',
        'Hours 48–72: inquiry budget + dispute priorities that move the needle.',
      ],
    },
    {
      heading: 'What you can do next',
      bullets: [
        'Open the in-app reader at /free-score-roadmap/read — no email required.',
        'Download the printable roadmap after capture.',
        'Book a session when you want a specialist to sequence with you.',
      ],
    },
    {
      heading: 'Disclaimer',
      bullets: [
        'Educational only; not legal or financial advice. Results vary. Funding subject to underwriting.',
      ],
    },
  ],
};
