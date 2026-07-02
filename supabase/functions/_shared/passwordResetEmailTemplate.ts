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
    <p style="margin:0 0 16px;font-size:16px;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 16px;">We received a request to reset the password for <strong>${args.email}</strong>. Use the secure button below to choose a new password. Your old password stays protected and admins cannot see it.</p>
    <div style="margin:18px 0;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
      <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#4c1d95;">Secure reset window</div>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.55;color:#475569;">This link is valid for about <strong>one hour</strong>. Open it on the same device/browser you want to use for Finely Cred.</p>
    </div>
    ${buildPrimaryCtaButton({ label: 'Set new password', href: args.resetLink, color: '#6366f1' })}
    <p style="margin:16px 0 0;font-size:13px;color:#64748b;">Button not working? Copy and paste this link into your browser:<br/>
      <a href="${args.resetLink}" style="color:#6366f1;word-break:break-all;">${args.resetLink}</a>
    </p>
    <div style="margin:24px 0 0;padding:16px;border-radius:14px;background:#0f172a;border:1px solid #334155;">
      <p style="margin:0;font-size:13px;line-height:1.5;color:#475569;">
        <strong style="color:#ffffff;">Didn't request this?</strong> <span style="color:#cbd5e1;">You can ignore this email — your account stays protected and no changes will be made.</span>
      </p>
    </div>
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Use this secure link to set a new password. Expires in about one hour.',
    headline: 'Secure password reset',
    subheadline: 'Choose a new Finely Cred password safely.',
    bodyHtml,
    footerHtml: buildDefaultEmailFooter(args.email),
    headerTheme: 'violet',
  });

  return { subject, text, html };
}
