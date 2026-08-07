/**
 * Digital invite card registry — SSOT for the clickable card roles, their tracked join
 * URLs, and the join incentive unlocked when someone joins through a card.
 *
 * Ownership: role ids + URL contract + incentive definitions live here (Agent 2 lane).
 * Card visuals (image paths, layout, QR art) are additive and can be layered on top of
 * these entries without touching the tracking/incentive fields.
 *
 * URL contract: `<destPath>?invite=<role>&src=digital-card` (+ optional extra params).
 * See `src/lib/digitalInviteCardAttribution.ts` for capture/persistence and
 * `src/lib/leadAttribution.ts` for the generic promoter/UTM pipeline this feeds into.
 */

/**
 * Partner tracks people *join* (`re`…`au_seller`) plus service invites a partner
 * hands to someone they are helping (`restore`, `tradelines`). Both kinds share
 * the same tracked-URL contract and bonus pipeline.
 */
export type DigitalInviteCardRole =
  | 're'
  | 'cs'
  | 'case_help'
  | 'agency'
  | 'au_seller'
  | 'affiliate'
  | 'restore'
  | 'tradelines';

export type DigitalInviteCardBonus = {
  id: string;
  /** Short label shown on the card and in chips. */
  label: string;
  /** Full sentence shown in the "you unlocked" banner. */
  description: string;
};

export type DigitalInviteCardDef = {
  role: DigitalInviteCardRole;
  /** Human label for the role, used in copy + admin views. */
  title: string;
  /** Destination path the card links to (join / apply flow). */
  destPath: string;
  /** Program application / lead offer tag this role maps to. */
  offerTag: string;
  bonus: DigitalInviteCardBonus;
};

export const DIGITAL_INVITE_CARD_SRC = 'digital-card' as const;
export const DIGITAL_INVITE_PARAM = 'invite' as const;
export const DIGITAL_INVITE_SRC_PARAM = 'src' as const;

export const DIGITAL_INVITE_CARDS: Record<DigitalInviteCardRole, DigitalInviteCardDef> = {
  re: {
    role: 're',
    title: 'Real Estate Partner',
    destPath: '/careers/real-estate',
    offerTag: 'real_estate_affiliate',
    bonus: {
      id: 'priority_onboarding_call',
      label: 'Priority call within 1 business day',
      description:
        'You unlocked a priority onboarding call by joining through your invite card — our team reaches out within 1 business day, ahead of the standard queue.',
    },
  },
  cs: {
    role: 'cs',
    title: 'Credit Specialist',
    destPath: '/credit-specialist',
    offerTag: 'credit_specialist_join',
    bonus: {
      id: 'bonus_lead_credit',
      label: '1 bonus lead credit',
      description:
        'You unlocked 1 bonus lead credit by joining through your invite card — bring just 2 partners instead of 3 to open full Specialist Hub access.',
    },
  },
  case_help: {
    role: 'case_help',
    title: 'Case Help (Paralegal / Attorney / Consultant)',
    destPath: '/careers/case-help',
    offerTag: 'case_help',
    bonus: {
      id: 'priority_review_onesheet_pack',
      label: 'Priority review + one-sheet pack',
      description:
        'You unlocked priority application review and the partner one-sheet pack by joining through your invite card — both are yours the moment you apply.',
    },
  },
  agency: {
    role: 'agency',
    title: 'Agency Partner',
    destPath: '/agency-partners',
    offerTag: 'agency_partner',
    bonus: {
      id: 'priority_tenant_setup',
      label: 'Priority tenant setup within 1 business day',
      description:
        'You unlocked a priority white-label tenant setup session by joining through your invite card — our team provisions your workspace within 1 business day.',
    },
  },
  au_seller: {
    role: 'au_seller',
    title: 'AU Tradeline Seller',
    destPath: '/au-sellers',
    offerTag: 'au_seller',
    bonus: {
      id: 'priority_listing_review',
      label: 'Priority listing review',
      description:
        'You unlocked priority listing review by joining through your invite card — your first tradeline inventory goes live faster.',
    },
  },
  affiliate: {
    role: 'affiliate',
    title: 'Affiliate Partner',
    destPath: '/affiliate',
    offerTag: 'affiliate_application',
    bonus: {
      id: 'priority_payout_setup',
      label: 'Priority payout setup',
      description:
        'You unlocked priority affiliate activation by joining through your invite card — your tracked link and payout profile are set up ahead of the standard queue.',
    },
  },
  restore: {
    role: 'restore',
    // `/fix-my-credit` redirects and drops query params, so the card points at
    // the real service route to keep invite attribution intact.
    destPath: '/pricing/personal-credit-restore',
    title: 'Personal Credit Restore',
    offerTag: 'personal_credit_restore',
    bonus: {
      id: 'priority_report_review',
      label: 'Priority report review',
      description:
        'You unlocked a priority three-bureau report review by starting through this invite card — a specialist reads your report before your first call.',
    },
  },
  tradelines: {
    role: 'tradelines',
    title: 'Tradeline Marketplace',
    destPath: '/tradelines',
    offerTag: 'au_tradelines',
    bonus: {
      id: 'priority_au_matching',
      label: 'Priority AU matching',
      description:
        'You unlocked priority authorized-user matching by starting through this invite card — your profile is matched against available seasoned lines first.',
    },
  },
};

export function listDigitalInviteCards(): DigitalInviteCardDef[] {
  return Object.values(DIGITAL_INVITE_CARDS);
}

export function getDigitalInviteCardDef(role: string | null | undefined): DigitalInviteCardDef | null {
  const r = String(role ?? '').trim() as DigitalInviteCardRole;
  return DIGITAL_INVITE_CARDS[r] ?? null;
}

export function parseDigitalInviteCardRole(raw: string | null | undefined): DigitalInviteCardRole | null {
  const r = String(raw ?? '').trim().toLowerCase();
  return r && r in DIGITAL_INVITE_CARDS ? (r as DigitalInviteCardRole) : null;
}

/**
 * Build the tracked invite URL for a card role, e.g.
 * `/careers/real-estate?invite=re&src=digital-card`.
 */
export function buildDigitalInviteCardUrl(
  role: DigitalInviteCardRole,
  opts?: { absolute?: boolean; extraParams?: Record<string, string> },
): string {
  const def = DIGITAL_INVITE_CARDS[role];
  const params = new URLSearchParams();
  params.set(DIGITAL_INVITE_PARAM, role);
  params.set(DIGITAL_INVITE_SRC_PARAM, DIGITAL_INVITE_CARD_SRC);
  if (opts?.extraParams) {
    for (const [k, v] of Object.entries(opts.extraParams)) params.set(k, v);
  }
  const path = `${def.destPath}?${params.toString()}`;
  if (!opts?.absolute) return path;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  return `${origin}${path}`;
}
