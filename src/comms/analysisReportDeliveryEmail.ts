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

const premiumCard = (args: { label: string; value: string; detail: string; accent: string }) => `
  <td width="33.33%" style="vertical-align:top;padding:6px;">
    <div style="min-height:118px;border-radius:16px;padding:16px;background:linear-gradient(145deg,#fffaf0 0%,#f7efe0 100%);border:1px solid ${args.accent};box-shadow:0 12px 28px rgba(15,23,42,0.08);">
      <div style="font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#0f3d2e;">${args.label}</div>
      <div style="font-size:22px;font-weight:900;line-height:1.1;color:${args.accent};margin-top:10px;">${args.value}</div>
      <div style="font-size:12px;line-height:1.45;color:#475569;margin-top:8px;">${args.detail}</div>
    </div>
  </td>`;

function buildPremiumEmailHero(first: string, title?: string) {
  return `<div style="margin:0 0 22px;border-radius:20px;overflow:hidden;background:
    radial-gradient(circle at 10% 0%,rgba(16,185,129,0.36),transparent 34%),
    radial-gradient(circle at 88% 8%,rgba(217,70,239,0.28),transparent 28%),
    radial-gradient(circle at 52% 110%,rgba(245,158,11,0.34),transparent 36%),
    linear-gradient(135deg,#06100c 0%,#0b1f17 48%,#111827 100%);
    border:1px solid rgba(245,158,11,0.34);padding:26px 24px;">
    <div style="font-size:11px;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#fbbf24;">Finely Cred Premium Analysis</div>
    <div style="font-size:27px;line-height:1.12;font-weight:900;color:#fffaf0;margin-top:10px;">${first}, your credit strategy report is ready.</div>
    <div style="font-size:14px;line-height:1.55;color:rgba(255,250,240,0.82);margin-top:12px;">${title ? `<strong style="color:#fcd34d;">${title}</strong><br/>` : ''}Open your vault to view the full PDF with score positioning, bureau comparison, risk cards, and a clean action roadmap.</div>
  </div>`;
}

export function buildAnalysisReportDeliveryEmail(args: {
  partner: Partner;
  parsed: ParsedCreditReport | null;
  candidates: DisputeCandidate[];
  reportsUrl: string;
  emailDomainId?: string;
  analysisTitle?: string;
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

  const scoreCount = args.parsed?.scores?.length ?? 0;
  const tradelineCount = args.parsed?.tradelines?.length ?? 0;
  const topImpact = ranked[0]?.severity ?? 0;

  const bodyHtml = `
    ${buildPremiumEmailHero(first, args.analysisTitle)}
    <p style="margin:0 0 16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;">Your personalized credit analysis is ready. It is built from your parsed credit report data and organized into a premium visual report: scores, bureau differences, positives, negatives, inquiries, and the next action sequence.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;table-layout:fixed;">
      <tr>
        ${premiumCard({ label: 'Scores parsed', value: String(scoreCount), detail: 'Bureau score data available in the source report.', accent: '#10b981' })}
        ${premiumCard({ label: 'Tradelines', value: String(tradelineCount), detail: 'Accounts reviewed for positive support and risk.', accent: '#f59e0b' })}
        ${premiumCard({ label: 'Top impact', value: topImpact ? `${topImpact}/100` : 'Review', detail: 'Highest-ranked review priority from this file.', accent: topImpact >= 70 ? '#e11d48' : '#7c3aed' })}
      </tr>
    </table>
    ${buildNegativeTeaserRows(teaserItems)}
    ${buildPrimaryCtaButton({ label: 'Open your premium analysis vault', href: args.reportsUrl, color: '#0f766e' })}
    <p style="margin:16px 0 0;font-size:14px;color:#475569;">Your PDF includes score positioning, bureau-specific risk cards, positive account strengths, inquiry timing, and a sequenced roadmap tailored to your file.</p>
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Your premium credit analysis is ready with scores, risk cards, and next steps.',
    headline: `${first}, your premium analysis is ready`,
    subheadline: `${ranked.length} review targets ranked · ${scoreCount} score record${scoreCount === 1 ? '' : 's'} parsed`,
    bodyHtml,
    signatureHtml: signature?.htmlBlock,
    footerHtml: buildDefaultEmailFooter(args.partner.profile.email),
    headerTheme: 'emerald',
  });

  const textLines = [
    `Hi ${first},`,
    '',
    'Your premium personalized credit analysis is ready in the portal.',
    '',
    ...teaserItems.map((t) => `- ${t.account} (${t.type}) — impact ${t.severity}/100${t.why ? `: ${t.why}` : ''}`),
    '',
    `Open premium analysis vault: ${args.reportsUrl}`,
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
  analysisTitle?: string;
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
