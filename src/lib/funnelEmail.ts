import type { LeadCapture } from '../domain/leads';

import { resolveSequenceForLead, getNurtureSequence } from '../domain/nurtureSequences';

import { sendEmail } from './commsDeliveryClient';

import { isFeatureEnabled } from '../data/settingsRepo';

import { isSupabaseConfigured } from './supabaseClient';

import { buildMarketingEmailFooter } from './commsUnsubscribeFooter';

import { buildSignupWelcomeEmail } from '../comms/signupWelcomeHtmlEmail';

import { ensureDefaultEmailDomainsOnce, refreshDefaultEmailSignatureBranding } from '../data/emailDomainsRepo';

import { buildFunnelDownloadUrl } from './funnelPublicLinks';



export async function sendImmediateWelcomeEmail(args: {

  lead: LeadCapture;

  guideTitle?: string;

  downloadUrl?: string;

}): Promise<{ sent: boolean; reason?: string }> {

  if (!args.lead.email?.trim()) return { sent: false, reason: 'no_email' };

  if (!args.lead.consentToContact && !args.lead.consentEmailMarketing) {

    return { sent: false, reason: 'no_consent' };

  }

  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {

    return { sent: false, reason: 'comms_not_configured' };

  }



  ensureDefaultEmailDomainsOnce();
  refreshDefaultEmailSignatureBranding();



  const sequence = resolveSequenceForLead({

    funnelPath: args.lead.funnelPath,

    offer: args.lead.offer,

    interest: args.lead.interest,

    utmSource: args.lead.utmSource,

    utmMedium: args.lead.utmMedium,

  });

  const downloadUrl =

    args.downloadUrl ??

    (args.lead.funnelPath ? buildFunnelDownloadUrl(args.lead.funnelPath) : undefined);



  const email = buildSignupWelcomeEmail({

    lead: args.lead,

    sequence,

    guideTitle: args.guideTitle,

    downloadUrl,

  });

  const footer = buildMarketingEmailFooter({ email: args.lead.email });



  try {

    await sendEmail({

      toEmail: args.lead.email.trim(),

      toName: args.lead.fullName,

      subject: email.subject,

      text: `${email.text}${footer}`,

      html: email.html,

      emailDomainId: email.emailDomainId,

    });

    return { sent: true };

  } catch (e: unknown) {

    return { sent: false, reason: (e as Error)?.message || 'send_failed' };

  }

}

/** Rich HTML welcome after bookstore or tradeline purchase. */
export async function sendPurchaseWelcomeEmail(args: {
  partnerId: string;
  productTitle: string;
  purchaseType: 'ebook' | 'tradeline';
  leadId?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { listPartnersLocal } = await import('../data/partnersRepo');
  const partner = listPartnersLocal().find((p) => p.id === args.partnerId);
  const email = (partner?.profile.email || '').trim();
  if (!email) return { sent: false, reason: 'no_email' };
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }

  ensureDefaultEmailDomainsOnce();
  refreshDefaultEmailSignatureBranding();

  const funnelId = args.purchaseType === 'ebook' ? 'ebook_purchase' : 'tradeline_purchase';
  const sequence =
    getNurtureSequence(args.purchaseType === 'ebook' ? 'seq_ebook_purchase' : 'seq_tradeline_purchase') ??
    resolveSequenceForLead({
      offer: args.purchaseType === 'ebook' ? 'book_purchase' : 'tradeline_package',
    });

  const lead: LeadCapture = {
    id: args.leadId ?? args.partnerId,
    createdAt: new Date().toISOString(),
    source: 'purchase',
    offer: args.purchaseType === 'ebook' ? 'book_purchase' : 'tradeline_package',
    fullName: partner?.profile.fullName || 'Partner',
    email,
    phone: partner?.profile.phone || '',
    consentToContact: true,
    consentEmailMarketing: true,
  };

  const built = buildSignupWelcomeEmail({
    lead,
    sequence,
    guideTitle: args.productTitle,
    overrideFunnelId: funnelId,
    portalPath: args.purchaseType === 'ebook' ? '/portal/library' : '/portal/dashboard',
  });

  const footer = buildMarketingEmailFooter({ email });

  try {
    await sendEmail({
      toEmail: email,
      toName: partner?.profile.fullName,
      subject: built.subject,
      text: `${built.text}${footer}`,
      html: built.html,
      emailDomainId: built.emailDomainId,
    });
    return { sent: true };
  } catch (e: unknown) {
    return { sent: false, reason: (e as Error)?.message || 'send_failed' };
  }
}

/** Agency tenant creation welcome email. */
export async function sendAgencySignupWelcomeEmail(args: {
  email: string;
  fullName: string;
  agencyName: string;
  tenantId: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const email = args.email.trim();
  if (!email) return { sent: false, reason: 'no_email' };
  if (!isFeatureEnabled('commsDelivery') || !isSupabaseConfigured) {
    return { sent: false, reason: 'comms_not_configured' };
  }

  ensureDefaultEmailDomainsOnce();
  refreshDefaultEmailSignatureBranding();

  const sequence = getNurtureSequence('seq_agency_signup')!;
  const lead: LeadCapture = {
    id: args.tenantId,
    createdAt: new Date().toISOString(),
    source: 'agency',
    offer: 'agency_workspace',
    fullName: args.fullName || args.agencyName,
    email,
    phone: '',
    funnelPath: '/agency/signup',
    consentToContact: true,
    consentEmailMarketing: true,
  };

  const built = buildSignupWelcomeEmail({
    lead,
    sequence,
    guideTitle: args.agencyName,
    overrideFunnelId: 'agency_signup',
    portalPath: '/admin/access',
  });

  const footer = buildMarketingEmailFooter({ email });

  try {
    await sendEmail({
      toEmail: email,
      toName: args.fullName || args.agencyName,
      subject: built.subject,
      text: `${built.text}${footer}`,
      html: built.html,
      emailDomainId: built.emailDomainId,
    });

    const { enrollLeadInNurtureSequence } = await import('./nurtureEngine');
    enrollLeadInNurtureSequence({
      leadId: lead.id,
      sequenceId: 'seq_agency_signup',
      tenantId: args.tenantId,
      context: {
        email,
        fullName: lead.fullName,
        agencyName: args.agencyName,
        immediateWelcomeSent: true,
      },
    });

    return { sent: true };
  } catch (e: unknown) {
    return { sent: false, reason: (e as Error)?.message || 'send_failed' };
  }
}

