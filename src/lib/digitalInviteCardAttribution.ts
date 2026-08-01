/**
 * Digital invite card join bonus — capture, persist, and redeem the "join through the
 * card" incentive. Persists to localStorage (not sessionStorage) so a QR/print card
 * scanned today still unlocks the bonus if the person joins days later on any device
 * session, then mirrors the same touch into the generic lead attribution pipeline so
 * standard lead capture (promoterRole/promoType/promoAsset/UTM) tags it automatically.
 */
import {
  DIGITAL_INVITE_CARD_SRC,
  DIGITAL_INVITE_PARAM,
  DIGITAL_INVITE_SRC_PARAM,
  DIGITAL_INVITE_CARDS,
  getDigitalInviteCardDef,
  parseDigitalInviteCardRole,
  type DigitalInviteCardDef,
  type DigitalInviteCardRole,
} from '../config/digitalInviteCards';
import { captureLeadAttributionFromUrl } from './leadAttribution';

const STORAGE_KEY = 'finely.digital_invite_card.v1';
/** How long a scanned/clicked card stays eligible for its bonus before joining. */
const ELIGIBILITY_WINDOW_DAYS = 60;

export type DigitalInviteCardEligibility = {
  role: DigitalInviteCardRole;
  bonusId: string;
  capturedAt: string;
  expiresAt: string;
  redeemed: boolean;
  redeemedAt?: string;
  leadId?: string;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function loadRaw(): DigitalInviteCardEligibility | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DigitalInviteCardEligibility;
    if (!parsed || typeof parsed !== 'object' || !parsed.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function save(eligibility: DigitalInviteCardEligibility) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eligibility));
  } catch {
    // ignore quota / private mode
  }
}

function isExpired(eligibility: DigitalInviteCardEligibility): boolean {
  return new Date().getTime() > new Date(eligibility.expiresAt).getTime();
}

/**
 * Read `?invite=<role>&src=digital-card` from the URL and persist eligibility for the
 * join bonus. Safe to call on every page mount — no-ops when the params are absent.
 * Also feeds the generic lead-attribution pipeline (first-touch, session-scoped) so any
 * lead capture on the page tags promoterRole/promoType/promoAsset/UTM automatically.
 */
export function captureDigitalInviteCardFromUrl(search: string, pathname?: string): DigitalInviteCardEligibility | null {
  const params = new URLSearchParams(search || '');
  const src = (params.get(DIGITAL_INVITE_SRC_PARAM) || '').trim().toLowerCase();
  const role = parseDigitalInviteCardRole(params.get(DIGITAL_INVITE_PARAM));

  if (src === DIGITAL_INVITE_CARD_SRC && role) {
    const def = DIGITAL_INVITE_CARDS[role];
    const capturedAt = new Date().toISOString();
    const eligibility: DigitalInviteCardEligibility = {
      role,
      bonusId: def.bonus.id,
      capturedAt,
      expiresAt: addDays(capturedAt, ELIGIBILITY_WINDOW_DAYS),
      redeemed: false,
    };
    save(eligibility);

    captureLeadAttributionFromUrl(
      `?promoter_role=${encodeURIComponent(role)}&promo_type=digital_card&promo_asset=digital-card-${encodeURIComponent(role)}&utm_source=digital-card&utm_medium=invite&utm_campaign=digital_card_${encodeURIComponent(role)}`,
      pathname,
    );

    return eligibility;
  }

  const existing = loadRaw();
  if (existing && !isExpired(existing)) return existing;
  return null;
}

/** Current, unexpired eligibility (if any) — for banners/UI. */
export function getDigitalInviteCardEligibility(): DigitalInviteCardEligibility | null {
  const existing = loadRaw();
  if (!existing || isExpired(existing)) return null;
  return existing;
}

/** Eligibility scoped to a specific role — returns null if the stored touch is for another role. */
export function getDigitalInviteCardEligibilityForRole(role: DigitalInviteCardRole): DigitalInviteCardEligibility | null {
  const eligibility = getDigitalInviteCardEligibility();
  return eligibility && eligibility.role === role ? eligibility : null;
}

export function getDigitalInviteCardDefForEligibility(eligibility: DigitalInviteCardEligibility): DigitalInviteCardDef | null {
  return getDigitalInviteCardDef(eligibility.role);
}

/** Mark the bonus as redeemed once the join/application/lead capture completes. */
export function markDigitalInviteCardRedeemed(leadId?: string): DigitalInviteCardEligibility | null {
  const existing = loadRaw();
  if (!existing) return null;
  const next: DigitalInviteCardEligibility = {
    ...existing,
    redeemed: true,
    redeemedAt: new Date().toISOString(),
    leadId: leadId ?? existing.leadId,
  };
  save(next);
  return next;
}

export function clearDigitalInviteCardEligibility() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Lead attribution fields to merge into `submitLeadCapture` calls on join/apply pages. */
export function digitalInviteCardLeadAttributionFields(eligibility: DigitalInviteCardEligibility) {
  return {
    promoterRole: eligibility.role,
    promoType: 'digital_card',
    promoAsset: `digital-card-${eligibility.role}`,
    utmSource: 'digital-card',
    utmMedium: 'invite',
    utmCampaign: `digital_card_${eligibility.role}`,
  } as const;
}

/** CRM tags — attach via `addLeadTags(leadId, ...)` so the invite source is searchable. */
export function digitalInviteCardLeadTags(eligibility: DigitalInviteCardEligibility): string[] {
  return [
    'invite_source:digital-card',
    `digital_card_role:${eligibility.role}`,
    `digital_card_bonus:${eligibility.bonusId}`,
  ];
}

/** Note text for `addLeadNote` / `ProgramApplication.notes`. */
export function formatDigitalInviteCardNote(eligibility: DigitalInviteCardEligibility): string {
  const def = getDigitalInviteCardDef(eligibility.role);
  return [
    'Digital invite card join bonus',
    `Role: ${def?.title ?? eligibility.role}`,
    `Bonus: ${def?.bonus.label ?? eligibility.bonusId}`,
    `Captured at: ${eligibility.capturedAt}`,
  ].join('\n');
}
