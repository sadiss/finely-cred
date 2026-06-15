/**
 * Launch plan code-track closure — waves 54–68 complete; production ops remain.
 */

import { LAUNCH_WAVE_REGISTRY } from './launchWaveRegistry';

export type LaunchOperationalStep = {
  id: string;
  label: string;
  command?: string;
  path?: string;
  blockedWithoutSupabase?: boolean;
};

export const LAUNCH_CODE_TRACK_STATUS = {
  planId: 'FINELY-OS-400-2026-06',
  codeTrack: 'complete',
  waves: { from: 54, to: 68 },
  waveCount: LAUNCH_WAVE_REGISTRY.length,
} as const;

export const LAUNCH_OPERATIONAL_STEPS: LaunchOperationalStep[] = [
  {
    id: 'env',
    label: 'Paste Supabase URL + anon key into .env.local',
    command: 'npm run env:check',
    blockedWithoutSupabase: true,
  },
  {
    id: 'waves',
    label: 'Run all closure wave audits (54–59)',
    command: 'npm run launch:waves:audit',
  },
  {
    id: 'preflight',
    label: 'Full preflight + senior QA',
    command: 'npm run launch:preflight',
    blockedWithoutSupabase: true,
  },
  {
    id: 'deploy-fn',
    label: 'Deploy edge functions (includes twilio-webhook)',
    command: 'npm run deploy:functions',
    blockedWithoutSupabase: true,
  },
  {
    id: 'twilio',
    label: 'Configure Twilio webhook URL from Phone Hub',
    path: '/admin/phone-hub',
    blockedWithoutSupabase: true,
  },
  {
    id: 'theme',
    label: 'Light theme spot-check then enable public light',
    path: '/admin/settings?tab=appearance',
    command: 'npm run theme:audit',
  },
  {
    id: 'voice',
    label: 'Optional voiced tours (Cartesia + voice-studio)',
    command: 'npm run tour:voice:prerender -- --all',
  },
  {
    id: 'human-qa',
    label: 'Human sign-off — mic/read aloud + non-tech spot-check',
    path: '/admin/launch-os#senior-qa',
  },
];

export function summarizeLaunchPlanClosureForCoOwner(): string {
  const waves = LAUNCH_WAVE_REGISTRY.map((w) => `Wave ${w.wave}: ${w.label}`).join('\n');
  const ops = LAUNCH_OPERATIONAL_STEPS.map((s) => {
    const extra = s.command ? ` (${s.command})` : s.path ? ` (${s.path})` : '';
    return `- ${s.label}${extra}`;
  }).join('\n');
  return [
    `Launch code track: COMPLETE (waves ${LAUNCH_CODE_TRACK_STATUS.waves.from}–${LAUNCH_CODE_TRACK_STATUS.waves.to})`,
    waves,
    '',
    'Production ops (your side):',
    ops,
    '',
    'Rollup: npm run launch:complete · Go-live: npm run launch:go-live',
  ].join('\n');
}
