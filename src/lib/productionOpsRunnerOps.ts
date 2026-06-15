/**
 * Production ops terminal runner (wave 69) — entry command after code track seal.
 */

export const LAUNCH_PRODUCTION_OPS_COMMAND = 'npm run launch:production:ops';

export type ProductionOpsRunnerStep = {
  id: string;
  label: string;
  command?: string;
  path?: string;
};

export const LAUNCH_PRODUCTION_OPS_STEPS: ProductionOpsRunnerStep[] = [
  { id: 'env', label: 'Check local env', command: 'npm run env:check' },
  { id: 'sequencer', label: 'Open production sequencer in Launch OS', path: '/admin/launch-os#production-sequencer' },
  { id: 'ops', label: 'Print ops summary (no full audit re-run)', command: 'npm run launch:ops' },
  { id: 'go-live', label: 'Go-live preflight (requires Supabase keys)', command: 'npm run launch:go-live' },
  { id: 'complete', label: 'Full code + QA rollup', command: 'npm run launch:complete' },
];

export const LAUNCH_PLAN_SEAL = {
  planId: 'FINELY-OS-400-2026-06',
  sealedAtWave: 69,
  codeTrackWaves: { from: 54, to: 68 },
  opsRunnerWave: 69,
  message:
    'FINELY-OS-400 automated code track is sealed. All further work is production ops (credentials, deploy, human QA).',
} as const;

export function summarizeProductionOpsRunnerForCoOwner(): string {
  const cmds = LAUNCH_PRODUCTION_OPS_STEPS.map((s) => `- ${s.label}: ${s.command ?? s.path}`).join('\n');
  return [
    `Launch plan SEALED at wave ${LAUNCH_PLAN_SEAL.sealedAtWave} — code waves ${LAUNCH_PLAN_SEAL.codeTrackWaves.from}–${LAUNCH_PLAN_SEAL.codeTrackWaves.to} complete`,
    LAUNCH_PLAN_SEAL.message,
    '',
    'Production ops entry:',
    cmds,
    '',
    `Run: ${LAUNCH_PRODUCTION_OPS_COMMAND}`,
    'Admin: /admin/launch-os#production-ops-runner',
  ].join('\n');
}
