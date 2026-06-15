/**
 * Launch final readiness rollup (wave 66) — unifies all production sub-panels.
 */

import { isSupabaseConfigured } from './supabaseClient';
import { LAUNCH_WAVE_REGISTRY } from './launchWaveRegistry';
import { getEnvBootstrapSteps } from './envBootstrapOps';
import { getProductionLaunchSteps } from './productionLaunchOps';
import { getDeployGoLiveSteps } from './deployGoLiveOps';
import { getSeniorQaSignoffProgress } from './seniorQaSignoffOps';
import { getGoLivePillars } from './goLiveCommandOps';

export type LaunchReadinessZone = {
  id: string;
  label: string;
  ok: boolean;
  tone: 'ok' | 'warn' | 'blocked';
  summary: string;
  hubPath: string;
};

function toneFromCounts(blocked: number, warn: number): 'ok' | 'warn' | 'blocked' {
  if (blocked > 0) return 'blocked';
  if (warn > 0) return 'warn';
  return 'ok';
}

function summarizeSteps(
  steps: { status: string }[],
): { blocked: number; warn: number; tone: 'ok' | 'warn' | 'blocked' } {
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const warn = steps.filter((s) => s.status === 'warn' || s.status === 'manual').length;
  return { blocked, warn, tone: toneFromCounts(blocked, warn) };
}

export function getLaunchFinalReadinessZones(): LaunchReadinessZone[] {
  const envSteps = getEnvBootstrapSteps();
  const envSummary = summarizeSteps(envSteps.map((s) => ({ status: s.done ? 'ok' : 'blocked' })));
  const prodSummary = summarizeSteps(getProductionLaunchSteps());
  const deploySummary = summarizeSteps(getDeployGoLiveSteps());
  const qa = getSeniorQaSignoffProgress();
  const pillars = getGoLivePillars().filter((p) => p.id !== 'tour_voice');
  const pillarBlocked = pillars.filter((p) => p.tone === 'blocked').length;
  const pillarWarn = pillars.filter((p) => p.tone === 'warn').length;

  return [
    {
      id: 'code_track',
      label: 'Code track (waves 54–70)',
      ok: true,
      tone: 'ok',
      summary: `${LAUNCH_WAVE_REGISTRY.length} automated gates · npm run launch:code`,
      hubPath: '/admin/launch-os#go-live',
    },
    {
      id: 'env',
      label: 'Supabase env bootstrap',
      ok: isSupabaseConfigured,
      tone: isSupabaseConfigured ? 'ok' : 'blocked',
      summary: isSupabaseConfigured
        ? 'Client keys detected.'
        : `${envSteps.filter((s) => !s.done).length} bootstrap step(s) open.`,
      hubPath: '/admin/launch-os#env-bootstrap',
    },
    {
      id: 'production_ops',
      label: 'Production launch ops',
      ok: prodSummary.tone === 'ok',
      tone: prodSummary.tone,
      summary: `${prodSummary.blocked} blocked · ${prodSummary.warn} warn/manual`,
      hubPath: '/admin/launch-os#production-ops',
    },
    {
      id: 'deploy',
      label: 'Deploy & host',
      ok: deploySummary.tone === 'ok',
      tone: deploySummary.tone,
      summary: `${deploySummary.blocked} blocked · ${deploySummary.warn} pending`,
      hubPath: '/admin/launch-os#deploy-go-live',
    },
    {
      id: 'senior_qa',
      label: 'Senior QA sign-off',
      ok: qa.complete,
      tone: qa.complete ? 'ok' : qa.signed > 0 ? 'warn' : 'blocked',
      summary: `${qa.signed}/${qa.total} items checked`,
      hubPath: '/admin/launch-os#senior-qa',
    },
    {
      id: 'pillars',
      label: 'Go-live pillars',
      ok: pillarBlocked === 0 && pillarWarn === 0,
      tone: toneFromCounts(pillarBlocked, pillarWarn),
      summary: `${pillarBlocked} blocked · ${pillarWarn} warn (excl. optional tours)`,
      hubPath: '/admin/launch-os#go-live',
    },
  ];
}

export function getLaunchFinalReadiness(): {
  zones: LaunchReadinessZone[];
  productionReady: boolean;
  blockedCount: number;
  warnCount: number;
} {
  const zones = getLaunchFinalReadinessZones();
  const blockedCount = zones.filter((z) => z.tone === 'blocked').length;
  const warnCount = zones.filter((z) => z.tone === 'warn').length;
  const productionReady = blockedCount === 0 && warnCount === 0;
  return { zones, productionReady, blockedCount, warnCount };
}

export function summarizeLaunchFinalReadinessForCoOwner(): string {
  const { zones, productionReady, blockedCount, warnCount } = getLaunchFinalReadiness();
  const lines = zones.map((z) => `- [${z.tone.toUpperCase()}] ${z.label}: ${z.summary}`).join('\n');
  return [
    `Launch final readiness: productionReady=${productionReady} · blocked=${blockedCount} warn=${warnCount}`,
    lines,
    '',
    'Rollup: npm run launch:final:readiness:audit · npm run launch:go-live',
    'Admin: /admin/launch-os#launch-readiness',
  ].join('\n');
}
