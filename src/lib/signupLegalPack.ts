import type { OnboardingRole } from '../onboarding/pipeline';

export type SignupLegalItemId =
  | 'terms'
  | 'privacy'
  | 'disclaimer'
  | 'nda'
  | 'dataProcessing'
  | 'eSign'
  | 'communication'
  | 'debtServices'
  | 'servicesAgreement'
  | 'partnershipExit';

export type SignupLegalItem = {
  id: SignupLegalItemId;
  label: string;
  href: string;
  summary: string;
  required: boolean;
};

export type SignupLegalContext = {
  role: OnboardingRole;
  focuses: string[];
  lane?: string;
  goal?: string;
};

function hasDebtFocus(ctx: SignupLegalContext): boolean {
  const focuses = Array.isArray(ctx.focuses) ? ctx.focuses : [];
  return (
    focuses.includes('debt_kill') ||
    ctx.lane === 'debt_kill' ||
    (ctx.goal || '').toLowerCase().includes('debt')
  );
}

function servicesAgreementLabel(role: OnboardingRole): string {
  if (role === 'agent') return 'Independent Credit Specialist Agreement';
  if (role === 'affiliate') return 'Affiliate Agreement';
  if (role === 'au_seller') return 'AU Seller & Supply Agreement';
  return 'Client Portal & Services Agreement';
}

function servicesAgreementSummary(role: OnboardingRole): string {
  if (role === 'agent') {
    return 'Revenue share, training access, white-label rules, and compliance expectations for partner specialists.';
  }
  if (role === 'affiliate') {
    return 'Referral tracking, commission terms, and promotional compliance for affiliate partners.';
  }
  if (role === 'au_seller') {
    return 'Tradeline supply listing rules, contract acceptance, payout terms, and verification requirements.';
  }
  return 'Portal access, report uploads, dispute workflow tools, and scope of DIY vs done-for-you services.';
}

/** Required legal acknowledgements during signup — role- and focus-aware. */
export function signupLegalItems(ctx: SignupLegalContext): SignupLegalItem[] {
  const role = ctx.role || 'client';
  const items: SignupLegalItem[] = [
    {
      id: 'terms',
      label: 'Terms of Service',
      href: '/terms',
      summary: 'Platform rules, acceptable use, and account responsibilities.',
      required: true,
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      href: '/privacy',
      summary: 'How we collect, store, encrypt, and limit access to your personal and financial data.',
      required: true,
    },
    {
      id: 'disclaimer',
      label: 'Educational Disclaimer',
      href: '/disclaimer',
      summary: 'Finely Cred provides educational credit workflow tools — not legal advice or guaranteed outcomes.',
      required: true,
    },
    {
      id: 'nda',
      label: 'Mutual Non-Disclosure (NDA)',
      href: '/terms#confidentiality',
      summary:
        'Protects your sensitive credit files, debt details, and our proprietary templates, pricing, and workflows.',
      required: true,
    },
    {
      id: 'dataProcessing',
      label: 'Secure Data & Document Processing',
      href: '/privacy#data-security',
      summary:
        'You authorize encrypted storage of uploaded reports, IDs, letters, and evidence solely for your authorized workflow.',
      required: true,
    },
    {
      id: 'eSign',
      label: 'Electronic Records & E-Sign Consent',
      href: '/terms#esign',
      summary: 'Agreements and dispute letters may be signed electronically; copies are kept in your portal vault.',
      required: true,
    },
    {
      id: 'communication',
      label: 'Case Communication Consent',
      href: '/privacy#contact',
      summary: 'We may contact you by email and in-app messages about your file, disputes, and account security.',
      required: true,
    },
    {
      id: 'servicesAgreement',
      label: servicesAgreementLabel(role),
      href: '/terms#services',
      summary: servicesAgreementSummary(role),
      required: true,
    },
    {
      id: 'partnershipExit',
      label: 'Separation, exit & data portability',
      href: '/privacy#data-retention',
      summary:
        'How to wind down, export your vault, deactivate links, and handle final payouts — whether you stay active or leave later.',
      required: true,
    },
  ];

  if (hasDebtFocus(ctx)) {
    items.push({
      id: 'debtServices',
      label: 'Debt & Collections Workflow Acknowledgment',
      href: '/disclaimer#debt',
      summary:
        'Debt validation, dispute, and collection correspondence tools are educational — not legal representation. You remain responsible for deadlines and court dates.',
      required: true,
    });
  }

  return items;
}

const CONSENT_KEY_MAP: Record<SignupLegalItemId, keyof import('../domain/partners').PartnerConsents> = {
  terms: 'termsAcceptedAt',
  privacy: 'privacyAcceptedAt',
  disclaimer: 'disclaimerAcceptedAt',
  nda: 'ndaAcceptedAt',
  dataProcessing: 'reportUploadConsentAt',
  eSign: 'eSignConsentAt',
  communication: 'communicationConsentAt',
  debtServices: 'debtServicesAcceptedAt',
  servicesAgreement: 'servicesAgreementAcceptedAt',
  partnershipExit: 'partnershipExitAcceptedAt',
};

/** Stamp ISO timestamps for accepted legal items. */
export function buildPartnerConsentsFromSignup(args: {
  acceptedIds: SignupLegalItemId[];
  acceptedName: string;
  nowIso?: string;
}): import('../domain/partners').PartnerConsents {
  const now = args.nowIso ?? new Date().toISOString();
  const consents: import('../domain/partners').PartnerConsents = {};
  for (const id of args.acceptedIds) {
    const key = CONSENT_KEY_MAP[id];
    if (key) (consents as Record<string, string>)[key] = now;
  }
  if (args.acceptedName.trim()) {
    consents.legalAcceptedName = args.acceptedName.trim();
    consents.legalAcceptedAt = now;
  }
  return consents;
}

export function allRequiredLegalAccepted(
  ctx: SignupLegalContext,
  checked: Partial<Record<SignupLegalItemId, boolean>>,
): boolean {
  return signupLegalItems(ctx)
    .filter((i) => i.required)
    .every((i) => Boolean(checked[i.id]));
}
