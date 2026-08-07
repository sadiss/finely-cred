/**
 * Real Estate Operator Guide — in-app chapter content.
 * Built from realEstatePartnerPlaybook + Fannie summaries + WIIFM + scripts.
 * Educational only. Partner terminology. Solution-first voice.
 */

import {
  FANNIE_AU_RULE_SUMMARIES,
  REAL_ESTATE_COMPLIANCE_FOOTNOTES,
  REAL_ESTATE_ONBOARDING_STEPS,
  REAL_ESTATE_PLAYBOOK_LEVERS,
  REAL_ESTATE_QUESTION_SCRIPTS,
  REAL_ESTATE_WIIFM,
} from '../../config/realEstatePartnerPlaybook';

export const RE_GUIDE_PATH = '/real-estate-guide';
export const RE_GUIDE_READ_PATH = '/real-estate-guide/read';
export const RE_CAREERS_PATH = '/careers/real-estate';
/** Buyer-facing score checklist — secondary only on RE careers. */
export const RE_SCORE_ROADMAP_PATH = '/free-score-roadmap';

export type RealEstateGuideScript = {
  label: string;
  lines: Array<{ speaker: 'you' | 'buyer'; text: string }>;
};

export type RealEstateGuideSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
  script?: RealEstateGuideScript;
  checklist?: { label: string; items: string[] };
  resources?: Array<{ label: string; href: string; note?: string }>;
};

export type RealEstateGuideChapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  kicker: string;
  teaser: string;
  accent: 'gold' | 'sky' | 'emerald' | 'rose';
  sections: RealEstateGuideSection[];
};

export const RE_GUIDE_META = {
  title: 'Real Estate Operator Guide',
  shortTitle: 'RE Operator Guide',
  tagline: 'You refer · Finely runs the credit work · you keep the closing',
  description:
    'Free operator handbook for real estate affiliates: WIIFM, question scripts, Fannie AU/DTI summaries, seven readiness levers, and lender rescore prep — without promising approvals.',
  compliance: REAL_ESTATE_COMPLIANCE_FOOTNOTES[0]!,
  edition: 'Finely Cred edition',
  valueLabel: 'Free',
} as const;

type ChapterInput = Omit<RealEstateGuideChapter, 'number'>;

