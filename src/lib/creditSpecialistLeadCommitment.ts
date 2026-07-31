/**
 * Tracks Credit Specialist 3-lead / 30-day free-leads commitment against the leads system.
 * Counts partner captures attributed to the specialist's referral / promo code.
 */
import { CS_OFFER } from '../config/creditSpecialistOffer';
import { listLeadCaptures } from '../data/leadsRepo';
import { isCreditSpecialistLeadOffer } from './leadOfferLabels';
import { loadCreditSpecialistJoinIntent } from './creditSpecialistJoinIntent';

export type CreditSpecialistLeadCommitmentProgress = {
  minRequired: number;
  freeLeadsWindowDays: number;
  attributedCount: number;
  remaining: number;
  met: boolean;
  windowStartedAt: string | null;
  windowEndsAt: string | null;
  daysLeft: number | null;
  windowExpired: boolean;
  attributedLeadIds: string[];
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

/** Leads the specialist brought (partner funnels) — excludes their own join/guide capture. */
export function listLeadsAttributedToReferralCode(referralCode: string) {
  const code = referralCode.trim().toLowerCase();
  if (!code) return [];
  return listLeadCaptures().filter((l) => {
    if (isCreditSpecialistLeadOffer(l.offer)) return false;
    const ref = (l.referralCode || '').trim().toLowerCase();
    return ref === code;
  });
}

export function computeCreditSpecialistLeadCommitment(args: {
  referralCode?: string | null;
  /** ISO start of free-leads window (join / signup). Falls back to join intent. */
  windowStartedAt?: string | null;
}): CreditSpecialistLeadCommitmentProgress {
  const intent = loadCreditSpecialistJoinIntent();
  const started =
    args.windowStartedAt ||
    intent?.createdAt ||
    null;
  const minRequired = CS_OFFER.minLeadsRequired;
  const freeLeadsWindowDays = CS_OFFER.freeLeadsWindowDays;
  const attributed = listLeadsAttributedToReferralCode(args.referralCode || '');
  const attributedLeadIds = attributed.map((l) => l.id);
  const attributedCount = attributedLeadIds.length;
  const remaining = Math.max(0, minRequired - attributedCount);
  const met = attributedCount >= minRequired;

  let windowEndsAt: string | null = null;
  let daysLeft: number | null = null;
  let windowExpired = false;
  if (started) {
    windowEndsAt = addDays(started, freeLeadsWindowDays);
    const now = new Date().toISOString();
    daysLeft = Math.max(0, daysBetween(now, windowEndsAt));
    windowExpired = new Date(now).getTime() > new Date(windowEndsAt).getTime();
  }

  return {
    minRequired,
    freeLeadsWindowDays,
    attributedCount,
    remaining,
    met,
    windowStartedAt: started,
    windowEndsAt,
    daysLeft,
    windowExpired,
    attributedLeadIds,
  };
}
