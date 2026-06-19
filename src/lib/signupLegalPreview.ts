import type { OnboardingRole } from '../onboarding/pipeline';
import type { SignupLegalItemId } from './signupLegalPack';

const ROLE_LABEL: Record<OnboardingRole, string> = {
  '': 'Partner',
  client: 'Client',
  agent: 'Credit Specialist (independent partner)',
  affiliate: 'Affiliate partner',
  au_seller: 'AU Seller',
};

/** Plain-language excerpt shown inline before signup — not a solicitation; operational terms only. */
export function signupLegalPreviewText(id: SignupLegalItemId, role: OnboardingRole): string {
  const who = ROLE_LABEL[role] || 'Partner';

  switch (id) {
    case 'terms':
      return `Platform use rules for ${who}s: account security, acceptable use, dispute workflow scope, and billing when applicable. You may export your data and close your account under Portal → Account settings.`;
    case 'privacy':
      return 'How Finely stores and limits access to credit reports, IDs, letters, and messages. Data is encrypted in transit; files stay in your private bucket — not public URLs.';
    case 'disclaimer':
      return 'Finely Cred provides educational credit workflow tools. We do not guarantee score changes, deletions, or funding approvals. This is not legal advice or representation.';
    case 'nda':
      return 'Mutual confidentiality: your file details stay protected; our templates, pricing logic, and internal workflows stay protected. Survives after the relationship ends.';
    case 'dataProcessing':
      return 'You authorize encrypted storage and processing of uploads (reports, dispute letters, affidavits, validation letters, IDs) solely to run your authorized workflow.';
    case 'eSign':
      return 'You consent to electronic records and signatures. Signed copies remain in your portal vault for download.';
    case 'communication':
      return 'We may email and message you about your file, security alerts, and service updates. You can adjust notification preferences in the portal.';
    case 'servicesAgreement':
      if (role === 'agent') {
        return 'Independent partner terms: revenue share (not employment), training access, white-label rules, client file handling, and compliance expectations while active.';
      }
      if (role === 'affiliate') {
        return 'Referral tracking, commission terms, promotional compliance, and payout rules while you participate in the affiliate program.';
      }
      if (role === 'au_seller') {
        return 'Tradeline supply listing rules, contract acceptance, verification, and payout terms while you sell AU inventory on the platform.';
      }
      return 'Portal access scope, DIY vs done-for-you boundaries, document handling, and service limits for client files.';
    case 'debtServices':
      return 'Debt validation and collection correspondence tools are educational workflow aids — not legal representation. You remain responsible for deadlines, court dates, and responses to collectors.';
    case 'partnershipExit':
      if (role === 'agent') {
        return 'If you stop operating as a specialist: export client lists you own, finish in-flight disputes per your agreement, revoke white-label assets, and settle revenue share through the final payout cycle. No non-compete solicitation — standard confidentiality and data return apply.';
      }
      if (role === 'affiliate' || role === 'au_seller') {
        return 'If you leave the program: referral links deactivate, pending commissions pay out per schedule, and you remove Finely branding from your channels. Confidential client/platform data must not be retained.';
      }
      return 'If you close your account: download your documents and letters from the vault, cancel active subscriptions, and request file deletion under privacy settings. No ongoing service obligations after closure.';
    default:
      return '';
  }
}
