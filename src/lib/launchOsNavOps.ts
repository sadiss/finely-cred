/**
 * Launch OS section navigator (wave 70) — jump links for production go-live panels.
 */

export type LaunchOsNavSection = {
  id: string;
  label: string;
  hash: string;
  /** When set, navigates here instead of /admin/launch-os{hash} */
  path?: string;
  lane: 'rollup' | 'production' | 'command';
};

export const LAUNCH_OS_NAV_SECTIONS: LaunchOsNavSection[] = [
  { id: 'launch-readiness', label: 'Readiness', hash: '#launch-readiness', lane: 'rollup' },
  { id: 'production-sequencer', label: 'Sequencer', hash: '#production-sequencer', lane: 'production' },
  { id: 'env-bootstrap', label: 'Env bootstrap', hash: '#env-bootstrap', lane: 'production' },
  { id: 'production-ops', label: 'Production ops', hash: '#production-ops', lane: 'production' },
  { id: 'deploy-go-live', label: 'Deploy', hash: '#deploy-go-live', lane: 'production' },
  { id: 'senior-qa', label: 'Senior QA', hash: '#senior-qa', lane: 'production' },
  { id: 'plan-handoff', label: 'Handoff', hash: '#plan-handoff', lane: 'rollup' },
  { id: 'production-ops-runner', label: 'Ops runner', hash: '#production-ops-runner', lane: 'rollup' },
  { id: 'ruth-ops', label: 'Ruth co-owner', hash: '', path: '/admin/ops-agent', lane: 'command' },
  { id: 'go-live', label: 'Go-live pillars', hash: '#go-live', lane: 'command' },
];

export function summarizeLaunchOsNavForCoOwner(): string {
  const lines = LAUNCH_OS_NAV_SECTIONS.map((s) => `- ${s.label}: /admin/launch-os${s.hash}`).join('\n');
  return [
    'Launch OS navigation hub (wave 70):',
    lines,
    '',
    'Ruth superhuman (wave 71): /admin/ops-agent · Dev Studio: /admin/ops-agent#dev-studio',
    'Start: /admin/launch-os#production-sequencer · npm run launch:production:ops',
  ].join('\n');
}
