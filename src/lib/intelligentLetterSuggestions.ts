/**
 * Ranked letter suggestions for Litigation / Validation / Credit next-steps.
 * Uses existing catalog IDs + DebtLetterType — does not duplicate the catalog.
 */

import type { DebtCase } from '../domain/debt';
import type { DebtLetterType, DebtScenario } from '../domain/debtLegal';
import type { Partner } from '../domain/partners';
import { DEBT_LETTER_CATALOG, catalogEntryById, type DebtLetterCatalogEntry } from '../legal/debtLetterCatalog';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS, recommendScenarioFromDebt } from '../legal/debtLetterTemplates';
import { getDebtBuyerCaseIntel } from '../legal/litigation/debtBuyerCaseIntelligence';
import {
  classifyLetterProduct,
  letterGenerateCtaLabel,
  letterGenerateHint,
  letterProductBadge,
  type LetterProductKind,
} from './letterProductLabels';
import {
  LITIGATION_STAGES,
  daysUntilHearing,
  recommendLitigationStage,
  type LitigationStageId,
} from './litigationHearingPlan';

export type LetterSuggestionTrack = 'litigation' | 'validation' | 'credit' | 'foreclosure' | 'repossession';

export type RankedLetterSuggestion = {
  rank: number;
  letterType?: DebtLetterType;
  catalogId?: string;
  title: string;
  why: string;
  urgency: 'critical' | 'high' | 'normal';
  primary: boolean;
  /** UI-only product kind so validation vs court filing is unmistakable before Generate. */
  productKind: LetterProductKind;
  productBadge: string;
  generateLabel: string;
  generateHint: string;
  /** Hearing kit opens UI card — does not create a mailed letter draft. */
  uiOnly?: boolean;
};

export type IntelligentLetterSuggestions = {
  track: LetterSuggestionTrack;
  headline: string;
  patternLabel?: string;
  primary: RankedLetterSuggestion;
  alternatives: RankedLetterSuggestion[];
  all: RankedLetterSuggestion[];
};

function titleFor(letterType?: DebtLetterType, catalogId?: string): string {
  if (catalogId) {
    const e = catalogEntryById(catalogId);
    if (e) return e.title;
  }
  if (letterType) {
    const spec = DEBT_LETTER_SPECS.find((s) => s.id === letterType);
    if (spec) return spec.title;
    const byType = DEBT_LETTER_CATALOG.find((e) => e.letterType === letterType);
    if (byType) return byType.title;
  }
  return (letterType || catalogId || 'Letter').replace(/_/g, ' ');
}

function catalogForLetterType(letterType: DebtLetterType): DebtLetterCatalogEntry | undefined {
  return DEBT_LETTER_CATALOG.find((e) => e.letterType === letterType);
}

function missingFieldHints(debt: DebtCase | null): string[] {
  if (!debt) return ['No case selected — pick or scrape a case first'];
  const missing: string[] = [];
  if (!debt.recipientName && !debt.name) missing.push('plaintiff / creditor name');
  if (!debt.recipientAddress && !debt.plaintiffLawFirmAddress) missing.push('counsel / creditor mailing address');
  if (debt.type === 'summons' && !debt.courtCaseNumber) missing.push('case number');
  if (debt.type === 'summons' && !debt.hearingDate) missing.push('hearing date');
  if (!debt.accountNumberMasked && debt.type !== 'summons') missing.push('account reference');
  return missing;
}

function withProductMeta(
  item: Omit<RankedLetterSuggestion, 'rank' | 'primary' | 'productKind' | 'productBadge' | 'generateLabel' | 'generateHint' | 'uiOnly'> & {
    uiOnly?: boolean;
  },
  track: LetterSuggestionTrack,
): Omit<RankedLetterSuggestion, 'rank' | 'primary'> {
  const productKind = classifyLetterProduct({
    letterType: item.letterType,
    catalogId: item.catalogId,
    track,
  });
  const uiOnly = Boolean(item.uiOnly || productKind === 'hearing_kit_ui');
  return {
    ...item,
    productKind,
    productBadge: letterProductBadge(productKind),
    generateLabel: letterGenerateCtaLabel(productKind, item.title),
    generateHint: letterGenerateHint(productKind),
    uiOnly,
  };
}

