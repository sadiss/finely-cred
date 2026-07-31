/**
 * Persist Credit Specialist join intent across signup → onboarding.
 * Stored in sessionStorage; also mirrored into lead notes at capture time.
 */
import {
  CS_OFFER,
  type CreditSpecialistOfferTierId,
} from '../config/creditSpecialistOffer';

const STORAGE_KEY = 'finely.csJoinIntent';

export type CreditSpecialistJoinIntent = {
  minLeadsRequired: number;
  freeLeadsWindowDays: number;
  committedMinLeads: boolean;
  understoodFreeLeadsWindow: boolean;
  tierId: CreditSpecialistOfferTierId | '';
  fullName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  niche?: string;
  monthlyLeadsEstimate?: number;
  leadId?: string;
  createdAt: string;
};

export function defaultCreditSpecialistJoinIntent(
  partial?: Partial<CreditSpecialistJoinIntent>,
): CreditSpecialistJoinIntent {
  return {
    minLeadsRequired: CS_OFFER.minLeadsRequired,
    freeLeadsWindowDays: CS_OFFER.freeLeadsWindowDays,
    committedMinLeads: false,
    understoodFreeLeadsWindow: false,
    tierId: '',
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function saveCreditSpecialistJoinIntent(intent: CreditSpecialistJoinIntent): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // ignore quota / private mode
  }
}

export function loadCreditSpecialistJoinIntent(): CreditSpecialistJoinIntent | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CreditSpecialistJoinIntent;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...defaultCreditSpecialistJoinIntent(),
      ...parsed,
      minLeadsRequired: CS_OFFER.minLeadsRequired,
      freeLeadsWindowDays: CS_OFFER.freeLeadsWindowDays,
    };
  } catch {
    return null;
  }
}

export function clearCreditSpecialistJoinIntent(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Human-readable note block for CRM / lead ops. */
export function formatCreditSpecialistJoinIntentNote(intent: CreditSpecialistJoinIntent): string {
  const lines = [
    'Credit Specialist join intent',
    `Min leads commitment: ${intent.committedMinLeads ? 'YES' : 'NO'} (≥${intent.minLeadsRequired})`,
    `Free-leads window understood: ${intent.understoodFreeLeadsWindow ? 'YES' : 'NO'} (${intent.freeLeadsWindowDays} days)`,
    `Selected tier: ${intent.tierId || '—'}`,
    intent.companyName ? `Company: ${intent.companyName}` : null,
    intent.niche ? `Niche: ${intent.niche}` : null,
    intent.monthlyLeadsEstimate != null ? `Monthly leads estimate: ${intent.monthlyLeadsEstimate}` : null,
    `Captured at: ${intent.createdAt}`,
  ].filter(Boolean);
  return lines.join('\n');
}
