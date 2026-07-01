import {
  buildDefaultEmailFooter,
  buildPrimaryCtaButton,
  wrapFinelyEmailHtml,
} from './finelyEmailLayout.ts';

export function buildPasswordResetEmail(args: { resetLink: string; email: string }) {
  const first = args.email.split('@')[0] || 'there';
  const subject = 'Reset your Finely Cred password';

  const text = [
    `Hi ${first},`,
    '',
    'You requested a password reset for your Finely Cred account.',
    '',
    'Open this secure link to choose a new password (valid for about 1 hour):',
    args.resetLink,
    '',
    'If you did not request this, you can safely ignore this email — your password will not change.',
    '',
    '— Finely Cred',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">We received a request to reset the password for <strong>${args.email}</strong>. Click the button below to choose a new password. This link is secure and expires in about <strong>one hour</strong>.</p>
    ${buildPrimaryCtaButton({ label: 'Set new password', href: args.resetLink })}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Button not working? Copy and paste this link into your browser:<br/>
      <a href="${args.resetLink}" style="color:#6366f1;word-break:break-all;">${args.resetLink}</a>
    </p>
    <div style="margin:24px 0 0;padding:16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">
        <strong style="color:#0f172a;">Didn't request this?</strong> You can ignore this email — your account stays protected and no changes will be made.
      </p>
    </div>
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Use this secure link to set a new password. Expires in about one hour.',
    headline: 'Reset your password',
    subheadline: 'Secure link — valid for about one hour',
    bodyHtml,
    footerHtml: buildDefaultEmailFooter(args.email),
    headerTheme: 'violet',
  });

  return { subject, text, html };
}
