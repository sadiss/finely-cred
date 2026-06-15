/**
 * Launch plan handoff ops (wave 67) — FINELY-OS-400 code track handoff complete.
 */

import { LAUNCH_WAVE_REGISTRY } from './launchWaveRegistry';
import { getLaunchFinalReadiness } from './launchFinalReadinessOps';

export const LAUNCH_PLAN_HANDOFF = {
  planId: 'FINELY-OS-400-2026-06',
  codeTrack: 'complete',
  waves: { from: 54, to: 68 },
  waveCount: LAUNCH_WAVE_REGISTRY.length,
  handoffAudit: 'npm run launch:handoff:audit',
  fullClosureAudit: 'npm run launch:closure:full:audit',
} as const;

/** Meta + production ops waves (60–67) — run via launch:closure:waves:audit */
export const LAUNCH_CLOSURE_META_AUDITS = [
  { wave: 60, label: 'Launch waves rollup', command: 'npm run launch:waves:rollup:audit' },
  { wave: 61, label: 'Launch plan closure', command: 'npm run launch:plan:closure:audit' },
  { wave: 62, label: 'Production launch ops', command: 'npm run production:launch:audit' },
  { wave: 63, label: 'Env bootstrap', command: 'npm run env:bootstrap:audit' },
  { wave: 64, label: 'Senior QA sign-off', command: 'npm run senior:qa:signoff:audit' },
  { wave: 65, label: 'Deploy go-live', command: 'npm run deploy:go-live:audit' },
  { wave: 66, label: 'Final readiness', command: 'npm run launch:final:readiness:audit' },
  { wave: 67, label: 'Plan handoff', command: 'npm run launch:handoff:audit' },
] as const;

export function summarizeLaunchHandoffForCoOwner(): string {
  const readiness = getLaunchFinalReadiness();
  const audits = LAUNCH_CLOSURE_META_AUDITS.map((a) => `- Wave ${a.wave}: ${a.command}`).join('\n');
  return [
    `Launch plan handoff: ${LAUNCH_PLAN_HANDOFF.planId} · code track COMPLETE (waves ${LAUNCH_PLAN_HANDOFF.waves.from}–${LAUNCH_PLAN_HANDOFF.waves.to})`,
    `Production ready: ${readiness.productionReady} · blocked=${readiness.blockedCount} warn=${readiness.warnCount}`,
    '',
    'Closure meta audits:',
    audits,
    '',
    `One command: ${LAUNCH_PLAN_HANDOFF.fullClosureAudit}`,
    `Go-live: npm run launch:go-live · Admin: /admin/launch-os#plan-handoff`,
  ].join('\n');
}
