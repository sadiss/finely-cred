/**
 * Partner email copy for letter lifecycle events (generated → saved → ready → mailed).
 */
import type { Partner } from '../domain/partners';
import {
  buildDefaultEmailFooter,
  buildPrimaryCtaButton,
  buildTrustStrip,
  wrapFinelyEmailHtml,
} from './prebuiltHtmlEmailLayout';
import { getDefaultEmailSignature } from '../data/emailDomainsRepo';

export type LetterLifecycleEvent = 'generated' | 'saved' | 'ready_to_mail' | 'mailed';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EVENT_COPY: Record<
  LetterLifecycleEvent,
  { eyebrow: string; headline: (first: string) => string; next: string[]; cta: string; theme: 'emerald' | 'gold' | 'slate' | 'violet' }
> = {
  generated: {
    eyebrow: 'Letter ready',
    headline: (first) => `${first}, your letter draft is ready.`,
    next: [
      'Open Letters Vault to review the draft.',
      'Confirm recipient mailing address before you mail.',
      'Save the PDF, then mail when you are ready.',
    ],
    cta: 'Open Letters Vault',
    theme: 'gold',
  },
  saved: {
    eyebrow: 'Saved to vault',
    headline: (first) => `${first}, your letter was saved.`,
    next: [
      'Review the PDF in Letters Vault.',
      'Verify the TO address (creditor / firm — not your home).',
      'When ready, use Finely Mail or download to print.',
    ],
    cta: 'Open Letters Vault',
    theme: 'violet',
  },
  ready_to_mail: {
    eyebrow: 'Ready to mail',
    headline: (first) => `${first}, a letter is ready to mail.`,
    next: [
      'Confirm the recipient address one more time.',
      'Submit via Finely Mail or print and send yourself.',
      'Keep a copy of what you send for your records.',
    ],
    cta: 'Open Letters Vault',
    theme: 'gold',
  },
  mailed: {
    eyebrow: 'Finely Mail',
    headline: (first) => `${first}, your mail is moving.`,
    next: [
      'Print partner prepares your letter for USPS.',
      'Track status anytime in your Letters Vault.',
      'Keep a copy of what mailed for your records.',
    ],
    cta: 'Open Letters Vault',
    theme: 'emerald',
  },
};

export function buildLetterLifecycleNotifyEmail(args: {
  partner: Partner;
  event: LetterLifecycleEvent;
  letterTitles: string[];
  vaultUrl: string;
  actorLabel?: string;
  emailDomainId?: string;
}): { subject: string; text: string; html: string } {
  const first = (args.partner.profile.fullName || 'there').split(' ')[0] || 'there';
  const count = args.letterTitles.length || 1;
  const titles = args.letterTitles.length ? args.letterTitles : ['Your letter'];
  const copy = EVENT_COPY[args.event];
  const subject =
    args.event === 'mailed'
      ? count === 1
        ? `Your letter is on the way — ${titles[0]?.slice(0, 48) || 'Finely Mail'}`
        : `${count} letters are on the way via Finely Mail`
      : args.event === 'ready_to_mail'
        ? count === 1
          ? `Ready to mail — ${titles[0]?.slice(0, 48) || 'letter'}`
          : `${count} letters ready to mail`
        : args.event === 'saved'
          ? count === 1
            ? `Letter saved — ${titles[0]?.slice(0, 48) || 'Letters Vault'}`
            : `${count} letters saved to your vault`
          : count === 1
            ? `Letter draft ready — ${titles[0]?.slice(0, 48) || 'review next'}`
            : `${count} letter drafts are ready`;

  const domainId = args.emailDomainId ?? 'domain_finely_primary';
  const signature = getDefaultEmailSignature(domainId);
  const listHtml = titles
    .map((t) => `<li style="margin:0 0 8px;"><strong style="color:#0f172a;">${escapeHtml(t)}</strong></li>`)
    .join('');
  const nextHtml = copy.next
    .map((n) => `<li>${escapeHtml(n)}</li>`)
    .join('');

  const bodyHtml = `
    <div style="margin:0 0 20px;border-radius:18px;overflow:hidden;background:
      radial-gradient(circle at 12% 0%,rgba(245,158,11,0.32),transparent 36%),
      linear-gradient(135deg,#06100c 0%,#0b1f17 50%,#111827 100%);
      border:1px solid rgba(245,158,11,0.35);padding:24px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#fbbf24;">${escapeHtml(copy.eyebrow)}</div>
      <div style="font-size:24px;line-height:1.15;font-weight:900;color:#fffaf0;margin-top:10px;">${escapeHtml(copy.headline(first))}</div>
      ${
        args.actorLabel
          ? `<div style="font-size:13px;color:rgba(255,250,240,0.75);margin-top:8px;">Updated by ${escapeHtml(args.actorLabel)}</div>`
          : ''
      }
    </div>
    <p style="margin:0 0 14px;">Hi ${escapeHtml(first)},</p>
    <div style="margin:18px 0;border-radius:14px;border:1px solid #e2e8f0;background:#f8fafc;padding:16px 18px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#0f766e;">Letters</div>
      <ul style="margin:10px 0 0;padding-left:18px;color:#334155;font-size:14px;line-height:1.45;">${listHtml}</ul>
    </div>
    <div style="margin:0 0 16px;border-radius:14px;border:1px solid #d1fae5;background:#ecfdf5;padding:14px 16px;">
      <div style="font-size:11px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#047857;">What to do next</div>
      <ol style="margin:8px 0 0;padding-left:18px;color:#334155;font-size:13px;line-height:1.5;">${nextHtml}</ol>
    </div>
    ${buildPrimaryCtaButton({ label: copy.cta, href: args.vaultUrl, color: '#0f766e' })}
    ${buildTrustStrip()}
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Results vary · not legal advice · verify mailing addresses before sending.</p>
  `;

  const html = wrapFinelyEmailHtml({
    preheader: subject,
    headline: copy.eyebrow,
    subheadline: 'Letter update from Finely Cred',
    bodyHtml,
    signatureHtml: signature?.htmlBlock,
    footerHtml: buildDefaultEmailFooter(args.partner.profile.email),
    headerTheme: copy.theme,
  });

  const text = [
    `Hi ${first},`,
    '',
    copy.headline(first),
    '',
    'Letters:',
    ...titles.map((t) => `- ${t}`),
    '',
    'Next:',
    ...copy.next.map((n, i) => `${i + 1}. ${n}`),
    '',
    `Open: ${args.vaultUrl}`,
    '',
    'Results vary · not legal advice · verify mailing addresses before sending.',
  ].join('\n');

  return { subject, text, html };
}
