/**
 * Production go-live sequencer (wave 68) — single ordered playbook for production ops.
 */

import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { getDeployEnvironment } from './deployEnvironment';
import { getEnvBootstrapSteps } from './envBootstrapOps';
import { getProductionLaunchSteps } from './productionLaunchOps';
import { getDeployGoLiveSteps } from './deployGoLiveOps';
import { getSeniorQaSignoffProgress } from './seniorQaSignoffOps';
import { LAUNCH_PLAN_HANDOFF } from './launchHandoffOps';

export type GoLivePhase = 'credentials' | 'database' | 'verify' | 'deploy' | 'host' | 'flags' | 'signoff';

export type GoLiveSequenceStep = {
  id: string;
  phase: GoLivePhase;
  order: number;
  label: string;
  command?: string;
  path?: string;
  status: 'ok' | 'warn' | 'blocked' | 'manual';
  hint: string;
};

const PHASE_LABELS: Record<GoLivePhase, string> = {
  credentials: '1 · Credentials',
  database: '2 · Database',
  verify: '3 · Verify',
  deploy: '4 · Deploy',
  host: '5 · Host',
  flags: '6 · Feature flags',
  signoff: '7 · Sign-off',
};

export function getGoLivePhaseLabels(): Record<GoLivePhase, string> {
  return PHASE_LABELS;
}

function mapStatus(s: string): GoLiveSequenceStep['status'] {
  if (s === 'ok' || s === 'done') return 'ok';
  if (s === 'blocked') return 'blocked';
  if (s === 'manual') return 'manual';
  return 'warn';
}

export function getProductionGoLiveSequence(): GoLiveSequenceStep[] {
  const env = getEnvBootstrapSteps();
  const prod = getProductionLaunchSteps();
  const deploy = getDeployGoLiveSteps();
  const qa = getSeniorQaSignoffProgress();
  const supabase = isSupabaseConfigured;
  const onProdHost = getDeployEnvironment() === 'production';

  const steps: GoLiveSequenceStep[] = [
    {
      id: 'env-setup',
      phase: 'credentials',
      order: 1,
      label: env.find((s) => s.id === 'bootstrap_file')?.label ?? 'Bootstrap .env.local',
      command: 'npm run env:setup',
      status: 'ok',
      hint: 'Creates .env.local from template if missing.',
    },
    {
      id: 'paste-keys',
      phase: 'credentials',
      order: 2,
      label: env.find((s) => s.id === 'paste_keys')?.label ?? 'Paste Supabase keys',
      command: 'npm run env:check',
      path: '/admin/launch-os#env-bootstrap',
      status: supabase ? 'ok' : 'blocked',
      hint: supabase ? 'Keys detected.' : 'Paste URL + anon key, restart dev server.',
    },
    {
      id: 'live-sql',
      phase: 'database',
      order: 3,
      label: 'Run LIVE_SETUP SQL',
      path: '/admin/launch-os#deploy-go-live',
      status: supabase ? 'warn' : 'blocked',
      hint: 'supabase/LIVE_SETUP_run_all.sql in Supabase SQL Editor.',
    },
    {
      id: 'admin-email',
      phase: 'database',
      order: 4,
      label: 'Seed admin email',
      path: '/admin/launch-os#env-bootstrap',
      status: supabase ? 'warn' : 'blocked',
      hint: 'INSERT INTO admin_emails for your staff login.',
    },
    {
      id: 'preflight',
      phase: 'verify',
      order: 5,
      label: prod.find((s) => s.id === 'preflight')?.label ?? 'Launch preflight',
      command: 'npm run launch:preflight',
      status: mapStatus(prod.find((s) => s.id === 'preflight')?.status ?? 'blocked'),
      hint: prod.find((s) => s.id === 'preflight')?.hint ?? '',
    },
    {
      id: 'closure-audit',
      phase: 'verify',
      order: 6,
      label: 'Full closure audit stack',
      command: LAUNCH_PLAN_HANDOFF.fullClosureAudit,
      status: 'ok',
      hint: 'Waves 54–66 automated gates in one command.',
    },
    {
      id: 'deploy-fn',
      phase: 'deploy',
      order: 7,
      label: 'Deploy edge functions',
      command: 'npm run deploy:functions',
      path: '/admin/phone-hub',
      status: mapStatus(prod.find((s) => s.id === 'deploy-fn')?.status ?? 'blocked'),
      hint: prod.find((s) => s.id === 'deploy-fn')?.hint ?? '',
    },
    {
      id: 'twilio',
      phase: 'deploy',
      order: 8,
      label: 'Twilio webhook + secrets',
      path: '/admin/phone-hub',
      status: mapStatus(prod.find((s) => s.id === 'twilio')?.status ?? 'blocked'),
      hint: prod.find((s) => s.id === 'twilio')?.hint ?? '',
    },
    {
      id: 'build',
      phase: 'host',
      order: 9,
      label: deploy.find((s) => s.id === 'build-host')?.label ?? 'Build + deploy dist/',
      command: 'npm run build',
      status: mapStatus(deploy.find((s) => s.id === 'build-host')?.status ?? 'warn'),
      hint: deploy.find((s) => s.id === 'build-host')?.hint ?? '',
    },
    {
      id: 'host-env',
      phase: 'host',
      order: 10,
      label: 'Host environment variables',
      path: '/admin/launch-os#deploy-go-live',
      status: onProdHost && supabase ? 'ok' : 'warn',
      hint: 'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY on static host.',
    },
    {
      id: 'comms',
      phase: 'flags',
      order: 11,
      label: 'Enable comms delivery',
      path: '/admin/settings?tab=features',
      status: isFeatureEnabled('commsDelivery') ? 'ok' : 'warn',
      hint: 'Turn on commsDelivery when Twilio/SendGrid secrets are live.',
    },
    {
      id: 'light-theme',
      phase: 'flags',
      order: 12,
      label: 'Light theme public go-live',
      path: '/admin/settings?tab=appearance',
      command: 'npm run theme:audit',
      status: mapStatus(prod.find((s) => s.id === 'theme')?.status ?? 'warn'),
      hint: prod.find((s) => s.id === 'theme')?.hint ?? '',
    },
    {
      id: 'senior-qa',
      phase: 'signoff',
      order: 13,
      label: 'Senior QA human sign-off',
      path: '/admin/launch-os#senior-qa',
      command: 'npm run launch:senior:qa',
      status: qa.complete ? 'ok' : qa.signed > 0 ? 'warn' : 'manual',
      hint: `${qa.signed}/${qa.total} checklist items · docs/SENIOR-QA-WALKTHROUGH.md`,
    },
    {
      id: 'go-live',
      phase: 'signoff',
      order: 14,
      label: 'Production go-live preflight',
      command: 'npm run launch:go-live',
      path: '/admin/launch-os#launch-readiness',
      status: supabase ? 'warn' : 'blocked',
      hint: 'Final preflight after keys + deploy checklist.',
    },
  ];

  return steps.sort((a, b) => a.order - b.order);
}

export function summarizeProductionGoLiveSequencerForCoOwner(): string {
  const steps = getProductionGoLiveSequence();
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const lines = steps.map((s) => `- [${s.status}] ${PHASE_LABELS[s.phase]} ${s.label}`).join('\n');
  return [
    `Production go-live sequencer: ${steps.length} steps · blocked=${blocked}`,
    lines,
    '',
    'Admin: /admin/launch-os#production-sequencer · npm run launch:go-live',
  ].join('\n');
}
