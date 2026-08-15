import { parseAllowlist, type GuardContext } from './edgeGuard.ts';

export type StaffTier = 'admin' | 'developer';

function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

/** Support plus-addressing (e.g. dev+qa@finelycred.com). */
function stripPlusAddress(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus <= 0) return email;
  return `${local.slice(0, plus)}@${domain}`;
}

function emailInAllowlist(email: string, allow: Set<string>): boolean {
  if (!email) return false;
  const stripped = stripPlusAddress(email);
  return allow.has(email) || allow.has(stripped);
}

export function resolveStaffTier(ctx: GuardContext): StaffTier | null {
  const email = normalizeEmail(ctx.user.email);
  if (!email) return null;
  const admins = parseAllowlist(Deno.env.get('EDGE_ADMIN_EMAILS') || '');
  const devs = parseAllowlist(Deno.env.get('EDGE_DEVELOPER_EMAILS') || '');
  // Bootstrap developer — also set EDGE_DEVELOPER_EMAILS in production.
  devs.add('sadiss.ansaari@gmail.com');
  if (emailInAllowlist(email, admins)) return 'admin';
  if (emailInAllowlist(email, devs)) return 'developer';
  return null;
}

/** Admin or developer allowlist — used by mailer, send-email, send-sms. */
export function requireStaffAllowlistedEmail(ctx: GuardContext): StaffTier {
  const admins = parseAllowlist(Deno.env.get('EDGE_ADMIN_EMAILS') || '');
  const devs = parseAllowlist(Deno.env.get('EDGE_DEVELOPER_EMAILS') || '');
  if (!admins.size && !devs.size) {
    throw new Error('EDGE_ADMIN_EMAILS or EDGE_DEVELOPER_EMAILS not configured');
  }
  const tier = resolveStaffTier(ctx);
  if (!tier) throw new Error('Forbidden');
  return tier;
}