const CHAPTER_INPUTS: ChapterInput[] = [
  {
    id: 'wiifm',
    title: 'What’s in it for you',
    subtitle: 'You refer. Finely runs credit. You keep the relationship and the closing.',
    kicker: 'Start here',
    teaser: 'The split that stops contracts from dying at the credit pull.',
    accent: 'gold',
    sections: [
      {
        heading: 'The operator posture',
        paragraphs: [
          'You are a referring partner and a timing coach — not a credit repair operator. Spot the buyer or seller whose credit is blocking the contract, hand them a tracked link, and stay looped on milestones so the lender package lands when the deal needs it.',
          'Finely specialists pull reports, send findings-based dispute letters, prep AU optics, and package paydown proof for the loan officer. You keep the relationship and the closing.',
        ],
        callout: 'Solution-first: give the blocked file a real lane. Never promise an approval, a score, or a closing date.',
      },
      {
        heading: 'You refer',
        bullets: [...REAL_ESTATE_WIIFM.youRefer],
      },
      {
        heading: 'Finely runs the credit work',
        bullets: [...REAL_ESTATE_WIIFM.finelyRuns],
      },
      {
        heading: 'What’s in it for the agent',
        bullets: [...REAL_ESTATE_WIIFM.agentWins],
      },
    ],
  },
  {
    id: 'scripts',
    title: 'Question scripts that open the lane',
    subtitle: 'Say the honest thing. Hand the tracked link. Let Finely run the file.',
    kicker: 'Field skill',
    teaser: 'Five chips you can say at the kitchen table or in the car after a lender “no.”',
    accent: 'sky',
    sections: [
      {
        heading: 'Use these lines as openers — not guarantees',
        paragraphs: [
          'Each script names a real next step. Pair it with your referral link and the Operator Guide. If the partner wants depth on utilization or AU, send them into Finely — you stay on timing.',
        ],
      },
      ...REAL_ESTATE_QUESTION_SCRIPTS.map((s) => ({
        heading: s.label,
        script: {
          label: s.label,
          lines: [
            { speaker: 'you' as const, text: s.script.replace(/^“|”$/g, '') },
            {
              speaker: 'buyer' as const,
              text: 'What do I do next?',
            },
            {
              speaker: 'you' as const,
              text: 'Open this link, upload your reports, and a Finely specialist will run the credit work. I’ll stay on milestones with you.',
            },
          ],
        },
      })),
    ],
  },
  {
    id: 'seven-levers',
    title: 'Seven readiness levers',
    subtitle: 'What you explain. Where Finely runs it. Lender-dependent — never hype.',
    kicker: 'Toolkit',
    teaser: 'AU optics, DTI, own-card util, inquiries, collections, disputes, and rescore prep.',
    accent: 'emerald',
    sections: [
      {
        heading: 'Coach the concept. Finely runs the workflow.',
        paragraphs: [
          'You do not have to be the technician. Each lever below is a lawful readiness move our specialists already operate inside Finely OS. Prefer “may / often / lender-dependent” language with buyers and loan officers.',
        ],
      },
      ...REAL_ESTATE_PLAYBOOK_LEVERS.map((l) => ({
        heading: l.title,
        paragraphs: [l.howItHelps, `Underwriter caveat: ${l.underwriterCaveat}`],
        bullets: l.bullets,
        resources: [
          { label: l.finelyCtaLabel, href: l.finelyCtaPath, note: 'Finely route' },
          ...(l.secondaryCtaPath && l.secondaryCtaLabel
            ? [{ label: l.secondaryCtaLabel, href: l.secondaryCtaPath, note: 'Secondary' }]
            : []),
        ],
      })),
    ],
  },
  {
    id: 'fannie',
    title: 'Fannie AU & DTI — say this accurately',
    subtitle: 'Educational summaries from Selling Guide themes. Verify the live guide before a live file.',
    kicker: 'Underwriting',
    teaser: 'DU may consider AU; manual UW often excludes it; AU ≠ automatic DTI relief.',
    accent: 'gold',
    sections: [
      {
        heading: 'Why this page exists',
        paragraphs: [
          'Agents lose credibility when they market AU as a DTI fix or promise DU will “count” every tradeline. Use these summaries to stay accurate — then verify the current Fannie Mae Selling Guide and the specific lender’s overlays.',
        ],
        callout: 'AU ≠ DTI by default. Score/optics treatment and DTI treatment are separate analyses.',
      },
      ...FANNIE_AU_RULE_SUMMARIES.map((r) => ({
        heading: r.citation,
        paragraphs: [
          r.rule,
          ...(r.effectiveNote ? [`Effective note: ${r.effectiveNote}`] : []),
        ],
      })),
      {
        heading: 'Official research',
        resources: [
          {
            label: 'Fannie Mae Selling Guide',
            href: 'https://selling-guide.fanniemae.com/',
            note: 'Verify before advising a live file',
          },
          {
            label: 'NAAG — find your AG',
            href: 'https://www.naag.org/find-my-ag/',
            note: 'State Attorney General directory',
          },
        ],
      },
    ],
  },
  {
    id: 'handoff',
    title: 'Five-step handoff to lender-ready',
    subtitle: 'From affiliate signup to rescore prep — each step is a real Finely route.',
    kicker: 'Onboarding',
    teaser: 'Handshake → restore lane → disputes → AU optics → lender package.',
    accent: 'sky',
    sections: [
      {
        heading: 'The rail',
        paragraphs: [
          'Steps 2–5 are run by Finely specialists once you make the handoff. Your job is the tracked referral and the timing conversation with the loan officer.',
        ],
        checklist: {
          label: 'Operator checklist',
          items: REAL_ESTATE_ONBOARDING_STEPS.map((s) => `${s.order}. ${s.title} — ${s.body}`),
        },
      },
      {
        heading: 'Rapid rescore vs report refresh',
        paragraphs: [
          'Rapid rescore is lender-initiated with proof — often roughly 2–5 business days. Finely helps prep paydown proof and dispute findings. An internal report refresh or soft-pull monitoring update is not the same as lender rapid rescore.',
        ],
        callout: REAL_ESTATE_COMPLIANCE_FOOTNOTES[4],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & next moves',
    subtitle: 'Soft guardrails so every handoff stays educational and sellable.',
    kicker: 'Guardrails',
    teaser: 'Results vary. Not legal advice. Funding subject to underwriting.',
    accent: 'rose',
    sections: [
      {
        heading: 'Always leave room for the lender',
        bullets: [...REAL_ESTATE_COMPLIANCE_FOOTNOTES],
      },
      {
        heading: 'Where to go next',
        paragraphs: [
          'Join the real estate affiliation path to get your tracked link. Hand buyers the Operator Guide first. Use the Score Roadmap only when you need a short buyer-facing utilization checklist — it is secondary to this operator handbook.',
        ],
        resources: [
          { label: 'Real estate careers / apply', href: RE_CAREERS_PATH, note: 'Join the path' },
          { label: 'Score roadmap (buyer checklist)', href: RE_SCORE_ROADMAP_PATH, note: 'Secondary' },
          { label: 'Personal credit restore path', href: '/pricing/personal-credit-restore' },
          { label: 'AU tradelines education', href: '/tradelines?focus=au' },
        ],
        callout: RE_GUIDE_META.compliance,
      },
    ],
  },
];

export const RE_GUIDE_CHAPTERS: RealEstateGuideChapter[] = CHAPTER_INPUTS.map((ch, i) => ({
  ...ch,
  number: String(i + 1).padStart(2, '0'),
}));

export function realEstateGuideChapterIndex(q: string): number {
  const asNum = Number(q);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= RE_GUIDE_CHAPTERS.length) return asNum - 1;
  const byId = RE_GUIDE_CHAPTERS.findIndex((c) => c.id === q);
  return byId >= 0 ? byId : 0;
}
