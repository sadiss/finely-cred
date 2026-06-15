/**
 * Site scan routes — auto-capture targets for tour factory (Playwright recorder).
 * Run: npm run tour:scan
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
    id: 'scan-portal-reports',
    title: 'Upload credit report',
    path: '/portal/reports',
    lane: 'portal',
    selectors: [
      { selector: '[data-fc-report-upload] input[type=file]', label: 'Choose file', narration: 'Click Choose file and select your HTML or PDF bureau export.' },
      { selector: '[data-fc-hub-tab="reports"]', label: 'Credit intel', narration: 'Review parsed tradelines and scores after upload.' },
    ],
  },
  {
    id: 'scan-portal-disputes',
    title: 'Dispute center',
    path: '/portal/disputes',
    lane: 'portal',
    selectors: [
      { selector: 'a[href*="/portal/letters"]', label: 'Letter Studio', narration: 'Open Letter Studio to draft bureau letters.' },
    ],
  },
  {
    id: 'scan-portal-messages',
    title: 'Communication Hub',
    path: '/portal/messages?hub=ai',
    lane: 'portal',
    selectors: [
      { selector: 'input', label: 'Message box', narration: 'Type naturally — AI suggests who can help.' },
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
      { selector: '#monitoring', label: 'Monitoring', narration: 'Pick a tri-bureau monitoring service that supports HTML export.' },
    ],
  },
  {
    id: 'scan-admin-courses',
    title: 'Course builder',
    path: '/admin/courses',
    lane: 'admin',
    selectors: [
      { selector: 'button', label: 'New course', narration: 'Create courses or use AI to generate a full curriculum.' },
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
    waitMs: 900,
  }));
}
