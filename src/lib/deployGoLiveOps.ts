/**
 * Deploy & host go-live ops (wave 65) — mirrors docs/PRODUCTION_DEPLOY.md.
 */

import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { getDeployEnvironment, getDeployEnvironmentLabel } from './deployEnvironment';
import { buildTwilioWebhookUrl } from './phoneProductionOps';

export type DeployGoLiveStepStatus = 'ok' | 'warn' | 'blocked' | 'manual';

export type DeployGoLiveStep = {
  id: string;
  label: string;
  hint: string;
  command?: string;
  path?: string;
  copyText?: string;
  status: DeployGoLiveStepStatus;
};

export const DEPLOY_GO_LIVE_COMMANDS = {
  preflight: 'npm run launch:preflight',
  predeploy: 'npm run predeploy:check',
  predeployCode: 'npm run predeploy:code',
  deployFunctions: 'npm run deploy:functions',
  build: 'npm run build',
  launchBundle: 'npm run launch:bundle',
  postDeployVerify: 'npm run post-deploy:verify -- https://finelycred.com',
  deployPlan: 'npm run deploy:plan',
  goLive: 'npm run launch:go-live',
} as const;

export const HOST_ENV_TEMPLATE = `# Set on your static host (Vercel / Netlify / Cloudflare Pages)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
# Optional: VITE_SENTRY_DSN, VITE_SMARTCREDIT_PID`;

function resolveDeployStep(id: string): { status: DeployGoLiveStepStatus; hint: string } {
  const supabase = isSupabaseConfigured;
  const env = getDeployEnvironment();
  const webhook = buildTwilioWebhookUrl();

  switch (id) {
    case 'sql':
      return supabase
        ? { status: 'warn', hint: 'Run supabase/LIVE_SETUP_run_all.sql on target project (SQL Editor).' }
        : { status: 'blocked', hint: 'Configure Supabase keys first.' };
    case 'secrets':
      return supabase
        ? { status: 'warn', hint: 'Supabase dashboard → Edge Function secrets (TWILIO_AUTH_TOKEN, etc.).' }
        : { status: 'blocked', hint: 'Needs linked Supabase project.' };
    case 'preflight':
      return supabase
        ? { status: 'warn', hint: 'Run npm run launch:preflight then npm run predeploy:check before deploy.' }
        : { status: 'blocked', hint: 'Paste Supabase keys into .env.local first.' };
    case 'edge-functions':
      return supabase
        ? { status: 'warn', hint: 'Deploy twilio-webhook, platform-cron, automation-runner, and launch subset.' }
        : { status: 'blocked', hint: 'Link Supabase project URL before deploy:functions.' };
    case 'twilio-webhook':
      return webhook
        ? { status: 'warn', hint: `Paste ${webhook} in Twilio Console (SMS + Voice POST).` }
        : { status: supabase ? 'warn' : 'blocked', hint: 'Webhook URL appears after Supabase URL is set + deploy.' };
    case 'platform-cron':
      return supabase
        ? { status: 'warn', hint: 'Schedule platform-cron via pg_cron — copy SQL from /admin/monitoring deploy panel.' }
        : { status: 'blocked', hint: 'Deploy platform-cron function first.' };
    case 'build-host':
      return env === 'production'
        ? { status: 'ok', hint: `Live on ${getDeployEnvironmentLabel()} — verify sitemap.xml + robots.txt in dist/.` }
        : { status: 'warn', hint: 'npm run launch:bundle (or build) → deploy dist/ with production env vars.' };
    case 'post-deploy-verify':
      return env === 'production'
        ? { status: 'warn', hint: 'Run post-deploy:verify against live URL — checks SPA shell + static assets.' }
        : { status: 'manual', hint: 'After first deploy: npm run post-deploy:verify -- https://your-domain.com' };
    case 'host-env':
      return env === 'production' && supabase
        ? { status: 'ok', hint: 'Production host detected with Supabase client configured.' }
        : { status: 'warn', hint: 'Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY on static host.' };
    case 'comms-live':
      return isFeatureEnabled('commsDelivery')
        ? { status: 'ok', hint: 'Live SMS/email enabled — verify Twilio/from numbers.' }
        : { status: 'warn', hint: 'Enable commsDelivery in Admin → Settings when secrets are live.' };
    case 'stripe-live':
      return isFeatureEnabled('stripeEnabled')
        ? { status: 'ok', hint: 'Stripe checkout enabled for paid strategy calls.' }
        : { status: 'warn', hint: 'Enable stripeEnabled when Stripe secrets are on Supabase.' };
    case 'autopilot-live':
      return isFeatureEnabled('automationAutopilot')
        ? { status: 'ok', hint: 'Hands-free letter draft + staff routing enabled.' }
        : { status: 'warn', hint: 'Enable automationAutopilot after comms + cron are stable.' };
    default:
      return { status: 'manual', hint: '' };
  }
}

const DEPLOY_STEP_DEFS: Omit<DeployGoLiveStep, 'status' | 'hint'>[] = [
  { id: 'sql', label: 'Run LIVE_SETUP SQL on target project', copyText: 'supabase/LIVE_SETUP_run_all.sql' },
  { id: 'secrets', label: 'Set Supabase edge function secrets', path: '/admin/monitoring' },
  {
    id: 'preflight',
    label: 'Launch preflight + predeploy gate',
    command: DEPLOY_GO_LIVE_COMMANDS.preflight,
  },
  {
    id: 'edge-functions',
    label: 'Deploy edge functions',
    command: DEPLOY_GO_LIVE_COMMANDS.deployFunctions,
    path: '/admin/phone-hub',
  },
  { id: 'twilio-webhook', label: 'Twilio Console webhook URL', path: '/admin/phone-hub' },
  { id: 'platform-cron', label: 'Schedule platform-cron (pg_cron)', path: '/admin/monitoring' },
  { id: 'build-host', label: 'Build + deploy static frontend', command: DEPLOY_GO_LIVE_COMMANDS.launchBundle },
  {
    id: 'post-deploy-verify',
    label: 'Post-deploy smoke (live URL)',
    command: DEPLOY_GO_LIVE_COMMANDS.postDeployVerify,
  },
  { id: 'host-env', label: 'Host environment variables', copyText: HOST_ENV_TEMPLATE },
  { id: 'comms-live', label: 'Enable live comms delivery', path: '/admin/settings?tab=features' },
  { id: 'stripe-live', label: 'Enable Stripe checkout (optional)', path: '/admin/settings?tab=features' },
  { id: 'autopilot-live', label: 'Enable automation autopilot (optional)', path: '/admin/ops-autopilot' },
];

export function getDeployGoLiveSteps(): DeployGoLiveStep[] {
  return DEPLOY_STEP_DEFS.map((step) => {
    const { status, hint } = resolveDeployStep(step.id);
    return { ...step, status, hint };
  });
}

export function summarizeDeployGoLiveForCoOwner(): string {
  const steps = getDeployGoLiveSteps();
  const blocked = steps.filter((s) => s.status === 'blocked').length;
  const warn = steps.filter((s) => s.status === 'warn').length;
  const lines = steps.map((s) => `- [${s.status}] ${s.label}`).join('\n');
  return [
    `Deploy go-live: env=${getDeployEnvironmentLabel()} · blocked=${blocked} warn=${warn}`,
    lines,
    '',
    `Commands: ${DEPLOY_GO_LIVE_COMMANDS.deployFunctions} · ${DEPLOY_GO_LIVE_COMMANDS.build}`,
    'Admin: /admin/launch-os#deploy-go-live · docs/PRODUCTION_DEPLOY.md',
  ].join('\n');
}
