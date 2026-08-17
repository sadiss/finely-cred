import { getDebt } from '../data/debtRepo';
import { listLettersByPartner } from '../data/lettersRepo';
import { upsertLetter } from '../data/lettersRepo';
import type { DebtCase } from '../domain/debt';
import type { CourtLetterMeta, LetterRecord, ValidationLetterMeta } from '../domain/letters';
import type { Partner } from '../domain/partners';
import type { DebtLetterBuildArgs } from '../legal/debtLetterBuildArgs';
import { hydrateStoredLetterMeta, resolveDebtLetterCatalogEntry } from './debtLetterCardFacts';
import { lettersForDebtCase } from './debtCaseLetterLinkage';
import { getCanonicalPartnerIdentity } from '../utils/canonicalPartnerIdentity';
import { FINELY_TENANT_ID } from '../domain/partners';
import { letterDateDisplay } from './letterSenderBlock';

export type DebtVaultIntel = {
  /** catalogId or letterSpecId keys already saved for this case */
  savedKeys: string[];
  hasAnswerDraft: boolean;
  hasAffidavitDraft: boolean;
  hasDiscoveryDraft: boolean;
  hasValidationDraft: boolean;
};

type DebtSavedMeta = Extract<ValidationLetterMeta | CourtLetterMeta, { context: 'debt' }>;

function isDebtSavedMeta(meta: unknown): meta is DebtSavedMeta {
  return Boolean(meta && typeof meta === 'object' && (meta as { context?: string }).context === 'debt');
}

function vaultKeyForLetter(letter: LetterRecord): string[] {
  if (!isDebtSavedMeta(letter.meta)) return [];
  const keys: string[] = [];
  const catalogId = String(letter.meta.catalogId || '').trim();
  const letterSpecId = String(letter.meta.letterSpecId || '').trim();
  if (catalogId) keys.push(catalogId);
  if (letterSpecId) keys.push(letterSpecId);
  const resolved = resolveDebtLetterCatalogEntry({ catalogId, letterSpecId });
  if (resolved.resolvedCatalogId && !keys.includes(resolved.resolvedCatalogId)) {
    keys.push(resolved.resolvedCatalogId);
  }
  if (resolved.entry?.letterType && !keys.includes(resolved.entry.letterType)) {
    keys.push(resolved.entry.letterType);
  }
  return keys;
}

function haystack(letter: LetterRecord): string {
  const meta = isDebtSavedMeta(letter.meta) ? letter.meta : null;
  return `${meta?.catalogId || ''} ${meta?.letterSpecId || ''} ${letter.title || ''}`.toLowerCase();
}

function matchesAnswer(letter: LetterRecord): boolean {
  const h = haystack(letter);
  return (
    h.includes('written_answer') ||
    h.includes('courtroom_written') ||
    h.includes('summons_response') ||
    h.includes('answer_general') ||
    h.includes(' answer')
  );
}

function matchesAffidavit(letter: LetterRecord): boolean {
  const h = haystack(letter);
  return h.includes('affidavit');
}

function matchesDiscovery(letter: LetterRecord): boolean {
  const h = haystack(letter);
  return h.includes('discovery') || h.includes('interrogator') || h.includes('compel');
}

function matchesValidation(letter: LetterRecord): boolean {
  if (letter.type !== 'validation') return false;
  const h = haystack(letter);
  return h.includes('validation') || h.includes('fdcpa') || h.includes('cease') || h.includes('dispute');
}

/** Live vault state for a debt case — powers suggestions + court pipeline on reload. */
export function debtVaultIntel(partnerId: string, debtCaseId: string | null | undefined): DebtVaultIntel {
  const letters = lettersForDebtCase(partnerId, debtCaseId);
  const savedKeys = [...new Set(letters.flatMap(vaultKeyForLetter))];
  return {
    savedKeys,
    hasAnswerDraft: letters.some(matchesAnswer),
    hasAffidavitDraft: letters.some(matchesAffidavit),
    hasDiscoveryDraft: letters.some(matchesDiscovery),
    hasValidationDraft: letters.some(matchesValidation),
  };
}

