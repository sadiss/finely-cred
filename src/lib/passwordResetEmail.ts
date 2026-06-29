import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Request a password reset email via the send-password-reset edge function (all roles). */
export async function sendPasswordResetEmail(args: {
  email: string;
  redirectTo?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = (args.email || '').trim();
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured.' };

  const redirectTo = args.redirectTo || `${window.location.origin}/reset-password`;

  const { data, error } = await supabase.functions.invoke('send-password-reset', {
    body: { email, redirectTo },
  });

  if (error) {
    // supabase-js returns the generic "Edge Function returned a non-2xx status code"
    // for all non-2xx responses. Try to read the real error message from the body.
    let realError: string | undefined;
    try {
      // FunctionsHttpError exposes the raw Response on .context
      const body = await (error as any).context?.json?.();
      realError = body?.error || body?.message || body?.msg;
    } catch {
      // ignore — body already consumed or unavailable
    }
    return { ok: false, error: realError || error.message || 'Password reset request failed.' };
  }
  if (data?.error) {
    return { ok: false, error: String(data.error) };
  }
  if (data?.ok === false) {
    return { ok: false, error: String(data.error || 'Password reset email could not be sent.') };
  }

  return { ok: true };
}
