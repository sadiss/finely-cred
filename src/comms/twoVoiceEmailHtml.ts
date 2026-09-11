import { buildDefaultEmailFooter, buildPrimaryCtaButton, wrapFinelyEmailHtml } from './prebuiltHtmlEmailLayout';

export function wrapTwoVoiceEmailHtml(args: {
  headline: string;
  subheadline?: string;
  englishArtifact: string;
  kreyolMeaning: string;
  englishWords?: string;
  bodyHtml?: string;
  ctaLabel: string;
  ctaHref: string;
  footerEmail?: string;
}): string {
  const words = args.englishWords
    ? `<p style="margin:12px 0 0;font-size:14px;color:#475569;"><strong>English words you will see again:</strong> ${args.englishWords}</p>`
    : '';
  const extra = args.bodyHtml ?? '';
  const body = `
<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#047857;">English file</div>
      <p style="margin:8px 0 0;font-size:16px;line-height:1.55;color:#0f172a;font-weight:700;">${args.englishArtifact}</p>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 18px;background:#f5f3ff;border:1px solid #ddd6fe;border-top:0;">
      <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#6d28d9;">Sans Kreyòl</div>
      <p style="margin:8px 0 0;font-size:16px;line-height:1.55;color:#1e1b4b;font-weight:700;">${args.kreyolMeaning}</p>
      ${words}
    </td>
  </tr>
</table>
${extra}
${buildPrimaryCtaButton({ label: args.ctaLabel, href: args.ctaHref })}
<p style="margin:16px 0 0;font-size:13px;color:#64748b;">Results vary · not legal advice · funding subject to underwriting</p>
<p style="margin:4px 0 0;font-size:13px;color:#64748b;">Rezilta yo varye · sa a pa konsèy legal · finansman depann de apwobasyon</p>
`;
  return wrapFinelyEmailHtml({
    headline: args.headline,
    subheadline: args.subheadline,
    bodyHtml: body,
    footerHtml: buildDefaultEmailFooter(args.footerEmail ?? '{{partner.profile.email}}'),
    headerTheme: 'emerald',
  });
}