/** One-time partner vault meta backfill — safe on every deploy / vault open. */
export function backfillPartnerLetterMeta(partnerId: string): number {
  let count = 0;
  for (const letter of listLettersByPartner(partnerId)) {
    if (letter.archivedAt) continue;
    if (letter.type !== 'validation' && letter.type !== 'court') continue;
    if (!isDebtSavedMeta(letter.meta)) continue;
    const hydrated = hydrateStoredLetterMeta(letter);
    if (hydrated.meta !== letter.meta) {
      upsertLetter(hydrated);
      count += 1;
    }
  }
  return count;
}

/** Build generate args from saved case + partner — used when refreshing an existing letter. */
export function buildDebtLetterArgsFromCase(args: {
  debt: DebtCase;
  partner: Partner;
  preferCounsel?: boolean;
}): DebtLetterBuildArgs {
  const tenantId = args.partner.tenantId || FINELY_TENANT_ID;
  const identity = getCanonicalPartnerIdentity({ partner: args.partner, tenantId });
  const isCourt = args.preferCounsel ?? args.debt.type === 'summons';
  const recipientName = args.debt.recipientName || args.debt.name;
  return {
    creditorName: recipientName,
    debtorName: identity.fullName || args.partner.profile.fullName || 'Partner',
    date: letterDateDisplay(),
    debtorAddress1: identity.address1 ?? identity.addressLine1,
    debtorAddress2: identity.address2,
    debtorCity: identity.city,
    debtorState: identity.state,
    debtorPostalCode: identity.postalCode,
    debtorPhone: undefined,
    debtorEmail: undefined,
    recipientName,
    recipientAddress: args.debt.recipientAddress,
    caseNumber: args.debt.courtCaseNumber,
    plaintiffLawFirm: isCourt
      ? args.debt.plaintiffLawFirm || args.debt.collectorName
      : args.debt.plaintiffLawFirm,
    plaintiffLawFirmAddress: args.debt.plaintiffLawFirmAddress,
    plaintiffAttorneyName: args.debt.plaintiffAttorneyName,
    plaintiffAttorneyBarNumber: args.debt.plaintiffAttorneyBarNumber,
    debtCollectorName: args.debt.collectorName,
    originalCreditorName: args.debt.originalCreditor,
    accountNumber: args.debt.accountNumberMasked,
    loanId: args.debt.loanId,
    borrowerId: args.debt.borrowerId,
    affidavitState: identity.state || args.debt.stateJurisdiction,
    affidavitCounty: args.debt.affidavitCounty,
    stateNote: args.debt.stateJurisdiction ? ` In ${args.debt.stateJurisdiction}, the applicable SOL may apply.` : undefined,
    summonsContext: isCourt
      ? {
          courtName: args.debt.courtName,
          amountClaimed: args.debt.amountCents
            ? (args.debt.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
            : undefined,
          dateServed: args.debt.dateServed,
          hearingDate: args.debt.hearingDate,
          jurisdictionState: args.debt.stateJurisdiction,
          collectorName: args.debt.collectorName,
          plaintiffLawFirm: args.debt.plaintiffLawFirm,
          plaintiffAttorneyName: args.debt.plaintiffAttorneyName,
        }
      : undefined,
  };
}

export function debtCaseForLetter(letter: LetterRecord): DebtCase | null {
  if (!isDebtSavedMeta(letter.meta) || !letter.meta.debtId) return null;
  return getDebt(letter.meta.debtId) ?? null;
}

/** Resolve catalog row for a saved debt letter (after meta hydration). */
export function catalogEntryForSavedLetter(letter: LetterRecord) {
  if (!isDebtSavedMeta(letter.meta)) return null;
  const hydrated = hydrateStoredLetterMeta(letter);
  return resolveDebtLetterCatalogEntry({
    catalogId: (hydrated.meta as DebtSavedMeta).catalogId,
    letterSpecId: (hydrated.meta as DebtSavedMeta).letterSpecId,
  });
}
