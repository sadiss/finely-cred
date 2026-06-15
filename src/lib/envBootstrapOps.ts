/**
 * Env bootstrap ops — Supabase dev project setup guide (wave 63).
 * Mirrors scripts/dev-supabase-setup-guide.mjs for in-app admin UX.
 */

import { isSupabaseConfigured } from './supabaseClient';

export type EnvBootstrapStep = {
  id: string;
  label: string;
  hint: string;
  command?: string;
  copyText?: string;
  externalUrl?: string;
  done: boolean;
};

export const ENV_BOOTSTRAP_COMMANDS = {
  setup: 'npm run env:setup',
  guide: 'npm run env:dev-supabase',
  check: 'npm run env:check',
  goLive: 'npm run launch:go-live',
  deployFunctions: 'npm run deploy:functions',
} as const;

export const ENV_LOCAL_TEMPLATE = `# Paste into .env.local (restart dev server after save)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
VITE_SUPABASE_PRIVATE_BUCKET=pii`;

export const ADMIN_EMAIL_SQL = `INSERT INTO public.admin_emails (email) VALUES ('you@example.com')
ON CONFLICT DO NOTHING;`;

export function getEnvBootstrapSteps(): EnvBootstrapStep[] {
  const supabaseReady = isSupabaseConfigured;

  return [
    {
      id: 'bootstrap_file',
      label: 'Bootstrap .env.local from template',
      hint: 'Creates or merges keys from .env.example — never overwrites existing values.',
      command: ENV_BOOTSTRAP_COMMANDS.setup,
      done: true,
    },
    {
      id: 'create_project',
      label: 'Create a DEV Supabase project (isolated from production)',
      hint: 'Use finely-cred-dev or similar — never point local dev at live partner data.',
      externalUrl: 'https://supabase.com/dashboard',
      done: supabaseReady,
    },
    {
      id: 'paste_keys',
      label: 'Paste Project URL + anon public key into .env.local',
      hint: supabaseReady
        ? 'Supabase client keys detected in this build.'
        : 'Project Settings → API → copy URL and anon key, then restart npm run dev.',
      copyText: ENV_LOCAL_TEMPLATE,
      command: ENV_BOOTSTRAP_COMMANDS.check,
      done: supabaseReady,
    },
    {
      id: 'live_setup_sql',
      label: 'Run LIVE_SETUP SQL on the dev project',
      hint: 'Supabase SQL Editor → paste supabase/LIVE_SETUP_run_all.sql → Run (idempotent).',
      copyText: 'supabase/LIVE_SETUP_run_all.sql',
      done: supabaseReady,
    },
    {
      id: 'admin_email',
      label: 'Seed your admin email for /admin routes',
      hint: 'Replace you@example.com with your staff login email.',
      copyText: ADMIN_EMAIL_SQL,
      done: supabaseReady,
    },
    {
      id: 'verify',
      label: 'Verify env + run go-live preflight',
      hint: supabaseReady
        ? 'Keys OK — run launch:go-live for full production checklist.'
        : 'npm run env:check should show ✓ Supabase before portal auth works.',
      command: ENV_BOOTSTRAP_COMMANDS.check,
      done: supabaseReady,
    },
    {
      id: 'deploy',
      label: 'Deploy edge functions (after keys + SQL)',
      hint: 'Includes twilio-webhook in launch subset.',
      command: ENV_BOOTSTRAP_COMMANDS.deployFunctions,
      done: false,
    },
  ];
}

export function summarizeEnvBootstrapForCoOwner(): string {
  const steps = getEnvBootstrapSteps();
  const done = steps.filter((s) => s.done).length;
  const lines = steps.map((s) => `- [${s.done ? 'ok' : 'todo'}] ${s.label}`).join('\n');
  return [
    `Env bootstrap: ${done}/${steps.length} steps complete · supabase=${isSupabaseConfigured ? 'ready' : 'pending'}`,
    lines,
    '',
    `Terminal: ${ENV_BOOTSTRAP_COMMANDS.setup} · ${ENV_BOOTSTRAP_COMMANDS.guide} · ${ENV_BOOTSTRAP_COMMANDS.check}`,
    'Admin: /admin/launch-os#env-bootstrap',
  ].join('\n');
}
