import type { DebtLetterType } from '../domain/debtLegal';
import type { CourtLetterMeta, LetterRecord, ValidationLetterMeta } from '../domain/letters';
import {
  catalogEntryById,
  DEBT_LETTER_CATALOG,
  type DebtLetterCatalogEntry,
} from '../legal/debtLetterCatalog';
import { DEBT_LETTER_SPECS } from '../legal/debtLetterTemplates';

export type DebtLetterCardFacts = {
  resolvedCatalogId?: string;
  keyPrinciple: string;
  whenToUse: string[];
  laws: string[];
};

type DebtSavedMeta = Extract<ValidationLetterMeta | CourtLetterMeta, { context: 'debt' }>;

function trimId(id?: string | null): string {
  return String(id || '').trim();
}

function isDebtSavedMeta(meta: unknown): meta is DebtSavedMeta {
  return Boolean(meta && typeof meta === 'object' && (meta as { context?: string }).context === 'debt');
}

function catalogForLetterType(letterType: DebtLetterType): DebtLetterCatalogEntry | undefined {
  return DEBT_LETTER_CATALOG.find((e) => e.letterType === letterType);
}

/**
 * Resolve a catalog row from saved meta or draft ids.
 * Order: explicit catalogId → letterSpecId as catalog id → letterSpecId as DebtLetterType.
 */
export function resolveDebtLetterCatalogEntry(args: {
  catalogId?: string | null;
  letterSpecId?: string | null;
}): { entry?: DebtLetterCatalogEntry; resolvedCatalogId?: string } {
  const catalogId = trimId(args.catalogId);
  const letterSpecId = trimId(args.letterSpecId);

  if (catalogId) {
    const hit = catalogEntryById(catalogId);
    if (hit) return { entry: hit, resolvedCatalogId: catalogId };
  }

  if (letterSpecId) {
    const asCatalog = catalogEntryById(letterSpecId);
    if (asCatalog) return { entry: asCatalog, resolvedCatalogId: letterSpecId };

    const asType = catalogForLetterType(letterSpecId as DebtLetterType);
    if (asType) return { entry: asType, resolvedCatalogId: asType.id };
  }

  return { resolvedCatalogId: catalogId || undefined };
}

/** Vital catalog facts for debt letter cards — catalog wins; DEBT_LETTER_SPECS fills gaps. */
export function resolveDebtLetterCardFacts(args: {
  catalogId?: string | null;
  letterSpecId?: string | null;
}): DebtLetterCardFacts | null {
  const { entry, resolvedCatalogId } = resolveDebtLetterCatalogEntry(args);
  const specId = trimId(args.letterSpecId) || entry?.letterType || '';
  const spec = specId ? DEBT_LETTER_SPECS.find((s) => s.id === specId) : undefined;

  if (!entry && !spec) return null;

  const whenToUse = entry?.whenToUse?.length ? entry.whenToUse : spec?.whenToUse ?? [];
  const keyPrinciple = (entry?.keyPrinciple || spec?.keyPrinciple || '').trim();
  const laws =
    entry?.laws?.length
      ? entry.laws
      : (spec?.legalBasis?.map((l) => l.shortName || l.cite).filter(Boolean) ?? []);

  if (!keyPrinciple && !whenToUse.length && !laws.length) return null;

  return {
    resolvedCatalogId,
    keyPrinciple,
    whenToUse,
    laws,
  };
}

export function debtLetterCardFactsFromCatalogEntry(entry: DebtLetterCatalogEntry): DebtLetterCardFacts {
  return (
    resolveDebtLetterCardFacts({ catalogId: entry.id, letterSpecId: entry.letterType }) ?? {
      resolvedCatalogId: entry.id,
      keyPrinciple: entry.keyPrinciple,
      whenToUse: entry.whenToUse,
      laws: entry.laws,
    }
  );
}

export function debtLetterCardFactsFromLetter(letter: LetterRecord): DebtLetterCardFacts | null {
  if (letter.type !== 'validation' && letter.type !== 'court') return null;
  if (!isDebtSavedMeta(letter.meta)) return null;
  const meta = hydrateDebtLetterMeta(letter.meta);
  return resolveDebtLetterCardFacts({
    catalogId: meta.catalogId,
    letterSpecId: meta.letterSpecId,
  });
}

/** Backfill catalogId on older saves so deploy-time catalog updates resolve on read. */
export function hydrateDebtLetterMeta(meta: DebtSavedMeta): DebtSavedMeta {
  if (meta.catalogId?.trim()) return meta;
  const letterSpecId = String(meta.letterSpecId || '').trim();
  if (!letterSpecId) return meta;
  const resolved = resolveDebtLetterCatalogEntry({ letterSpecId });
  if (!resolved.resolvedCatalogId) return meta;
  return { ...meta, catalogId: resolved.resolvedCatalogId };
}

export function hydrateStoredLetterMeta(letter: LetterRecord): LetterRecord {
  if (!isDebtSavedMeta(letter.meta)) return letter;
  const meta = hydrateDebtLetterMeta(letter.meta);
  if (meta === letter.meta) return letter;
  return { ...letter, meta };
}

export function formatDebtLetterStatLine(facts: DebtLetterCardFacts): string {
  const lawPart = facts.laws.slice(0, 2).join(' · ') || 'Debt letter';
  if (facts.keyPrinciple) return `${lawPart} · ${facts.keyPrinciple}`;
  const when = facts.whenToUse[0]?.trim();
  if (when) return `${lawPart} · ${when}`;
  return lawPart;
}

export function debtLetterWhenToUseSnippet(facts: DebtLetterCardFacts, maxLen = 72): string {
  const first = facts.whenToUse[0]?.trim();
  if (!first) return '';
  if (first.length <= maxLen) return first;
  return `${first.slice(0, maxLen - 1)}…`;
}
