/** Inline-styled Finely Cred HTML email layout for edge functions. */

const FINELY = {
  emerald: '#10b981',
  violet: '#6366f1',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate100: '#f1f5f9',
  white: '#ffffff',
};

function siteOrigin(): string {
  return (
    Deno.env.get('PUBLIC_SITE_URL') ||
    Deno.env.get('APP_BASE_URL') ||
    Deno.env.get('VITE_APP_BASE_URL') ||
    'https://www.finelycred.com'
  ).replace(/\/$/, '');
}

function logoUrl(): string {
  return `${siteOrigin()}/brand/finely-cred-logo-email-dark.png`;
}

export function wrapFinelyEmailHtml(args: {
  preheader?: string;
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  footerHtml?: string;
  headerTheme?: 'emerald' | 'gold' | 'slate' | 'violet';
}): string {
  const themes = {
    emerald: 'linear-gradient(135deg,#0a100e 0%,#121a17 42%,#065f46 100%)',
    gold: 'linear-gradient(135deg,#0a100e 0%,#121a17 40%,#4c1d95 100%)',
    slate: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)',
    violet: 'linear-gradient(135deg,#0a0612 0%,#1e1b4b 50%,#4c1d95 100%)',
  };
  const bg = themes[args.headerTheme ?? 'emerald'];
  const sub = args.subheadline
    ? `<p style="margin:10px 0 0;font-size:16px;line-height:1.5;color:rgba(255,255,255,0.78);font-family:system-ui,-apple-system,sans-serif;">${args.subheadline}</p>`
    : '';
  const logo = `<img src="${logoUrl()}" width="156" alt="Finely Cred" style="display:block;border:0;outline:none;height:auto;max-width:156px;margin-bottom:14px;" />`;
  const preheader = args.preheader ?? '';
  const footer = args.footerHtml ?? '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${args.headline}</title>
</head>
<body style="margin:0;padding:0;background:${FINELY.slate100};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FINELY.slate100};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${FINELY.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="padding:26px 32px 22px;background:${bg};">
              ${logo}
              <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;">${args.headline}</h1>
              ${sub}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.65;color:${FINELY.slate700};">
              ${args.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-family:system-ui,-apple-system,sans-serif;">
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

export function buildPrimaryCtaButton(args: { label: string; href: string; color?: string }) {
  const bg = args.color ?? FINELY.emerald;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:10px;background:${bg};">
      <a href="${args.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${FINELY.white};text-decoration:none;font-family:system-ui,sans-serif;">${args.label}</a>
    </td>
  </tr>
</table>`;
}

export function buildTrustStrip(): string {
  return `<p style="margin:20px 0 0;padding:16px;border-radius:10px;background:${FINELY.slate100};font-size:12px;line-height:1.5;color:${FINELY.slate600};">
  <strong style="color:${FINELY.slate900};">Educational only</strong> — Finely Cred helps you organize disputes and evidence. We are not a law firm and this is not legal advice.
</p>`;
}

export function buildDefaultEmailFooter(email?: string): string {
  const origin = siteOrigin();
  const unsub = email
    ? `${origin}/unsubscribe?email=${encodeURIComponent(email.trim().toLowerCase())}`
    : `${origin}/unsubscribe`;
  return `<p style="margin:0;font-size:12px;line-height:1.5;color:${FINELY.slate500};">
  <strong style="color:${FINELY.slate900};">Educational only</strong> — Finely Cred helps you organize disputes and evidence. We are not a law firm and this is not legal advice.
  <br/><br/>
  <a href="${unsub}" style="color:${FINELY.slate500};">Unsubscribe</a> · <a href="${origin}" style="color:${FINELY.slate500};">finelycred.com</a>
</p>`;
}
