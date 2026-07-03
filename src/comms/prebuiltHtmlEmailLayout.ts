/** Shared inline-styled HTML blocks for Finely Cred outbound email. */
import {
  buildFinelyEmailHeaderHtml,
  buildFinelyEmailLogoHtml,
  type FinelyEmailHeaderTheme,
} from './finelyEmailBrand';
import { getPublicSiteOrigin } from '../lib/funnelPublicLinks';
import { buildMarketingEmailHtmlFooter } from '../lib/commsUnsubscribeFooter';

export const FINELY_EMAIL = {
  emerald: '#10b981',
  emeraldDark: '#059669',
  violet: '#6366f1',
  violetDark: '#4f46e5',
  fuchsia: '#d946ef',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate100: '#f1f5f9',
  white: '#ffffff',
};

export function wrapFinelyEmailHtml(args: {
  preheader?: string;
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  signatureHtml?: string;
  footerHtml?: string;
  headerTheme?: FinelyEmailHeaderTheme;
  origin?: string;
}): string {
  const preheader = args.preheader ?? '';
  const headerRow = buildFinelyEmailHeaderHtml({
    headline: args.headline,
    subheadline: args.subheadline,
    theme: args.headerTheme ?? 'emerald',
    origin: args.origin,
  });
  const sig = args.signatureHtml ?? '';
  const footer = args.footerHtml ?? '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${args.headline}</title>
</head>
<body style="margin:0;padding:0;background:${FINELY_EMAIL.slate100};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FINELY_EMAIL.slate100};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${FINELY_EMAIL.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          ${headerRow}
          <tr>
            <td style="padding:28px 32px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.65;color:${FINELY_EMAIL.slate700};">
              ${args.bodyHtml}
              ${sig}
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
  const bg = args.color ?? FINELY_EMAIL.emerald;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td style="border-radius:10px;background:${bg};">
      <a href="${args.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${FINELY_EMAIL.white};text-decoration:none;font-family:system-ui,sans-serif;">${args.label}</a>
    </td>
  </tr>
</table>`;
}

export function buildSecondaryCtaLink(args: { label: string; href: string }) {
  return `<p style="margin:12px 0 0;"><a href="${args.href}" style="color:${FINELY_EMAIL.violet};font-weight:600;text-decoration:none;">${args.label} →</a></p>`;
}

/** Three-card row selling credit restoration advantages. */
export function buildCreditAdvantageCards(): string {
  const cards = [
    {
      icon: '📈',
      title: 'Score recovery clarity',
      body: 'See exactly which negatives drag your score down — ranked by impact, not guesswork.',
    },
    {
      icon: '⚖️',
      title: 'Dispute-ready evidence',
      body: 'Turn bureau data into dispute letters, proof packs, and round-by-round tracking.',
    },
    {
      icon: '🏦',
      title: 'Funding path forward',
      body: 'Build toward lender-ready profiles with utilization, tradeline, and lane-specific steps.',
    },
  ];

  const cells = cards
    .map(
      (c) => `<td width="33%" style="vertical-align:top;padding:8px;">
      <div style="background:${FINELY_EMAIL.slate100};border-radius:12px;padding:16px;height:100%;">
        <div style="font-size:24px;margin-bottom:8px;">${c.icon}</div>
        <div style="font-size:14px;font-weight:700;color:${FINELY_EMAIL.slate900};margin-bottom:6px;">${c.title}</div>
        <div style="font-size:13px;line-height:1.5;color:${FINELY_EMAIL.slate600};">${c.body}</div>
      </div>
    </td>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>${cells}</tr>
</table>`;
}

/** Educational block explaining what a personalized analysis reveals. */
export function buildAnalysisPreviewBlock(): string {
  const items = [
    { label: 'Charge-offs & collections', detail: 'Balance, DOFD, bureau mismatches' },
    { label: 'Late payment patterns', detail: 'Recent derog months and severity scoring' },
    { label: 'Cross-bureau inconsistencies', detail: 'High-ROI dispute angles flagged automatically' },
    { label: 'Utilization & tradeline mix', detail: 'Funding readiness signals alongside negatives' },
  ];

  const rows = items
    .map(
      (x) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:14px;font-weight:600;color:${FINELY_EMAIL.slate900};">${x.label}</div>
        <div style="font-size:13px;color:${FINELY_EMAIL.slate500};margin-top:2px;">${x.detail}</div>
      </td>
    </tr>`,
    )
    .join('');

  return `<div style="margin:24px 0;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fafafa;">
  <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${FINELY_EMAIL.violet};margin-bottom:12px;">What your analysis report reveals</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</div>`;
}

