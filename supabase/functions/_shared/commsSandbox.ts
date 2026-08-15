import type { StaffTier } from './actorAuth.ts';

function trimEnv(name: string): string {
  return (Deno.env.get(name) || '').trim();
}

export function resolveSandboxEmailRedirect(): string {
  return (
    trimEnv('EDGE_SANDBOX_EMAIL') ||
    trimEnv('EDGE_DEVELOPER_SANDBOX_EMAIL') ||
    trimEnv('SMTP_FROM_EMAIL') ||
    ''
  );
}

export function resolveSandboxSmsRedirect(): string {
  return trimEnv('EDGE_SANDBOX_SMS') || trimEnv('EDGE_DEVELOPER_SANDBOX_SMS') || '';
}

export type CommsSandboxResult = {
  to: string;
  sandboxed: boolean;
  originalTo?: string;
  note?: string;
};

/** Developer-tier outbound comms redirect — never hits partner inboxes in QA. */
export function applyEmailSandbox(args: { tier: StaffTier; originalTo: string }): CommsSandboxResult {
  const original = (args.originalTo || '').trim();
  if (args.tier !== 'developer') return { to: original, sandboxed: false };
  const redirect = resolveSandboxEmailRedirect();
  if (!redirect) {
    throw new Error(
      'Developer sandbox email not configured. Set EDGE_SANDBOX_EMAIL on edge functions before sending test email.',
    );
  }
  return {
    to: redirect,
    sandboxed: true,
    originalTo: original,
    note: `Developer sandbox — intended recipient was ${original}`,
  };
}

export function applySmsSandbox(args: { tier: StaffTier; originalTo: string }): CommsSandboxResult {
  const original = (args.originalTo || '').trim();
  if (args.tier !== 'developer') return { to: original, sandboxed: false };
  const redirect = resolveSandboxSmsRedirect();
  if (!redirect) {
    throw new Error(
      'Developer sandbox SMS not configured. Set EDGE_SANDBOX_SMS on edge functions before sending test SMS.',
    );
  }
  return {
    to: redirect,
    sandboxed: true,
    originalTo: original,
    note: `Developer sandbox — intended recipient was ${original}`,
  };
}

export function developerLiveMailBlocked(args: {
  tier: StaffTier;
  liveMode: boolean;
  testMode: boolean;
}): boolean {
  return args.tier === 'developer' && args.liveMode && !args.testMode;
}
