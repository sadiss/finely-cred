/**
 * Site scan routes — auto-capture targets for tour factory (Playwright recorder).
 * Run: npm run tour:scan  |  npm run tour:scan:video
 */
export type SiteScanTarget = {
  id: string;
  title: string;
  path: string;
  lane: 'public' | 'portal' | 'admin';
  selectors: Array<{ selector: string; label: string; narration: string }>;
};

export const SITE_SCAN_TARGETS: SiteScanTarget[] = [
  {
    id: 'scan-free-guide',
    title: 'Free dispute letter guide funnel',
    path: '/free-guide',
    lane: 'public',
    selectors: [
      { selector: '#fg-hero', label: 'Hero + video', narration: 'Start here — watch the overview and download the free dispute guide.' },
      { selector: '#fg-preview', label: 'Portal preview', narration: 'See the partner dashboard you unlock with your free trial.' },
      { selector: '#fg-cta', label: 'Get access', narration: 'Enter your name and email — instant PDF download, no card required.' },
    ],
  },
  {
    id: 'scan-home',
    title: 'Homepage overview',
    path: '/',
    lane: 'public',
    selectors: [
      { selector: 'header', label: 'Homepage hero', narration: 'Finely Cred — credit restoration, disputes, and funding readiness in one platform.' },
      { selector: 'a[href="/free-guide"]', label: 'Free guide CTA', narration: 'Download the free dispute letter guide to start DIY restoration.' },
    ],
  },
  {
    id: 'scan-start-here',
    title: 'Start Here onboarding',
    path: '/start-here',
    lane: 'public',
    selectors: [
      { selector: 'main', label: 'Start Here', narration: 'Voice-guided onboarding — pick your lane and get a personalized path.' },
    ],
  },
  {
    id: 'scan-portal-dashboard',
    title: 'Partner dashboard',
    path: '/portal/dashboard',
    lane: 'portal',
    selectors: [
      { selector: '[data-fc-hub-tab="overview"]', label: 'Overview tab', narration: 'Your home base — score, mission control, and next steps.' },
      { selector: '.fc-hub-kpi', label: 'KPI row', narration: 'Track overall score, open tasks, cases, and vault files at a glance.' },
      { selector: '#portal-dash-overview', label: 'Mission control', narration: 'Top improvements ranked — upload reports, run checklist, open Letter Studio.' },
    ],
  },
  {
    id: 'scan-portal-reports',
    title: 'Upload credit report',
    path: '/portal/reports',
    lane: 'portal',
    selectors: [
      { selector: '[data-fc-report-upload] input[type=file], input[type=file]', label: 'Choose file', narration: 'Click Choose file and select your HTML or PDF bureau export.' },
      { selector: '[data-fc-hub-tab="reports"], main', label: 'Credit intel', narration: 'Review parsed tradelines and scores after upload.' },
    ],
  },
  {
    id: 'scan-portal-disputes',
    title: 'Dispute center',
    path: '/portal/disputes',
    lane: 'portal',
    selectors: [
      { selector: 'a[href*="/portal/letters"], button', label: 'Letter Studio', narration: 'Open Letter Studio to draft bureau letters with AI-assisted reasons.' },
    ],
  },
  {
    id: 'scan-portal-letters',
    title: 'Letter Studio',
    path: '/portal/letters',
    lane: 'portal',
    selectors: [
      { selector: 'main', label: 'Letter Studio', narration: 'Build dispute letters, attach evidence, and save to your vault.' },
    ],
  },
  {
    id: 'scan-portal-messages',
    title: 'Communication Hub',
    path: '/portal/messages?hub=ai',
    lane: 'portal',
    selectors: [
      { selector: 'textarea, input[type=text]', label: 'Message box', narration: 'Type naturally — AI suggests who can help and what to do next.' },
    ],
  },
  {
    id: 'scan-portal-training',
    title: 'Training Academy',
    path: '/portal/training/academy',
    lane: 'portal',
    selectors: [
      { selector: 'button', label: 'Start lesson', narration: 'Complete core training before mailing disputes.' },
    ],
  },
  {
    id: 'scan-resources',
    title: 'Resources library',
    path: '/resources',
    lane: 'public',
    selectors: [
      { selector: '#monitoring, #videos', label: 'Resources', narration: 'Guides, monitoring partners, and walkthrough videos.' },
    ],
  },
  {
    id: 'scan-admin-tour-studio',
    title: 'Tour Studio (admin)',
    path: '/admin/tour-studio',
    lane: 'admin',
    selectors: [
      { selector: 'main', label: 'Tour Studio', narration: 'Generate demo videos, run site scanner, and publish to Resources.' },
    ],
  },
];

export function siteScanTargetToTourSteps(target: SiteScanTarget) {
  return target.selectors.map((s, i) => ({
    id: `${target.id}-s${i + 1}`,
    label: s.label,
    narrationPlain: s.narration,
    instructionLines: [s.narration, `Look for the highlighted "${s.label}" control.`],
    action: 'click' as const,
    path: target.path,
    selector: s.selector,
    highlightLabel: s.label,
    waitMs: 1100,
  }));
}
