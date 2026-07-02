import { isFeatureEnabled } from '../data/settingsRepo';
import type { Partner } from '../domain/partners';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { signupUrlForRole } from './onboardingRoleRouting';
import { buildPartnerAccountInviteEmail } from './partnerInviteEmailContent';
import { buildPartnerInviteUrlExtras, careerRoleForPartner } from './partnerInviteRouting';
import { canSimulateInviteDeliveryLocally, simulateInviteEmail } from './inviteLocalDev';

function signupInviteUrl(partner: Partner, email: string): string {
  const role = careerRoleForPartner(partner);
  const extras = buildPartnerInviteUrlExtras(partner, email);
  const relative = signupUrlForRole(role, extras);
  if (typeof window !== 'undefined' && window.location?.origin) return `${window.location.origin}${relative}`;
  return relative;
}

/** Send an account-create invite to an unclaimed/admin-created partner. */
export async function sendPartnerInviteEmail(args: {
  partner: Partner;
  email: string;
}): Promise<{ ok: boolean; error?: string; inviteUrl?: string; simulated?: boolean; previewOpened?: boolean }> {
  if (!isFeatureEnabled('inviteDelivery')) return { ok: false, error: 'Invite delivery is disabled in feature flags.' };

  const email = args.email.trim();
  if (!email) return { ok: false, error: 'Missing partner email.' };

  const name = (args.partner.profile.fullName || args.partner.profile.email || email).trim();
  const inviteUrl = signupInviteUrl(args.partner, email);
  const content = buildPartnerAccountInviteEmail({ partner: args.partner, email, inviteUrl });

  if (!isSupabaseConfigured) {
    if (!canSimulateInviteDeliveryLocally()) return { ok: false, error: 'Supabase is not configured.' };
    const sim = simulateInviteEmail({
      kind: 'account_invite',
      to: email,
      subject: content.subject,
      text: content.text,
      html: content.html,
      inviteUrl,
    });
    return { ok: true, inviteUrl, simulated: true, previewOpened: sim.previewOpened };
  }

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      to: { email, name },
      subject: content.subject,
      text: content.text,
      html: content.html,
      idempotencyKey: `partner-signup-invite:${args.partner.id}:${email}:v2`,
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
    return { ok: false, error: realError || error.message || 'Failed to send invite email.', inviteUrl };
  }

  if (!data?.ok && !data?.deduped) {
    return { ok: false, error: data?.error || 'Invite email could not be sent.', inviteUrl };
  }

  return { ok: true, inviteUrl };
}

export { careerRoleForPartner as roleForPartner } from './partnerInviteRouting';
export { signupInviteUrl };
