import { isSupabaseConfigured } from './supabaseClient';
import { isAdminEmail } from '../auth/admin';
import { isSupabaseCircuitOpen } from './supabaseAuthGuard';

export type BootSyncContext = {
  pathname: string;
  userEmail: string | null;
  authLoading: boolean;
};

const WORKSPACE_PREFIXES = ['/admin', '/portal', '/dashboard', '/business', '/seller'];

export function isWorkspacePath(pathname: string): boolean {
  const p = pathname.split('?')[0] || '/';
  return WORKSPACE_PREFIXES.some((prefix) => p === prefix || p.startsWith(prefix + '/'));
}

/** Public marketing routes must never run staff/automation Supabase fan-out. */
export function canRunStaffAutomationSupabaseSync(ctx: BootSyncContext): boolean {
  if (ctx.authLoading) return false;
  if (!isSupabaseConfigured) return false;
  if (isSupabaseCircuitOpen()) return false;
  if (!isWorkspacePath(ctx.pathname)) return false;
  if (!ctx.userEmail) return false;

  if (ctx.pathname.startsWith('/admin')) {
    return isAdminEmail(ctx.userEmail);
  }

  if (ctx.pathname.startsWith('/portal') || ctx.pathname.startsWith('/dashboard')) {
    return isAdminEmail(ctx.userEmail);
  }

  return false;
}
