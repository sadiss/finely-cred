import type { Partner } from '../domain/partners';
import {
  buildBrandAccentDivider,
  buildPrimaryCtaButton,
  buildTrustStrip,
  buildWelcomeJourneySteps,
  wrapFinelyEmailHtml,
  buildDefaultEmailFooter,
  FINELY_EMAIL,
} from '../comms/prebuiltHtmlEmailLayout';
import {
  careerRoleForPartner,
  landingPathForPartner,
  roleLabelForInvite,
  serviceLabelForPartner,
} from './partnerInviteRouting';

export { careerRoleForPartner as roleForPartner } from './partnerInviteRouting';
export { roleLabelForInvite } from './partnerInviteRouting';

export function buildPartnerAccountInviteEmail(args: {
  partner: Partner;
  email: string;
  inviteUrl: string;
}) {
  const email = args.email.trim();
  const name = (args.partner.profile.fullName || args.partner.profile.email || email).trim();
  const first = name.split(' ')[0] || 'there';
  const role = careerRoleForPartner(args.partner);
  const roleLabel = roleLabelForInvite(role, args.partner);
  const serviceLabel = serviceLabelForPartner(args.partner);
  const postLogin = landingPathForPartner(args.partner);

  const subject = `${first}, your Finely Cred access is ready`;
  const text = [
    `Hi ${first},`,
    '',
    'Your Finely Cred access is ready.',
    '',
    'Use the secure link below to finish account setup. Your email is already attached to this invite, and your service lane is pre-loaded.',
    '',
    args.inviteUrl,
    '',
    `Access: ${serviceLabel}`,
    `After setup: ${postLogin}`,
    '',
    '— The Finely Cred Team',
  ].join('\n');

  const bodyHtml = `
    <div style="margin:0 0 18px;padding:14px 16px;border-radius:12px;background:linear-gradient(90deg,rgba(16,185,129,0.12),rgba(99,102,241,0.12));border:1px solid rgba(16,185,129,0.25);">
      <div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${FINELY_EMAIL.emeraldDark};font-weight:800;">Secure partner invite</div>
      <div style="margin-top:6px;font-size:13px;line-height:1.55;color:${FINELY_EMAIL.slate600};">Pre-filled for <strong>${email}</strong> · ${serviceLabel}</div>
    </div>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${FINELY_EMAIL.slate700};">
      Your Finely Cred workspace invite is ready. This is <strong>not</strong> a generic public signup — your email and <strong>${serviceLabel}</strong> lane are already attached to this secure link.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:18px 20px;border-radius:14px;background:linear-gradient(135deg,#0a100e 0%,#121a17 48%,#312e81 100%);border:1px solid rgba(99,102,241,0.28);">
          <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#a5b4fc;font-weight:800;">Invite details</div>
          <div style="margin-top:10px;font-size:14px;line-height:1.65;color:#e2e8f0;">
            <div><strong style="color:#fff;">Email:</strong> ${email}</div>
            <div style="margin-top:6px;"><strong style="color:#fff;">Service lane:</strong> ${serviceLabel}</div>
            <div style="margin-top:6px;"><strong style="color:#fff;">After setup:</strong> ${postLogin}</div>
          </div>
        </td>
      </tr>
    </table>
    ${buildWelcomeJourneySteps([
      { num: '1', title: 'Open your invite', body: 'Your email is pre-filled on the secure signup screen.' },
      { num: '2', title: 'Set your password', body: 'Confirm legal acknowledgements — your service lane is already attached.' },
      { num: '3', title: 'Enter your workspace', body: 'Land directly on your dashboard after setup completes.' },
    ])}
    ${buildPrimaryCtaButton({ label: 'Finish account setup', href: args.inviteUrl, color: FINELY_EMAIL.emeraldDark })}
    ${buildBrandAccentDivider()}
    <div style="margin:18px 0;padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.14em;color:${FINELY_EMAIL.slate500};font-weight:800;">Secure setup link</div>
      <p style="margin:8px 0 0;font-size:13px;line-height:1.55;color:${FINELY_EMAIL.slate600};">If the button does not open, copy and paste this link:</p>
      <p style="margin:10px 0 0;word-break:break-all;"><a href="${args.inviteUrl}" style="color:${FINELY_EMAIL.violetDark};text-decoration:none;font-weight:600;">${args.inviteUrl}</a></p>
    </div>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:${FINELY_EMAIL.slate500};">Already finished setup? Sign in with <strong>${email}</strong> or request a password reset from the login page.</p>
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Your Finely Cred invite is ready — finish account setup in minutes.',
    headline: 'Your Finely Cred invite is ready',
    subheadline: `${serviceLabel} — finish setup with your email already attached.`,
    bodyHtml,
    footerHtml: buildDefaultEmailFooter(email),
    headerTheme: 'emerald',
  });

  return { subject, text, html, first, roleLabel, postLogin };
}

export function buildPartnerClaimInviteEmail(args: {
  email: string;
  name?: string;
  claimUrl: string;
}) {
  const email = args.email.trim();
  const name = (args.name || email).trim();
  const first = name.split(' ')[0] || 'there';

  const subject = `${first}, connect your Finely Cred profile`;
  const text = [
    `Hi ${first},`,
    '',
    'Your Finely Cred profile is ready to connect to your account.',
    '',
    args.claimUrl,
    '',
    '— The Finely Cred Team',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;">Hi <strong>${first}</strong>,</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:${FINELY_EMAIL.slate700};">
      Your imported Finely Cred profile is ready. Use the secure link below to connect it to your account and continue your journey.
    </p>
    ${buildPrimaryCtaButton({ label: 'Connect my profile', href: args.claimUrl, color: FINELY_EMAIL.violetDark })}
    ${buildBrandAccentDivider()}
    <p style="margin:0;font-size:13px;line-height:1.6;color:${FINELY_EMAIL.slate500};">If you did not expect this message, you can ignore it.</p>
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: 'Connect your Finely Cred profile to your account.',
    headline: 'Connect your Finely Cred profile',
    subheadline: 'Secure link to claim your imported partner record.',
    bodyHtml,
    footerHtml: buildDefaultEmailFooter(email),
    headerTheme: 'violet',
  });

  return { subject, text, html };
}
