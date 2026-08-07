import type { FreeGuide } from './freeGuides';

export const AFFILIATE_TOOLKIT_GUIDE_ID = 'affiliate-referral-toolkit' as const;

/** FreeGuide for affiliate funnel PDF / attribution — chapter prose lives in affiliateToolkitGuideContent. */
export const AFFILIATE_TOOLKIT_FREE_GUIDE: FreeGuide = {
  id: AFFILIATE_TOOLKIT_GUIDE_ID,
  title: 'The Affiliate Referral Toolkit',
  desc: 'Compliant referral playbook for Finely Cred affiliates: clean links, lane matching, promo templates, and a 30-day launch cadence. No income guarantees.',
  sections: [
    {
      heading: 'What you can do with this kit',
      bullets: [
        'Generate referral links and QR codes that attribute correctly.',
        'Match each prospect to the right funnel — restore, debt, business, or score.',
        'Ship compliant social and email copy without outcome guarantees.',
        'Run a simple 30-day launch calendar that compounds warm intros.',
      ],
    },
    {
      heading: 'How payouts work (high level)',
      bullets: [
        'Attribution follows the tracked link or code at first capture.',
        'Qualified actions and payout schedules live in your affiliate hub.',
        'Income examples are illustrative — results vary; no guarantees.',
      ],
    },
    {
      heading: 'Disclaimer',
      bullets: [
        'Educational only. Not an employment offer. No income guarantees. Results vary · not legal advice.',
      ],
    },
  ],
};
