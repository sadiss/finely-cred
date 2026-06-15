/**
 * Light theme public go-live — priority routes + readiness hints (admin preview first).
 */

import { isLightThemePublicEnabled } from './finelyThemeAccess';

export type LightThemePriorityRoute = {
  path: string;
  label: string;
  lane: 'public' | 'portal' | 'admin';
};

/** Spot-check these in Light preview before enabling `lightThemePublic`. */
export const LIGHT_THEME_PRIORITY_ROUTES: LightThemePriorityRoute[] = [
  { path: '/', label: 'Landing', lane: 'public' },
  { path: '/start-here', label: 'Start Here', lane: 'public' },
  { path: '/personal-credit', label: 'Personal credit', lane: 'public' },
  { path: '/portal/dashboard', label: 'Partner dashboard', lane: 'portal' },
  { path: '/portal/letters', label: 'Letter Studio', lane: 'portal' },
  { path: '/portal/debt', label: 'Debt center', lane: 'portal' },
  { path: '/admin/dashboard', label: 'Admin dashboard', lane: 'admin' },
  { path: '/admin/workflow', label: 'Ops queue', lane: 'admin' },
  { path: '/admin/phone-hub', label: 'Phone Hub', lane: 'admin' },
];

export function getLightThemeGoLiveReadiness(): {
  publicEnabled: boolean;
  adminPreviewOnly: boolean;
  auditCommand: string;
  priorityCount: number;
  hint: string;
} {
  const publicEnabled = isLightThemePublicEnabled();
  return {
    publicEnabled,
    adminPreviewOnly: !publicEnabled,
    auditCommand: 'npm run theme:audit',
    priorityCount: LIGHT_THEME_PRIORITY_ROUTES.length,
    hint: publicEnabled
      ? 'Light is live for all users — re-run theme:audit after major UI changes.'
      : `Preview Light as admin, spot-check ${LIGHT_THEME_PRIORITY_ROUTES.length} priority routes, then enable public light.`,
  };
}

export function summarizeLightThemeGoLiveForCoOwner(): string {
  const r = getLightThemeGoLiveReadiness();
  const routes = LIGHT_THEME_PRIORITY_ROUTES.map((x) => `- ${x.label} (${x.path})`).join('\n');
  return [
    `Light theme go-live: public=${r.publicEnabled ? 'ON' : 'OFF (admin preview)'}`,
    r.hint,
    `Run: ${r.auditCommand}`,
    'Priority spot-check routes:',
    routes,
  ].join('\n');
}
