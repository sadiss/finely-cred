import type { Partner } from '../domain/partners';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled, getCommsSettings } from '../data/settingsRepo';
import { buildPartnerClaimInviteEmail } from './partnerInviteEmailContent';
import { sendPartnerInviteEmail } from './partnerInviteEmail';
import { canSimulateInviteDeliveryLocally, simulateInviteEmail, simulateInviteSms } from './inviteLocalDev';

async function invokeInviteEmail(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('send-invite-email', { body });
  if (error) throw new Error(error.message);
  if (!data?.ok && !data?.deduped) throw new Error(data?.error || 'Email send failed.');
  return true;
}

/** Branded account-create invite — pre-filled signup with role context. */
export async function sendPartnerAccountInviteEmail(args: { partner: Partner; email: string }) {
  return sendPartnerInviteEmail(args);
}

/** Branded claim/import invite email. */
export async function sendInviteEmail(args: {
  toEmail: string;
  toName?: string;
  claimUrl: string;
  partner?: Partner;
  mode?: 'claim' | 'account_create';
}) {
  if (!isFeatureEnabled('inviteDelivery')) throw new Error('Invite delivery is disabled (Feature Flags).');

  if (args.mode === 'account_create' && args.partner) {
    const res = await sendPartnerInviteEmail({ partner: args.partner, email: args.toEmail });
    if (!res.ok) throw new Error(res.error || 'Invite email not sent.');
    return true;
  }

  const comms = getCommsSettings();
  const fromEmail = comms.sendgridFromEmail;
  const fromName = comms.sendgridFromName;
  const content = buildPartnerClaimInviteEmail({
    email: args.toEmail,
    name: args.toName,
    claimUrl: args.claimUrl,
  });
  const idem = `claim:${String(args.claimUrl).slice(-64)}`;

  if (!isSupabaseConfigured) {
    if (!canSimulateInviteDeliveryLocally()) throw new Error('Supabase is not configured.');
    simulateInviteEmail({
      kind: 'claim_invite',
      to: args.toEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
      inviteUrl: args.claimUrl,
    });
    return true;
  }

  await invokeInviteEmail({
    to: { email: args.toEmail, name: args.toName ?? undefined },
    from: { email: fromEmail ?? undefined, name: fromName ?? undefined },
    subject: content.subject,
    text: content.text,
    html: content.html,
    idempotencyKey: idem,
  });
  return true;
}

export async function sendInviteSms(args: { toPhone: string; claimUrl: string }) {
  if (!isFeatureEnabled('inviteDelivery')) throw new Error('Invite delivery is disabled (Feature Flags).');

  const comms = getCommsSettings();
  const from = comms.twilioFromPhone;
  const body = `Finely Cred: finish your account setup here: ${args.claimUrl}`;
  const idem = `claim:${String(args.claimUrl).slice(-64)}`;

  if (!isSupabaseConfigured) {
    if (!canSimulateInviteDeliveryLocally()) throw new Error('Supabase is not configured.');
    simulateInviteSms({ to: args.toPhone, body, inviteUrl: args.claimUrl });
    return true;
  }

  const { data, error } = await supabase.functions.invoke('send-invite-sms', {
    body: { to: args.toPhone, from: from ?? undefined, body, idempotencyKey: idem },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'SMS send failed.');
  return true;
}
