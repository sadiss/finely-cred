import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Request a password reset email via the send-password-reset edge function (all roles). */
export async function sendPasswordResetEmail(args: {
  email: string;
  redirectTo?: string;
  /** Auth user id — resolves canonical login email when profile email differs. */
  userId?: string;
}): Promise<{ ok: boolean; sent?: boolean; error?: string }> {
  const email = (args.email || '').trim();
  if (!email) return { ok: false, sent: false, error: 'Email is required.' };
  if (!isSupabaseConfigured) return { ok: false, sent: false, error: 'Supabase is not configured.' };

  const redirectTo = args.redirectTo || `${window.location.origin}/reset-password`;

  const { data, error } = await supabase.functions.invoke('send-password-reset', {
    body: { email, redirectTo, userId: args.userId || undefined },
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

  return { ok: true, sent: data?.sent === true };
}
