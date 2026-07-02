import { isFeatureEnabled } from '../data/settingsRepo';
import type { Partner } from '../domain/partners';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { laneToOnboardingRole, signupUrlForRole } from './onboardingRoleRouting';
import { landingPathForRole } from './signupOpsGuide';
import {
  buildDefaultEmailFooter,
  buildGoldAccentDivider,
  buildPrimaryCtaButton,
  buildTrustStrip,
  buildWelcomeJourneySteps,
  wrapFinelyEmailHtml,
} from '../comms/prebuiltHtmlEmailLayout';

function roleForPartner(partner: Partner): 'client' | 'au_seller' | 'agent' | 'affiliate' {
  const lane = (partner.lane || '').toLowerCase();
  const mapped = laneToOnboardingRole(lane);
  if (mapped === 'au_seller' || mapped === 'agent' || mapped === 'affiliate') return mapped;
  if (lane.includes('affiliate')) return 'affiliate';
  if (lane.includes('agent') || lane.includes('specialist')) return 'agent';
  if (lane.includes('seller')) return 'au_seller';
  return 'client';
}

function signupInviteUrl(partner: Partner, email: string): string {
  const role = roleForPartner(partner);
  const extras: Record<string, string> = {
    email,
    invite: '1',
    partnerId: partner.id,
    next: landingPathForRole(role),
  };
  if (partner.lane) extras.lane = partner.lane;
  const relative = signupUrlForRole(role, extras);
  if (typeof window !== 'undefined' && window.location?.origin) return `${window.location.origin}${relative}`;
  return relative;
}

/** Send an account-create invite to an unclaimed/admin-created partner. */
export async function sendPartnerInviteEmail(args: {
  partner: Partner;
  email: string;
}): Promise<{ ok: boolean; error?: string; inviteUrl?: string }> {
  if (!isFeatureEnabled('inviteDelivery')) return { ok: false, error: 'Invite delivery is disabled in feature flags.' };
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured.' };

  const email = args.email.trim();
  if (!email) return { ok: false, error: 'Missing partner email.' };

  const name = (args.partner.profile.fullName || args.partner.profile.email || email).trim();
  const first = name.split(' ')[0] || 'there';
  const inviteUrl = signupInviteUrl(args.partner, email);
  const role = roleForPartner(args.partner);
  const postLogin = landingPathForRole(role);

  const subject = "You're invited to Finely Cred — create your account";
  const roleLabel = role === 'au_seller' ? 'AU Seller' : role === 'agent' ? 'Credit Specialist' : role === 'affiliate' ? 'Affiliate Partner' : 'Finely Partner';
  const text = [
    `Hi ${first},`,
    '',
    'Your Finely Cred access is ready.',
    '',
    'Use the secure link below to create your account. Your email is already filled in, and you only need to choose your password and complete the required profile/legal steps for your role.',
    '',
    inviteUrl,
    '',
    `After setup, your account routes to: ${postLogin}`,
    '',
    'If you already created an account with this email, use the same email to sign in or request a password reset from the login screen.',
    '',
    '— The Finely Cred Team',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">Your Finely Cred access is ready. We created this invite so you can set up your account with the correct role context already attached: <strong>${roleLabel}</strong>.</p>
    ${buildPrimaryCtaButton({ label: 'Create your Finely Cred account', href: inviteUrl, color: '#f59e0b' })}
    ${buildWelcomeJourneySteps([
      { num: '1', title: 'Create your login', body: 'Your email is pre-filled. Choose your password and confirm the required profile details.' },
      { num: '2', title: 'Complete the role fields', body: 'The setup flow shows the fields that apply to your access lane, not a generic blank form.' },
      { num: '3', title: 'Open your workspace', body: `After setup, you will be routed to <strong>${postLogin}</strong>.` },
    ])}
    ${buildGoldAccentDivider()}
    <div style="margin:20px 0;padding:18px;border-radius:14px;background:#0f172a;color:#e2e8f0;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:#fbbf24;font-weight:800;">Your setup link</div>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.55;">If the button does not open, copy and paste this secure link into your browser:</p>
      <p style="margin:10px 0 0;word-break:break-all;"><a href="${inviteUrl}" style="color:#fbbf24;text-decoration:none;">${inviteUrl}</a></p>
    </div>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#475569;">Already created your account? Sign in with <strong>${email}</strong> or request a password reset from the login page.</p>
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Your Finely Cred account setup link is ready.',
    headline: 'Your Finely Cred access is ready',
    subheadline: 'Create your account with the correct role context already attached.',
    bodyHtml,
    footerHtml: buildDefaultEmailFooter(email),
    headerTheme: 'gold',
  });

  const { data, error } = await supabase.functions.invoke('send-invite-email', {
    body: {
      to: { email, name },
      subject,
      text,
      html,
      idempotencyKey: `partner-signup-invite:${args.partner.id}:${email}`,
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