function pushUnique(
  bag: Map<string, RankedLetterSuggestion>,
  item: Omit<RankedLetterSuggestion, 'rank' | 'primary' | 'productKind' | 'productBadge' | 'generateLabel' | 'generateHint'> & {
    productKind?: LetterProductKind;
    productBadge?: string;
    generateLabel?: string;
    generateHint?: string;
    uiOnly?: boolean;
  },
  track: LetterSuggestionTrack,
) {
  const key = item.catalogId || item.letterType || item.title;
  if (bag.has(key)) return;
  const enriched = withProductMeta(item, track);
  bag.set(key, { ...enriched, rank: bag.size + 1, primary: bag.size === 0 });
}

export function buildIntelligentLetterSuggestions(args: {
  track: LetterSuggestionTrack;
  debt?: DebtCase | null;
  partner?: Partner | null;
  recommendedScenario?: DebtScenario;
  hasSummonsDoc?: boolean;
  hasAnswerDraft?: boolean;
  hasAffidavitDraft?: boolean;
  hasDiscoveryDraft?: boolean;
  disputeRound?: number;
  bureauFocus?: boolean;
}): IntelligentLetterSuggestions {
  const debt = args.debt ?? null;
  const hearingIso = (debt?.hearingDate || '').slice(0, 10);
  const daysLeft = hearingIso ? daysUntilHearing(hearingIso) : 999;
  const scenario =
    args.recommendedScenario ||
    recommendScenarioFromDebt({
      type: debt?.type === 'summons' ? 'summons' : 'debt',
      firstContactDate: debt?.firstContactDate,
      lastPaymentDate: debt?.lastPaymentDate,
      dateServed: debt?.dateServed,
    });
  const scenarioRec = SCENARIO_RECOMMENDATIONS.find((r) => r.scenario === scenario);
  const buyerIntel = getDebtBuyerCaseIntel({
    partner: args.partner,
    debt,
    plaintiff: debt?.name || debt?.recipientName,
    originalCreditor: debt?.originalCreditor,
  });
  const stageId: LitigationStageId =
    args.track === 'litigation'
      ? recommendLitigationStage({
          hasSummonsDoc: Boolean(args.hasSummonsDoc || debt?.type === 'summons'),
          hasAnswerDraft: args.hasAnswerDraft,
          hasAffidavitDraft: args.hasAffidavitDraft,
          hasDiscoveryDraft: args.hasDiscoveryDraft,
          daysLeft,
        })
      : 'intake';
  const stage = LITIGATION_STAGES.find((s) => s.id === stageId) || LITIGATION_STAGES[1]!;
  const missing = missingFieldHints(debt);
  const bag = new Map<string, RankedLetterSuggestion>();
  const track = args.track;
  const push = (
    item: Omit<RankedLetterSuggestion, 'rank' | 'primary' | 'productKind' | 'productBadge' | 'generateLabel' | 'generateHint'> & {
      uiOnly?: boolean;
    },
  ) => pushUnique(bag, item, track);

  const whyBase = (parts: string[]) => parts.filter(Boolean).join(' ');

  if (track === 'litigation' || debt?.type === 'summons' || scenario === 'summons_served' || scenario === 'post_35_days') {
    // Buyer-pattern letter priorities FIRST — Generate must always create a real letter.
    // Court-day kit is UI-only and must never steal the primary Generate CTA.
    for (const lt of buyerIntel.letterPriorities) {
      const entry = catalogForLetterType(lt as DebtLetterType);
      const urgency: RankedLetterSuggestion['urgency'] =
        lt === 'courtroom_written_answer' && !args.hasAnswerDraft ? 'critical' : daysLeft <= 14 ? 'high' : 'normal';
      push({
        letterType: lt as DebtLetterType,
        catalogId: entry?.id,
        title: titleFor(lt as DebtLetterType, entry?.id),
        why: whyBase([
          buyerIntel.patternId !== 'unknown' ? `${buyerIntel.label}.` : 'Collection suit path.',
          lt === 'courtroom_written_answer'
            ? 'Protect the answer deadline — admit only honest facts; put standing and amount at issue.'
            : lt === 'post_suit_validation_demand' || lt === 'validation_request'
              ? 'Force account-level validation / ownership proof while the case is active.'
              : lt === 'assignment_chain_demand'
                ? 'Demand the registry / assignment chain for THIS account — not a pool bill of sale.'
                : lt.includes('affidavit')
                  ? 'Put your dispute under oath and challenge foundation of plaintiff affidavits.'
                  : lt === 'defendant_discovery_requests'
                    ? 'Serve RFAs / interrogatories / RFPs on standing, ledger, and witness knowledge.'
                    : entry?.keyPrinciple || 'Recommended for this case pattern.',
          missing.length ? `Still missing on case: ${missing.slice(0, 2).join(', ')}.` : '',
        ]),
        urgency,
      });
    }

    // Stage catalog IDs (skip kit — kit is never a Generate letter target)
    for (const catalogId of stage.catalogIds) {
      if (catalogId.includes('day_kit')) continue;
      const entry = catalogEntryById(catalogId);
      push({
        letterType: entry?.letterType,
        catalogId,
        title: titleFor(entry?.letterType, catalogId),
        why: whyBase([
          `Litigation stage: ${stage.title}.`,
          stage.nextAction,
          entry?.keyPrinciple || '',
        ]),
        urgency: daysLeft <= 7 ? 'high' : 'normal',
      });
    }

    // Scenario pack (letters only)
    for (const lt of scenarioRec?.recommendedLetterTypes || []) {
      if (String(lt).includes('day_kit')) continue;
      const entry = catalogForLetterType(lt);
      push({
        letterType: lt,
        catalogId: entry?.id,
        title: titleFor(lt, entry?.id),
        why: whyBase([
          scenarioRec?.label ? `Scenario: ${scenarioRec.label}.` : '',
          scenarioRec?.legalWarning?.split('.')[0] ? `${scenarioRec.legalWarning.split('.')[0]}.` : '',
          entry?.keyPrinciple || DEBT_LETTER_SPECS.find((s) => s.id === lt)?.keyPrinciple || '',
        ]),
        urgency: scenario === 'summons_served' ? 'high' : 'normal',
      });
    }

    // Hearing kit as a secondary alternative only — never primary Generate
    if (daysLeft <= 14 && daysLeft >= 0) {
      push({
        letterType: 'courtroom_day_kit',
        catalogId: 'court_courtroom_day_kit',
        title: titleFor('courtroom_day_kit', 'court_courtroom_day_kit'),
        why: whyBase([
          daysLeft <= 3
            ? `Hearing is ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}.`
            : `Hearing in ${daysLeft} days.`,
          'Open the court-day kit on the Hearing step (UI scripts only — not a mailed letter).',
        ]),
        urgency: daysLeft <= 3 ? 'critical' : 'normal',
        uiOnly: true,
      });
    }
  } else if (track === 'validation') {
    const types = (scenarioRec?.recommendedLetterTypes || ['validation_request']).filter(
      (t) => !String(t).includes('courtroom') && !String(t).includes('summons_response'),
    );
    // Midland/debt-buyer off-suit still wants assignment chain
    if (buyerIntel.patternId.includes('midland') || buyerIntel.patternId.includes('pra') || buyerIntel.patternId.includes('velocity') || buyerIntel.patternId === 'debt_buyer_generic') {
      push({
        letterType: 'assignment_chain_demand',
        catalogId: 'validation_chain_of_title',
        title: titleFor('assignment_chain_demand', 'validation_chain_of_title'),
        why: whyBase([
          `${buyerIntel.label}.`,
          'Debt buyers often produce pool docs — demand account-level chain of title before you pay or settle.',
        ]),
        urgency: 'high',
      });
    }
    for (const lt of types) {
      const entry = catalogForLetterType(lt);
      push({
        letterType: lt,
        catalogId: entry?.id,
        title: titleFor(lt, entry?.id),
        why: whyBase([
          scenarioRec?.label ? `Scenario: ${scenarioRec.label}.` : 'Validation track.',
          scenarioRec?.description || '',
          entry?.keyPrinciple || DEBT_LETTER_SPECS.find((s) => s.id === lt)?.keyPrinciple || '',
          missing.length ? `Fill missing fields first: ${missing.slice(0, 2).join(', ')}.` : '',
        ]),
        urgency: scenario === 'validation_period' || scenario === 'first_contact' ? 'high' : 'normal',
      });
    }
  } else if (track === 'foreclosure' || track === 'repossession') {
    const cats = DEBT_LETTER_CATALOG.filter((e) => e.category === track).slice(0, 5);
    for (const entry of cats) {
      push({
        letterType: entry.letterType,
        catalogId: entry.id,
        title: entry.title,
        why: whyBase([entry.keyPrinciple, entry.shortDescription]),
        urgency: 'high',
      });
    }
  } else {
    // Credit / bureau
    const round = args.disputeRound ?? 1;
    const creditEntries = DEBT_LETTER_CATALOG.filter((e) => e.hub === 'credit' || e.category === 'reporting' || e.category === 'bureau').slice(0, 4);
    for (const entry of creditEntries) {
      push({
        letterType: entry.letterType,
        catalogId: entry.id,
        title: entry.title,
        why: whyBase([
          round > 1 ? `You are on dispute round ${round} — escalate documentation pressure.` : 'Start with bureau / furnisher accuracy disputes.',
          entry.keyPrinciple,
        ]),
        urgency: round >= 2 ? 'high' : 'normal',
      });
    }
    if (bag.size === 0) {
      push({
        catalogId: 'reporting_bureau_direct_dispute',
        title: titleFor(undefined, 'reporting_bureau_direct_dispute'),
        why: 'Credit Letters path: dispute inaccurate tradelines with the bureau first, then furnisher if needed.',
        urgency: 'high',
      });
    }
  }

  // Guarantee at least one suggestion
  if (bag.size === 0) {
    push({
      letterType: 'validation_request',
      catalogId: 'validation_initial_fdcpa',
      title: titleFor('validation_request', 'validation_initial_fdcpa'),
      why: 'Default next step: send a written validation demand and keep proof of mailing.',
      urgency: 'high',
    });
  }

  // Prefer a real letter as primary — never a UI-only kit on the Generate button
  const ordered = Array.from(bag.values());
  const letterFirst = [
    ...ordered.filter((s) => !s.uiOnly && s.productKind !== 'hearing_kit_ui'),
    ...ordered.filter((s) => s.uiOnly || s.productKind === 'hearing_kit_ui'),
  ];
  const all = letterFirst.map((s, i) => ({ ...s, rank: i + 1, primary: i === 0 }));
  const primary = all[0]!;
  const alternatives = all.slice(1, 5);

  const headline =
    track === 'litigation'
      ? daysLeft <= 3 && daysLeft >= 0
        ? 'Generate court answer letter next — hearing is imminent'
        : args.hasAnswerDraft
          ? 'Generate affidavit or next court letter'
          : 'Generate court answer letter next'
      : track === 'validation'
        ? 'Generate validation letter next'
        : 'Generate letter next';

  return {
    track,
    headline,
    patternLabel: buyerIntel.patternId !== 'unknown' ? buyerIntel.label : scenarioRec?.label,
    primary,
    alternatives,
    all,
  };
}
