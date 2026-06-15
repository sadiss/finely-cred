#!/usr/bin/env node
/**
 * Validates signup welcome emails cover every funnel + portal lane (static audit).
 * Usage: npm run signup:email:audit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FUNNELS = [
  'credit_dispute',
  'debt_freedom',
  'portal_debt',
  'business_credit',
  'portal_business',
  'tradeline_insider',
  'portal_tradeline',
  'score_roadmap',
  'agency_white_label',
  'agency_signup',
  'specialist_apply',
  'portal_agent',
  'affiliate_toolkit',
  'portal_affiliate',
  'affiliate_residual',
  'au_seller',
  'portal_au_seller',
  'strategy_session',
  'contact_inquiry',
  'portal_client',
  'portal_funding',
  'bookstore',
  'tradeline_marketplace',
  'meta_lead',
];

const SEND_WIRING = [
  'src/lib/funnelEmail.ts',
  'src/lib/partnerWelcomeEmail.ts',
  'src/comms/signupWelcomeHtmlEmail.ts',
];

console.log('Finely Cred — signup welcome email audit\n');

let failed = 0;
const emailSrc = fs.readFileSync(path.join(root, 'src/comms/signupWelcomeHtmlEmail.ts'), 'utf8');

for (const funnelId of REQUIRED_FUNNELS) {
  const covered = emailSrc.includes(`'${funnelId}'`);
  console.log(`${covered ? '✓' : '✗'} funnel ${funnelId}`);
  if (!covered) failed += 1;
}

const qualityChecks = [
  [emailSrc.includes('wrapFinelyEmailHtml'), 'HTML email layout wrapper'],
  [emailSrc.includes('buildCreditHeroBanner'), 'hero banner block'],
  [emailSrc.includes('buildPrimaryCtaButton'), 'primary CTA button'],
  [emailSrc.includes('buildTrustStrip'), 'trust strip footer'],
  [!/subject:.*enlightenment session/i.test(emailSrc), 'no enlightenment session in subjects'],
  [emailSrc.includes('funnelIdForPartnerLane'), 'portal lane → funnel mapping'],
  [emailSrc.includes('affiliate_residual'), 'affiliate residual dedicated copy'],
];

console.log('\n── Template quality ──');
for (const [ok, label] of qualityChecks) {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failed += 1;
}

console.log('\n── Send wiring ──');
for (const rel of SEND_WIRING) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? '✓' : '✗'} ${rel}`);
  if (!ok) failed += 1;
}

const funnelEmail = fs.readFileSync(path.join(root, 'src/lib/funnelEmail.ts'), 'utf8');
for (const fn of ['sendImmediateWelcomeEmail', 'sendPurchaseWelcomeEmail', 'sendAgencySignupWelcomeEmail']) {
  const ok = funnelEmail.includes(fn);
  console.log(`${ok ? '✓' : '✗'} funnelEmail.${fn}`);
  if (!ok) failed += 1;
}

const partnerWelcome = fs.readFileSync(path.join(root, 'src/lib/partnerWelcomeEmail.ts'), 'utf8');
const partnerOk = partnerWelcome.includes('sendPartnerWelcomeEmail') && partnerWelcome.includes('buildSignupWelcomeEmail');
console.log(`${partnerOk ? '✓' : '✗'} partnerWelcomeEmail → buildSignupWelcomeEmail`);
if (!partnerOk) failed += 1;

if (failed) {
  console.error(`\n${failed} signup email check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${REQUIRED_FUNNELS.length} signup welcome funnels covered + send wiring present.`);
