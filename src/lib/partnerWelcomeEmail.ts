import type { Partner } from '../domain/partners';
import type { User } from '@supabase/supabase-js';
import { getWelcomeEmailContent } from '../onboarding/welcomeMessage';
import { sendEmail } from './commsDeliveryClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { buildMarketingEmailFooter } from './commsUnsubscribeFooter';
import { buildSignupWelcomeEmail, funnelIdForPartnerLane } from '../comms/signupWelcomeHtmlEmail';
import { resolveSequenceForLead, getNurtureSequence } from '../domain/nurtureSequences';
import type { LeadCapture } from '../domain/leads';
import { ensureDefaultEmailDomainsOnce, refreshDefaultEmailSignatureBranding } from '../data/emailDomainsRepo';

const WELCOME_SENT_KEY = 'finely.partnerWelcomeEmailSent';

function welcomeSentKey(partnerId: string) {
  return `${WELCOME_SENT_KEY}::${partnerId}`;
}

function alreadySent(partnerId: string): boolean {
  try {
    return localStorage.getItem(welcomeSentKey(partnerId)) === '1';
  } catch {
    return false;
  }
}

function markSent(partnerId: string) {
  try {
    localStorage.setItem(welcomeSentKey(partnerId), '1');
  } catch {
    /* ignore */
  }
}

/** Send portal welcome email after partner account creation (best-effort). */
export async function sendPartnerWelcomeEmail(args: {
  user: User | null | undefined;
  partner: Partner;
}): Promise<{ sent: boolean; reason?: string }> {
  const email = (args.partner.profile.email || args.user?.email || '').trim();
  if (!email) return { sent: false, reason: 'no_email' };
  if (alreadySent(args.partner.id)) return { sent: false, reason: 'already_sent' };
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }

  ensureDefaultEmailDomainsOnce();
  refreshDefaultEmailSignatureBranding();

  const configured = getWelcomeEmailContent({ user: args.user, partner: args.partner });
  let subject: string;
  let text: string;
  let html: string | undefined;
  let emailDomainId: string | undefined;

  if (configured?.html || configured?.text) {
    subject = configured.subject;
    text = configured.text;
    html = configured.html;
  } else {
    const laneFunnelId = funnelIdForPartnerLane(args.partner.lane);
    const lead: LeadCapture = {
      id: args.partner.id,
      createdAt: new Date().toISOString(),
      source: 'lead_magnet',
      offer: 'portal_signup',
      fullName: args.partner.profile.fullName || 'Partner',
      email,
      phone: args.partner.profile.phone || '',
      funnelPath: '/onboarding',
      consentToContact: true,
      consentEmailMarketing: true,
    };
    const sequence =
      getNurtureSequence(
        args.partner.lane === 'au_tradelines'
          ? 'seq_au_seller_onboard'
          : args.partner.lane === 'affiliate'
            ? 'seq_affiliate_funnel'
            : args.partner.lane === 'agent'
              ? 'seq_specialist_apply_funnel'
              : 'seq_inbound_nurture',
      ) ?? resolveSequenceForLead({ funnelPath: '/onboarding', offer: 'portal_signup' });
    const portalPath =
      args.partner.lane === 'affiliate'
        ? '/affiliate/hub'
        : args.partner.lane === 'agent'
          ? '/agent/hub'
          : args.partner.lane === 'au_tradelines'
            ? '/au-seller/hub'
            : '/portal/dashboard';
    const built = buildSignupWelcomeEmail({
      lead,
      sequence,
      guideTitle: 'your portal welcome kit',
      overrideFunnelId: laneFunnelId,
      portalPath,
    });
    subject = built.subject;
    text = built.text;
    html = built.html;
    emailDomainId = built.emailDomainId;
  }

  const footer = buildMarketingEmailFooter({ email });

  try {
    await sendEmail({
      toEmail: email,
      toName: args.partner.profile.fullName,
      subject,
      text: `${text}${footer}`,
      html,
      emailDomainId,
    });
    markSent(args.partner.id);
    return { sent: true };
  } catch (e: unknown) {
    return { sent: false, reason: (e as Error)?.message || 'send_failed' };
  }
}
