/**
 * Persist Credit Specialist join intent across signup → onboarding.
 * Stored in sessionStorage; also mirrored into lead notes at capture time.
 */
import { newId } from '../utils/ids';
import {
  CS_OFFER,
  type CreditSpecialistOfferTierId,
} from '../config/creditSpecialistOffer';

const STORAGE_KEY = 'finely.csJoinIntent';

/** How a specialist chose to bring their commitment leads during join. */
export type CreditSpecialistLeadEntryChoice = 'enter_now' | 'upload_csv' | 'later' | '';

/** A lead captured during join before the specialist has a real account — synced into the CRM/Hub after signup. */
export type CreditSpecialistDraftLead = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  source: 'manual' | 'csv';
  createdAt: string;
};

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
  /** Digital invite card join bonus — 1 fewer lead required to unlock full access. */
  digitalCardBonusLeadCredit?: boolean;
  /** How the specialist chose to bring their leads during the "Bring your leads" step. */
  leadEntryChoice?: CreditSpecialistLeadEntryChoice;
  /** Leads entered/uploaded during join — synced into the CRM + Specialist Hub after account creation. */
  draftLeads?: CreditSpecialistDraftLead[];
};

/** Effective lead minimum after applying the digital-card join bonus (never below 1). */
export function minLeadsRequiredWithBonus(digitalCardBonusLeadCredit?: boolean): number {
  return digitalCardBonusLeadCredit ? Math.max(1, CS_OFFER.minLeadsRequired - 1) : CS_OFFER.minLeadsRequired;
}

export function defaultCreditSpecialistJoinIntent(
  partial?: Partial<CreditSpecialistJoinIntent>,
): CreditSpecialistJoinIntent {
  const digitalCardBonusLeadCredit = partial?.digitalCardBonusLeadCredit ?? false;
  return {
    minLeadsRequired: minLeadsRequiredWithBonus(digitalCardBonusLeadCredit),
    freeLeadsWindowDays: CS_OFFER.freeLeadsWindowDays,
    committedMinLeads: false,
    understoodFreeLeadsWindow: false,
    tierId: '',
    digitalCardBonusLeadCredit,
    leadEntryChoice: '',
    draftLeads: [],
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
    const digitalCardBonusLeadCredit = Boolean(parsed.digitalCardBonusLeadCredit);
    return {
      ...defaultCreditSpecialistJoinIntent(),
      ...parsed,
      digitalCardBonusLeadCredit,
      minLeadsRequired: minLeadsRequiredWithBonus(digitalCardBonusLeadCredit),
      freeLeadsWindowDays: CS_OFFER.freeLeadsWindowDays,
      draftLeads: Array.isArray(parsed.draftLeads) ? parsed.draftLeads : [],
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

/** Append a draft lead (manual entry or CSV row) to the intent's draft list. Dedupes by email. */
export function addDraftLeadToJoinIntent(
  intent: CreditSpecialistJoinIntent,
  lead: { fullName: string; email: string; phone?: string; source: 'manual' | 'csv' },
): CreditSpecialistJoinIntent {
  const email = lead.email.trim().toLowerCase();
  const existing = intent.draftLeads ?? [];
  if (email && existing.some((l) => l.email.trim().toLowerCase() === email)) return intent;
  const draftLeads: CreditSpecialistDraftLead[] = [
    ...existing,
    {
      id: newId('draftlead'),
      fullName: lead.fullName.trim(),
      email: lead.email.trim(),
      phone: lead.phone?.trim() || undefined,
      source: lead.source,
      createdAt: new Date().toISOString(),
    },
  ];
  return { ...intent, draftLeads };
}

export function removeDraftLeadFromJoinIntent(
  intent: CreditSpecialistJoinIntent,
  draftLeadId: string,
): CreditSpecialistJoinIntent {
  return { ...intent, draftLeads: (intent.draftLeads ?? []).filter((l) => l.id !== draftLeadId) };
}

/** Human-readable note block for CRM / lead ops. */
export function formatCreditSpecialistJoinIntentNote(intent: CreditSpecialistJoinIntent): string {
  const draftLeads = intent.draftLeads ?? [];
  const lines = [
    'Credit Specialist join intent',
    `Min leads commitment: ${intent.committedMinLeads ? 'YES' : 'NO'} (≥${intent.minLeadsRequired})`,
    `Free-leads window understood: ${intent.understoodFreeLeadsWindow ? 'YES' : 'NO'} (${intent.freeLeadsWindowDays} days)`,
    `Selected tier: ${intent.tierId || '—'}`,
    intent.digitalCardBonusLeadCredit ? 'Digital invite bonus: 1 lead credit applied' : null,
    intent.leadEntryChoice
      ? `Lead entry choice: ${
          intent.leadEntryChoice === 'enter_now'
            ? 'Entered now'
            : intent.leadEntryChoice === 'upload_csv'
              ? 'Uploaded list/CSV'
              : 'Adding in Hub later'
        }`
      : null,
    draftLeads.length ? `Draft leads brought at signup: ${draftLeads.length} (${draftLeads.map((l) => l.email).join(', ')})` : null,
    intent.companyName ? `Company: ${intent.companyName}` : null,
    intent.niche ? `Niche: ${intent.niche}` : null,
    intent.monthlyLeadsEstimate != null ? `Monthly leads estimate: ${intent.monthlyLeadsEstimate}` : null,
    `Captured at: ${intent.createdAt}`,
  ].filter(Boolean);
  return lines.join('\n');
}
