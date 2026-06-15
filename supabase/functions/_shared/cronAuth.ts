import { requireAllowlistedEmail, requireAuth } from './edgeGuard.ts';

export type CronAuth =
  | { mode: 'service_role'; userId: 'service_role' }
  | { mode: 'admin'; userId: string; email?: string | null };

/** Service role (pg_cron) or allowlisted admin JWT. */
export async function authorizeCronOrService(req: Request): Promise<CronAuth> {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^bearer\s+/i, '').trim();
  const serviceRole = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (serviceRole && token === serviceRole) {
    return { mode: 'service_role', userId: 'service_role' };
  }
  const auth = await requireAuth(req);
  await requireAllowlistedEmail(auth.user.email);
  return { mode: 'admin', userId: auth.user.id, email: auth.user.email };
}
