import type { DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import { rankDisputeCandidates } from '../creditReports/creditIntelInsights';
import { getDefaultEmailSignature } from '../data/emailDomainsRepo';
import {
  buildNegativeTeaserRows,
  buildPrimaryCtaButton,
  buildDefaultEmailFooter,
  buildTrustStrip,
  wrapFinelyEmailHtml,
} from './prebuiltHtmlEmailLayout';
import { buildMarketingEmailFooter } from '../lib/commsUnsubscribeFooter';
import { sendEmail } from '../lib/commsDeliveryClient';

export function buildAnalysisReportDeliveryEmail(args: {
  partner: Partner;
  parsed: ParsedCreditReport | null;
  candidates: DisputeCandidate[];
  reportsUrl: string;
  emailDomainId?: string;
}) {
  const first = args.partner.profile.fullName.split(' ')[0] || 'there';
  const domainId = args.emailDomainId ?? 'domain_finely_primary';
  const signature = getDefaultEmailSignature(domainId);

  const ranked =
    args.parsed && args.candidates.length
      ? rankDisputeCandidates({ parsed: args.parsed, candidates: args.candidates })
      : [];

  const teaserItems = ranked.slice(0, 5).map((r) => ({
    account: r.account,
    type: r.type,
    severity: r.severity,
    why: r.insight.whyTop.slice(0, 1).join(' · '),
  }));

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;">Your personalized credit analysis is ready. We ranked your dispute targets by impact — charge-offs, collections, late payments, and cross-bureau mismatches — so you know exactly where to start.</p>
    ${buildNegativeTeaserRows(teaserItems)}
    ${buildPrimaryCtaButton({ label: 'Open full analysis report', href: args.reportsUrl })}
    <p style="margin:16px 0 0;font-size:14px;color:#475569;">Your PDF includes evidence checklists, bureau-specific negatives, and a round-by-round roadmap tailored to your file.</p>
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Your ranked credit analysis is ready — see your highest-impact dispute targets.',
    headline: `${first}, your analysis is ready`,
    subheadline: `${ranked.length} dispute targets ranked · evidence checklists included`,
    bodyHtml,
    signatureHtml: signature?.htmlBlock,
    footerHtml: buildDefaultEmailFooter(args.partner.profile.email),
    headerTheme: 'slate',
  });

  const textLines = [
    `Hi ${first},`,
    '',
    'Your personalized credit analysis is ready in the portal.',
    '',
    ...teaserItems.map((t) => `- ${t.account} (${t.type}) — impact ${t.severity}/100${t.why ? `: ${t.why}` : ''}`),
    '',
    `Open report: ${args.reportsUrl}`,
  ];

  return {
    subject: `${first}, your credit analysis is ready`,
    text: textLines.join('\n'),
    html,
    emailDomainId: domainId,
  };
}

export async function sendAnalysisReportDeliveryEmail(args: {
  partner: Partner;
  parsed: ParsedCreditReport | null;
  candidates: DisputeCandidate[];
  reportsUrl: string;
  emailDomainId?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const toEmail = (args.partner.profile.email || '').trim();
  if (!toEmail) return { sent: false, reason: 'no_email' };

  const email = buildAnalysisReportDeliveryEmail(args);
  const footer = buildMarketingEmailFooter({ email: toEmail });

  try {
    await sendEmail({
      toEmail,
      toName: args.partner.profile.fullName,
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
