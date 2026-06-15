import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled, getCommsSettings } from '../data/settingsRepo';

export async function sendInviteEmail(args: { toEmail: string; toName?: string; claimUrl: string }) {
  if (!isFeatureEnabled('inviteDelivery')) throw new Error('Invite delivery is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const comms = getCommsSettings();
  const fromEmail = comms.sendgridFromEmail;
  const fromName = comms.sendgridFromName;
  const subject = 'Claim your Finely Cred profile';
  const text =
    `You have a Finely Cred profile ready.\n\n` +
    `Claim it here:\n${args.claimUrl}\n\n` +
    `If you didn’t request this, you can ignore this message.\n`;
  const idem = `claim:${String(args.claimUrl).slice(-64)}`;

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      to: { email: args.toEmail, name: args.toName ?? undefined },
      from: { email: fromEmail ?? undefined, name: fromName ?? undefined },
      subject,
      text,
      idempotencyKey: idem,
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Email send failed.');
  return true;
}

export async function sendInviteSms(args: { toPhone: string; claimUrl: string }) {
  if (!isFeatureEnabled('inviteDelivery')) throw new Error('Invite delivery is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const comms = getCommsSettings();
  const from = comms.twilioFromPhone;
  const body = `Finely Cred: claim your profile here: ${args.claimUrl}`;
  const idem = `claim:${String(args.claimUrl).slice(-64)}`;

  const { data, error } = await supabase.functions.invoke('send-invite-sms', {
    body: { to: args.toPhone, from: from ?? undefined, body, idempotencyKey: idem },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'SMS send failed.');
  return true;
}

