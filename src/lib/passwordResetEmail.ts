import { supabase, isSupabaseConfigured } from './supabaseClient';

/** Request a password reset email via SendGrid edge function (all roles). */
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
    return { ok: false, error: error.message || 'Password reset request failed.' };
  }
  if (data?.error) {
    return { ok: false, error: String(data.error) };
  }
  if (data?.ok === false) {
    return { ok: false, error: String(data.error || 'Password reset email could not be sent.') };
  }

  return { ok: true };
}
