/**
 * Affiliate Referral Toolkit — chapter content for /affiliate-toolkit/read.
 * Solution-first voice. No income guarantees. Partner terminology.
 */

export const AFFILIATE_TOOLKIT_PATH = '/affiliate-toolkit';
export const AFFILIATE_TOOLKIT_READ_PATH = '/affiliate-toolkit/read';
export const AFFILIATE_GUIDE_ID = 'affiliate-referral-toolkit' as const;

export const AFFILIATE_TOOLKIT_META = {
  shortTitle: 'Affiliate Referral Toolkit',
  compliance:
    'Educational only · results vary · no income guarantees · not legal advice · funding subject to underwriting',
};

export type AffiliateToolkitSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  callout?: string;
};

export type AffiliateToolkitChapter = {
  id: string;
  number: string;
  title: string;
  kicker: string;
  subtitle: string;
  teaser: string;
  sections: AffiliateToolkitSection[];
};

export const AFFILIATE_TOOLKIT_CHAPTERS: AffiliateToolkitChapter[] = [
  {
    id: 'kit-overview',
    number: '01',
    title: 'What this toolkit does',
    kicker: 'Start here',
    subtitle: 'Clean links, clear lanes, compliant copy — then a 30-day launch cadence.',
    teaser: 'Your kit at a glance',
    sections: [
      {
        paragraphs: [
          'You refer. Finely Cred runs the credit, debt, and funding workflows. This toolkit shows you how to match each prospect to the right funnel and keep attribution clean.',
          'Use partner language in every public message. Never promise scores, deletions, settlements, or lawsuit outcomes.',
        ],
        bullets: [
          'Generate tracked links and QR codes from your affiliate hub',
          'Match restore · debt · business · score lanes to the prospect’s real need',
          'Ship compliant social and email copy without outcome guarantees',
          'Run a simple 30-day launch calendar that compounds warm intros',
        ],
      },
    ],
  },
  {
    id: 'lane-match',
    number: '02',
    title: 'Lane matching that converts',
    kicker: 'Fit',
    subtitle: 'Send people to the guide that solves the problem they actually named.',
    teaser: 'Right funnel, right first step',
    sections: [
      {
        bullets: [
          'Credit report negatives / score drag → Personal Credit Restore + dispute guide',
          'Collector calls, validation, summons → Debt eradication guide (validation suggested; bureau optional)',
          'Business funding readiness → Business credit power guide',
          'Utilization / mix / timing → Score boost roadmap',
          'Career interest (CS / Agency / AU) → that career page, not a generic signup wall',
        ],
        callout:
          'Doctrine reminder for debt prospects: summons is primary when a lawsuit is open; validation is the suggested default; bureau letters stay optional. After a validation letter is sent, collectors must cease collection — including suit — until they properly validate. Never guarantee case outcomes.',
      },
    ],
  },
  {
    id: 'links-attribution',
    number: '03',
    title: 'Links, codes, and attribution',
    kicker: 'Track',
    subtitle: 'First clean capture wins — protect the path from click to signup.',
    teaser: 'Keep credit for the intro',
    sections: [
      {
        paragraphs: [
          'Always share your tracked link or code. Bare URLs and screenshot CTAs without your code leak attribution.',
        ],
        bullets: [
          'Pin one primary link in bio; rotate secondary links by campaign',
          'QR codes for live events — test scan before you print',
          'Capture happens at first form submit; don’t stack competing codes',
          'Confirm payout rules inside your affiliate hub — never invent rates in DMs',
        ],
      },
    ],
  },
  {
    id: 'compliant-copy',
    number: '04',
    title: 'Compliant promo copy',
    kicker: 'Voice',
    subtitle: 'Solution-first, active, honest. Capability — not hype.',
    teaser: 'What you can say',
    sections: [
      {
        bullets: [
          'Lead with the outcome path (“upload → analyze → draft letters”) not a promised score',
          'Use “partners,” not “clients/customers,” in public copy',
          'Add: Results vary · not legal advice · funding subject to underwriting',
          'Never claim you are an attorney or guarantee lawsuit results',
        ],
        callout:
          'Good: “Start the free validation playbook, then open the portal when you’re ready.” Bad: “We erase debts / win every lawsuit.”',
      },
    ],
  },
  {
    id: 'assets',
    number: '05',
    title: 'Assets you can ship this week',
    kicker: 'Kit',
    subtitle: 'Guides, one-sheets, and invite cards — book-first, clutter-second.',
    teaser: 'What to send',
    sections: [
      {
        bullets: [
          'E-guide landings with Read free + capture (dispute, debt, business, score, agency)',
          'Career pages for CS / Agency / Affiliate / AU when someone wants to earn with Finely',
          'Digital invite cards for warm intros',
          'One-sheets for business credit and fundability when the prospect is funding-minded',
        ],
      },
    ],
  },
  {
    id: 'launch-30',
    number: '06',
    title: '30-day launch cadence',
    kicker: 'Cadence',
    subtitle: 'Four weeks that build a repeatable referral rhythm.',
    teaser: 'Day-by-day momentum',
    sections: [
      {
        bullets: [
          'Week 1: Claim hub access, set primary link, post one lane story + disclaimer',
          'Week 2: Warm intros — 10 personal messages with the matching guide',
          'Week 3: Host or join one live Q&A; QR + single CTA',
          'Week 4: Follow up on open clicks; log wins as process stories (no guaranteed outcomes)',
        ],
        callout: 'Income examples are illustrative. Results vary. No guarantees.',
      },
    ],
  },
  {
    id: 'hub-next',
    number: '07',
    title: 'Open the affiliate hub',
    kicker: 'Next step',
    subtitle: 'Links, payouts, and materials live in-product after you join the path.',
    teaser: 'Where work happens',
    sections: [
      {
        paragraphs: [
          'When you are ready to operate, open the affiliate hub for live links, path selection, and payout visibility. Keep using this toolkit as your public playbook.',
        ],
        bullets: [
          'Join / path select on /affiliate',
          'Operate inside /affiliate/hub after access',
          'Ask Finely in chat for lane-matching help anytime',
        ],
      },
    ],
  },
];

export function affiliateToolkitChapterIndex(q: string): number {
  const asNum = Number(q);
  if (Number.isFinite(asNum) && asNum >= 1 && asNum <= AFFILIATE_TOOLKIT_CHAPTERS.length) return asNum - 1;
  const byId = AFFILIATE_TOOLKIT_CHAPTERS.findIndex((c) => c.id === q);
  return byId >= 0 ? byId : 0;
}
