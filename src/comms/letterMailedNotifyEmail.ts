/**
 * Premium plain-English email when physical mail (Finely Mail / LetterStream) succeeds.
 */
import type { Partner } from '../domain/partners';
import type { MailAddress } from '../lib/mailerClient';
import {
  buildDefaultEmailFooter,
  buildPrimaryCtaButton,
  buildTrustStrip,
  wrapFinelyEmailHtml,
} from './prebuiltHtmlEmailLayout';
import { getDefaultEmailSignature } from '../data/emailDomainsRepo';

function redactAddress(a?: MailAddress | null): string {
  if (!a?.name && !a?.city) return 'recipient on file';
  const name = (a.name || 'Recipient').trim();
  const cityState = [a.city, a.state].filter(Boolean).join(', ');
  const zip = a.zip ? ` ${String(a.zip).slice(0, 5)}` : '';
  // Street line omitted in email for privacy — city/state/ZIP only
  return `${name}${cityState ? ` · ${cityState}${zip}` : ''}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildLetterMailedNotifyEmail(args: {
  partner: Partner;
  letterTitles: string[];
  providerIds: string[];
  to?: MailAddress | null;
  expectedDeliveryDate?: string;
  mailedAtIso?: string;
  actorLabel?: string;
  vaultUrl: string;
  emailDomainId?: string;
}): { subject: string; text: string; html: string } {
  const first = (args.partner.profile.fullName || 'there').split(' ')[0] || 'there';
  const count = args.letterTitles.length || 1;
  const subject =
    count === 1
      ? `Your letter is on the way — ${args.letterTitles[0]?.slice(0, 48) || 'Finely Mail'}`
      : `${count} letters are on the way via Finely Mail`;

  const when = (() => {
    try {
      return new Date(args.mailedAtIso || Date.now()).toLocaleString();
    } catch {
      return 'just now';
    }
  })();

  const toLine = redactAddress(args.to);
  const titles = args.letterTitles.length ? args.letterTitles : ['Your letter'];
  const tracking = args.providerIds.filter(Boolean);
  const domainId = args.emailDomainId ?? 'domain_finely_primary';
  const signature = getDefaultEmailSignature(domainId);

  const listHtml = titles
    .map(
      (t, i) =>
        `<li style="margin:0 0 8px;"><strong style="color:#0f172a;">${escapeHtml(t)}</strong>${
          tracking[i] ? `<br/><span style="font-size:12px;color:#64748b;">Tracking / job: ${escapeHtml(tracking[i]!)}</span>` : ''
        }</li>`,
    )
    .join('');

  const bodyHtml = `
    <div style="margin:0 0 20px;border-radius:18px;overflow:hidden;background:
      radial-gradient(circle at 12% 0%,rgba(245,158,11,0.35),transparent 36%),
      radial-gradient(circle at 90% 20%,rgba(16,185,129,0.28),transparent 32%),
      linear-gradient(135deg,#06100c 0%,#0b1f17 50%,#111827 100%);
      border:1px solid rgba(245,158,11,0.35);padding:24px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#fbbf24;">Finely Mail</div>
      <div style="font-size:26px;line-height:1.15;font-weight:900;color:#fffaf0;margin-top:10px;">${escapeHtml(first)}, your mail is moving.</div>
      <div style="font-size:14px;line-height:1.55;color:rgba(255,250,240,0.82);margin-top:10px;">
        ${count === 1 ? 'One letter' : `${count} letters`} submitted for USPS printing &amp; delivery${args.actorLabel ? ` · mailed by ${escapeHtml(args.actorLabel)}` : ''}.
      </div>
    </div>
    <p style="margin:0 0 14px;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 14px;">Good news — Finely Cred submitted your physical letter${count === 1 ? '' : 's'} through <strong>Finely Mail</strong> on <strong>${escapeHtml(when)}</strong>.</p>
    <div style="margin:18px 0;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;padding:16px 18px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#0f766e;">What mailed</div>
      <ul style="margin:10px 0 0;padding-left:18px;color:#334155;font-size:14px;line-height:1.45;">${listHtml}</ul>
    </div>
    <p style="margin:0 0 10px;font-size:14px;color:#334155;"><strong>Going to:</strong> ${escapeHtml(toLine)}</p>
    ${
      args.expectedDeliveryDate
        ? `<p style="margin:0 0 10px;font-size:14px;color:#334155;"><strong>Expected delivery window:</strong> ${escapeHtml(args.expectedDeliveryDate)}</p>`
        : ''
    }
    <p style="margin:0 0 16px;font-size:14px;color:#475569;">Track status anytime in your Letters Vault. Street addresses are kept private in this email — open the vault for full mail details.</p>
    ${buildPrimaryCtaButton({ label: 'Open Letters Vault', href: args.vaultUrl, color: '#0f766e' })}
    ${buildTrustStrip()}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Results vary · not legal advice · physical mail depends on USPS and print partners.</p>
  `;

  const html = wrapFinelyEmailHtml({
    preheader: subject,
    headline: 'Your mail is on the way',
    subheadline: 'Finely Mail confirmation',
    bodyHtml,
    signatureHtml: signature?.htmlBlock,
    footerHtml: buildDefaultEmailFooter(args.partner.profile.email),
    headerTheme: 'emerald',
  });

  const text = [
    `Hi ${first},`,
    '',
    `${count === 1 ? 'Your letter is' : `${count} letters are`} on the way via Finely Mail (${when}).`,
    '',
    'What mailed:',
    ...titles.map((t, i) => `- ${t}${tracking[i] ? ` [${tracking[i]}]` : ''}`),
    '',
    `To: ${toLine}`,
    args.expectedDeliveryDate ? `Expected delivery: ${args.expectedDeliveryDate}` : '',
    '',
    `Track: ${args.vaultUrl}`,
    '',
    'Results vary · not legal advice.',
  ]
    .filter(Boolean)
    .join('\n');

  return { subject, text, html };
}
