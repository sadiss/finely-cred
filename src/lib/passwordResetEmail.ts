import { invokePublicEdgeFunction, isSupabaseConfigured } from './supabaseClient';

export type PasswordResetResult = {
  ok: boolean;
  sent?: boolean;
  noAccount?: boolean;
  error?: string;
};

/** Request a password reset email via the send-password-reset edge function (all roles). */
export async function sendPasswordResetEmail(args: {
  email: string;
  redirectTo?: string;
  /** Auth user id — resolves canonical login email when profile email differs. */
  userId?: string;
}): Promise<PasswordResetResult> {
  const email = (args.email || '').trim();
  if (!email) return { ok: false, sent: false, error: 'Email is required.' };
  if (!isSupabaseConfigured) return { ok: false, sent: false, error: 'Supabase is not configured.' };

  const redirectTo = args.redirectTo || `${window.location.origin}/reset-password`;

  // Always call as anonymous — stale/expired session tokens must not block forgot-password.
  const { data, error } = await invokePublicEdgeFunction<{
    ok?: boolean;
    sent?: boolean;
    reason?: string;
    error?: string;
  }>('send-password-reset', {
    email,
    redirectTo,
    userId: args.userId || undefined,
  });

  if (error) {
    let realError: string | undefined;
    try {
      const body = await (error as any).context?.json?.();
      realError = body?.error || body?.message || body?.msg;
    } catch {
      // ignore
    }
    return { ok: false, sent: false, error: realError || error.message || 'Password reset request failed.' };
  }
  if (data?.error) {
    return { ok: false, sent: false, error: String(data.error) };
  }
  if (data?.ok === false) {
    return { ok: false, sent: false, error: String(data.error || 'Password reset email could not be sent.') };
  }

  const noAccount = data?.reason === 'no_auth_account' || data?.sent === false;
  return { ok: true, sent: data?.sent === true, noAccount };
}
