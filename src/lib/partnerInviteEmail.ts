import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { Partner } from '../domain/partners';

/** Send a signup invite email to an unclaimed partner via the send-invite-email edge function. */
export async function sendPartnerInviteEmail(args: {
  partner: Partner;
  email: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured.' };

  const email = args.email.trim();
  const name = (args.partner.profile.fullName || args.partner.profile.email || email).trim();
  const first = name.split(' ')[0] || 'there';
  const inviteUrl = `${window.location.origin}/signup?auth=signup&email=${encodeURIComponent(email)}&invite=1`;

  const subject = `You're invited to Finely Cred — create your account`;

  const text = [
    `Hi ${first},`,
    '',
    "You've been invited to access Finely Cred — a credit intelligence platform built to help you build, protect, and leverage your credit profile.",
    '',
    'Click the link below to create your account. Your email address is already pre-filled — just choose a password and complete your profile.',
    '',
    inviteUrl,
    '',
    'The link is ready to use now. If you have any questions, reply to this email.',
    '',
    '— The Finely Cred Team',
  ].join('\n');

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      to: { email, name },
      subject,
      text,
      idempotencyKey: `partner-invite:${args.partner.id}:${Date.now()}`,
    },
  });

  if (error) {
    let realError: string | undefined;
    try {
      const body = await (error as any).context?.json?.();
      realError = body?.error || body?.message;
    } catch {
      // ignore
    }
    return { ok: false, error: realError || error.message || 'Failed to send invite email.' };
  }

  if (!data?.ok && !data?.deduped) {
    return { ok: false, error: data?.error || 'Invite email could not be sent.' };
  }

  return { ok: true };
}
