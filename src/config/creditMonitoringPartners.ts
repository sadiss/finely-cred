/** Shared credit monitoring partner cards — Resources, onboarding, marketing. */

const SMART_CREDIT_PID = String(import.meta.env.VITE_SMARTCREDIT_PID ?? '54821').trim() || '54821';

/** True when a non-default affiliate PID is configured for production SmartCredit links. */
export function isSmartCreditPidLive(): boolean {
  const raw = String(import.meta.env.VITE_SMARTCREDIT_PID ?? '').trim();
  return Boolean(raw && raw !== '54821');
}

export type CreditMonitoringAccent = 'emerald' | 'amber' | 'red' | 'sky' | 'slate' | 'violet';

export type CreditMonitoringPartner = {
  provider: string;
  title: string;
  desc: string;
  href: string;
  accent: CreditMonitoringAccent;
  meta: string;
  /** Prefer HTML exports for portal parse quality */
  htmlFriendly: boolean;
};

export const CREDIT_MONITORING_PARTNERS: CreditMonitoringPartner[] = [
  {
    provider: 'MyScoreIQ',
    title: 'Get FICO® Max',
    desc: '3‑bureau reports + FICO® scores, daily monitoring, fraud support, score simulator, and identity theft insurance (AIG).',
    href: 'https://www.myscoreiq.com/get-fico-max.aspx?offercode=432133RQ',
    accent: 'amber',
    meta: 'Personal monitoring',
    htmlFriendly: true,
  },
  {
    provider: 'IdentityIQ',
    title: 'SecurePreferred+',
    desc: '3‑bureau reports & scores (refreshable every 30 days), monitoring, dark web scan, ScoreCasterIQ, and identity insurance (AIG).',
    href: 'https://www.identityiq.com/sc-securepreferred.aspx?offercode=43113820',
    accent: 'red',
    meta: 'Personal monitoring',
    htmlFriendly: true,
  },
  {
    provider: 'SmartCredit',
    title: 'SmartCredit build & monitor',
    desc: 'Tri-merge reports with actionable insights. Popular for HTML exports used in dispute workflows.',
    href: `https://www.smartcredit.com/?PID=${encodeURIComponent(SMART_CREDIT_PID)}`,
    accent: 'sky',
    meta: 'Personal monitoring',
    htmlFriendly: true,
  },
  {
    provider: 'AnnualCreditReport.com',
    title: 'Official free credit reports',
    desc: 'Federally authorized free reports from Equifax, Experian, and TransUnion. Great for baseline accuracy checks.',
    href: 'https://www.annualcreditreport.com/requestReport/landingPage.action',
    accent: 'slate',
    meta: 'Official · free',
    htmlFriendly: false,
  },
];

export const MONITORING_PROVIDER_NAMES = CREDIT_MONITORING_PARTNERS.filter((p) => p.htmlFriendly).map((p) => p.provider);