/** Dynamic negative preview rows for email teasers (from ranked candidates). */
export function buildNegativeTeaserRows(
  items: Array<{ account: string; type: string; severity: number; why?: string }>,
): string {
  if (!items.length) return buildAnalysisPreviewBlock();

  const rows = items
    .slice(0, 5)
    .map((x) => {
      const barWidth = Math.max(8, Math.min(100, x.severity));
      const color = x.severity >= 80 ? '#dc2626' : x.severity >= 60 ? '#7c3aed' : FINELY_EMAIL.emerald;
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:14px;font-weight:700;color:${FINELY_EMAIL.slate900};">${x.account}</div>
              <div style="font-size:12px;color:${FINELY_EMAIL.slate500};margin-top:2px;">${x.type}${x.why ? ` · ${x.why}` : ''}</div>
            </div>
            <div style="font-size:12px;font-weight:700;color:${color};white-space:nowrap;margin-left:12px;">Impact ${x.severity}/100</div>
          </div>
          <div style="margin-top:8px;height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;">
            <div style="width:${barWidth}%;height:100%;background:${color};border-radius:999px;"></div>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  return `<div style="margin:24px 0;padding:20px;border-radius:12px;border:1px solid #c4b5fd;background:#f5f3ff;">
  <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${FINELY_EMAIL.violetDark};margin-bottom:12px;">Priority negatives (preview)</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  <p style="margin:12px 0 0;font-size:12px;color:${FINELY_EMAIL.slate500};">Full ranked analysis with evidence checklists ships in your portal report.</p>
</div>`;
}

export function buildCreditHeroBanner(args?: { headline?: string; subline?: string; origin?: string }): string {
  const headline = args?.headline ?? 'Restore · Dispute · Fund';
  const subline = args?.subline ?? 'Turn bureau data into a clear action plan';
  const logo = buildFinelyEmailLogoHtml({
    variant: 'dark',
    width: 140,
    origin: args?.origin ?? getPublicSiteOrigin(),
    href: args?.origin ?? getPublicSiteOrigin(),
    align: 'center',
  });
  return `<div style="margin:0 0 24px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#0a100e 0%,#121a17 45%,#312e81 100%);padding:22px 24px;text-align:center;">
  ${logo}
  <div style="font-size:18px;font-weight:700;color:#ffffff;font-family:system-ui,sans-serif;">${headline}</div>
  <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:6px;font-family:system-ui,sans-serif;">${subline}</div>
</div>`;
}

export function buildTrustStrip(): string {
  return `<p style="margin:20px 0 0;padding:16px;border-radius:10px;background:${FINELY_EMAIL.slate100};font-size:12px;line-height:1.5;color:${FINELY_EMAIL.slate600};">
  <strong style="color:${FINELY_EMAIL.slate900};">Educational only</strong> — Finely Cred helps you organize disputes and evidence. We are not a law firm and this is not legal advice. Results vary by file and bureau response.
</p>`;
}

/** Three-step welcome journey — equal-height cards for email clients. */
export function buildWelcomeJourneySteps(
  steps: Array<{ num: string; title: string; body: string }>,
): string {
  const colWidth = steps.length ? Math.floor(100 / steps.length) : 33;
  const cells = steps
    .map(
      (s) => `<td width="${colWidth}%" style="vertical-align:top;padding:6px;">
      <div style="background:linear-gradient(145deg,#0a100e 0%,#121a17 55%,#1e1b4b 100%);border-radius:14px;padding:18px 16px;min-height:168px;border:1px solid rgba(99,102,241,0.28);box-sizing:border-box;">
        <div style="font-size:11px;font-weight:800;letter-spacing:0.12em;color:#a5b4fc;text-transform:uppercase;min-height:16px;">Step ${s.num}</div>
        <div style="font-size:15px;font-weight:700;color:#f8fafc;margin:8px 0 6px;font-family:system-ui,sans-serif;min-height:44px;line-height:1.3;display:flex;align-items:flex-start;">${s.title}</div>
        <div style="font-size:13px;line-height:1.55;color:rgba(226,232,240,0.88);min-height:72px;">${s.body}</div>
      </div>
    </td>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;table-layout:fixed;">
  <tr>${cells}</tr>
</table>`;
}

/** Brand accent divider — emerald + violet (no gold/orange). */
export function buildBrandAccentDivider(): string {
  return `<div style="height:3px;border-radius:999px;margin:24px 0;background:linear-gradient(90deg,transparent 0%,${FINELY_EMAIL.emerald} 28%,${FINELY_EMAIL.violet} 50%,${FINELY_EMAIL.emerald} 72%,transparent 100%);"></div>`;
}

/** @deprecated use buildBrandAccentDivider */
export function buildGoldAccentDivider(): string {
  return buildBrandAccentDivider();
}

export function buildDefaultEmailFooter(email?: string): string {
  return buildMarketingEmailHtmlFooter({ email });
}
