/** Edge-safe typographic letter HTML — mirrors src/comms/prebuiltHtmlEmailLayout.ts. */
import { buildDefaultEmailFooter } from './finelyEmailLayout.ts';

const FINELY = {
  emerald: '#10b981',
  emeraldDark: '#059669',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate100: '#f1f5f9',
  white: '#ffffff',
};

function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatLetterParagraphHtml(raw: string): string {
  const escaped = escapeEmailHtml(raw).replace(/\n/g, '<br/>');
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#4f46e5;text-decoration:underline;word-break:break-word;">$1</a>',
  );
}

/** First useful URL in a plain-text letter — skip unsubscribe. */
export function inferEmailCta(text: string): { label: string; href: string } | undefined {
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];
  const href = urls
    .map((u) => u.replace(/[).,;]+$/, ''))
    .find((u) => !/unsubscribe/i.test(u));
  if (!href) return undefined;
  const lower = href.toLowerCase();
  if (lower.includes('enlightenment') || lower.includes('/book') || lower.includes('session')) {
    return { label: 'Book a session', href };
  }
  if (lower.includes('free-guide') || lower.includes('/success') || lower.includes('guide')) {
    return { label: 'Open your guide', href };
  }
  if (lower.includes('pricing') || lower.includes('/services')) {
    return { label: 'View pricing', href };
  }
  if (lower.includes('portal') || lower.includes('library') || lower.includes('dashboard')) {
    return { label: 'Open your portal', href };
  }
  if (lower.includes('resources')) {
    return { label: 'Open resources', href };
  }
  return { label: 'Continue', href };
}

/**
 * Typographic letter — generous space, one hairline, almost no chrome.
 * Use this for nurture / AU / check-in mail. Keep wrapFinelyEmailHtml for welcome packs.
 */
export function wrapSimpleLetterHtml(args: {
  headline: string;
  preheader?: string;
  greeting?: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  footerHtml?: string;
}): string {
  const headline = escapeEmailHtml(args.headline);
  const greeting = args.greeting ? escapeEmailHtml(args.greeting) : '';
  const body = args.paragraphs
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 22px;font-size:16px;line-height:1.75;color:${FINELY.slate700};font-family:Georgia,'Times New Roman',serif;">${formatLetterParagraphHtml(p)}</p>`,
    )
    .join('');
  const cta = args.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
  <tr>
    <td style="border:1px solid ${FINELY.emerald};border-radius:999px;">
      <a href="${escapeEmailHtml(args.cta.href)}" style="display:inline-block;padding:12px 26px;font-size:14px;font-weight:700;letter-spacing:0.04em;color:${FINELY.emeraldDark};text-decoration:none;font-family:system-ui,-apple-system,sans-serif;">${escapeEmailHtml(args.cta.label)}</a>
    </td>
  </tr>
</table>`
    : '';
  const footer = args.footerHtml ?? '';
  const preheader = escapeEmailHtml(args.preheader ?? args.paragraphs[0]?.slice(0, 90) ?? '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background:${FINELY.slate100};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FINELY.slate100};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${FINELY.white};border-radius:4px;">
          <tr>
            <td style="padding:48px 44px 40px;">
              <div style="font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.28em;color:${FINELY.slate500};text-transform:uppercase;">Finely Cred</div>
              <div style="height:2px;width:48px;background:${FINELY.emerald};margin:18px 0 28px;"></div>
              <h1 style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;letter-spacing:-0.02em;font-weight:400;color:${FINELY.slate900};">${headline}</h1>
              ${greeting ? `<p style="margin:0 0 22px;font-size:16px;line-height:1.6;font-style:italic;color:${FINELY.slate600};font-family:Georgia,'Times New Roman',serif;">${greeting}</p>` : ''}
              ${body}
              ${cta}
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Turn a plain-text marketing letter into the typographic HTML layout. */
export function htmlFromPlainEmail(args: { headline: string; text: string; email?: string }): string {
  const cta = inferEmailCta(args.text);
  const blocks = args.text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  let greeting: string | undefined;
  let paragraphs = blocks;
  if (blocks[0] && /^hi\s/i.test(blocks[0]) && blocks[0].length < 48) {
    greeting = blocks[0];
    paragraphs = blocks.slice(1);
  }

  paragraphs = paragraphs
    .map((p) => {
      if (!cta) return p;
      if (p.trim() === cta.href) return '';
      return p.replace(cta.href, '').replace(/\n{3,}/g, '\n\n').trim();
    })
    .filter(Boolean);

  return wrapSimpleLetterHtml({
    headline: args.headline,
    preheader: paragraphs[0]?.replace(/\s+/g, ' ').slice(0, 90),
    greeting,
    paragraphs,
    cta,
    footerHtml: buildDefaultEmailFooter(args.email),
  });
}
