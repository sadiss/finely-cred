/**
 * Launch Sprint wave registry — waves 54–71 (plan sealed at wave 69; nav 70; Ruth superhuman 71).
 */

export type LaunchWaveEntry = {
  wave: number;
  id: string;
  label: string;
  auditCommand: string;
  hubPath?: string;
};

/** Automated audit gates for the Finely OS 400% launch closure track. */
export const LAUNCH_WAVE_REGISTRY: LaunchWaveEntry[] = [
  {
    wave: 54,
    id: 'coowner_ops_wave54',
    label: 'Co-owner Ruth ops',
    auditCommand: 'npm run coowner:audit',
    hubPath: '/admin/ops-agent',
  },
  {
    wave: 55,
    id: 'phone_hub_wave55',
    label: 'Phone hub + Twilio',
    auditCommand: 'npm run phone:audit',
    hubPath: '/admin/phone-hub',
  },
  {
    wave: 56,
    id: 'validation_dispute_wave56',
    label: 'Validation & dispute ops',
    auditCommand: 'npm run validation:audit',
    hubPath: '/admin/workflow',
  },
  {
    wave: 57,
    id: 'production_ops_wave57',
    label: 'Production ops (Twilio deploy)',
    auditCommand: 'npm run production:audit',
    hubPath: '/admin/phone-hub',
  },
  {
    wave: 58,
    id: 'go_live_command_wave58',
    label: 'Go-live command center',
    auditCommand: 'npm run go-live:audit',
    hubPath: '/admin/launch-os#go-live',
  },
  {
    wave: 59,
    id: 'light_theme_go_live_wave59',
    label: 'Light theme go-live',
    auditCommand: 'npm run theme:go-live:audit',
    hubPath: '/admin/settings?tab=appearance',
  },
  {
    wave: 60,
    id: 'launch_waves_rollup_wave60',
    label: 'Launch waves rollup',
    auditCommand: 'npm run launch:waves:audit',
    hubPath: '/admin/launch-os#go-live',
  },
  {
    wave: 61,
    id: 'launch_plan_closure_wave61',
    label: 'Launch plan code closure',
    auditCommand: 'npm run launch:plan:closure:audit',
    hubPath: '/admin/launch-os#plan-closure',
  },
  {
    wave: 62,
    id: 'production_launch_ops_wave62',
    label: 'Production launch ops',
    auditCommand: 'npm run production:launch:audit',
    hubPath: '/admin/launch-os#production-ops',
  },
  {
    wave: 63,
    id: 'env_bootstrap_wave63',
    label: 'Supabase env bootstrap',
    auditCommand: 'npm run env:bootstrap:audit',
    hubPath: '/admin/launch-os#env-bootstrap',
  },
  {
    wave: 64,
    id: 'senior_qa_signoff_wave64',
    label: 'Senior QA human sign-off',
    auditCommand: 'npm run senior:qa:signoff:audit',
    hubPath: '/admin/launch-os#senior-qa',
  },
  {
    wave: 65,
    id: 'deploy_go_live_wave65',
    label: 'Deploy & host go-live',
    auditCommand: 'npm run deploy:go-live:audit',
    hubPath: '/admin/launch-os#deploy-go-live',
  },
  {
    wave: 66,
    id: 'launch_final_readiness_wave66',
    label: 'Launch final readiness rollup',
    auditCommand: 'npm run launch:final:readiness:audit',
    hubPath: '/admin/launch-os#launch-readiness',
  },
  {
    wave: 67,
    id: 'launch_plan_handoff_wave67',
    label: 'Launch plan handoff complete',
    auditCommand: 'npm run launch:handoff:audit',
    hubPath: '/admin/launch-os#plan-handoff',
  },
  {
    wave: 68,
    id: 'production_sequencer_wave68',
    label: 'Production go-live sequencer',
    auditCommand: 'npm run production:sequencer:audit',
    hubPath: '/admin/launch-os#production-sequencer',
  },
  {
    wave: 69,
    id: 'production_ops_runner_wave69',
    label: 'Production ops runner (plan sealed)',
    auditCommand: 'npm run production:ops:runner:audit',
    hubPath: '/admin/launch-os#production-ops-runner',
  },
  {
    wave: 70,
    id: 'launch_os_nav_wave70',
    label: 'Launch OS navigation hub',
    auditCommand: 'npm run launch:os:nav:audit',
    hubPath: '/admin/launch-os#launch-os-nav',
  },
  {
    wave: 71,
    id: 'coowner_superhuman_wave71',
    label: 'Ruth superhuman + Dev Studio',
    auditCommand: 'npm run coowner:superhuman:audit',
    hubPath: '/admin/ops-agent#dev-studio',
  },
];

export function summarizeLaunchWavesForCoOwner(): string {
  const lines = LAUNCH_WAVE_REGISTRY.map(
    (w) => `- Wave ${w.wave}: ${w.label} → ${w.auditCommand}`,
  );
  return [`Launch wave registry (${LAUNCH_WAVE_REGISTRY.length} gates):`, ...lines].join('\n');
}
