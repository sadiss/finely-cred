/**
 * Roosevelt Corelus — court / Midland–Citi hearing partner seed.
 * Stable import id so Admin can find him separately from Yolie (credit restore).
 * Hearing 2026-07-27 is decided: monthly payment plan on file.
 * Educational self-help · not legal advice.
 */

import type { Partner } from '../domain/partners';
import type { DebtCase } from '../domain/debt';
import type { CreditReportRecord } from '../domain/creditReports';
import type { PartnerCourtOutcome } from '../domain/courtOutcomes';
import { formatUsdCents } from '../domain/courtOutcomes';
import { getCourtOutcomeByDebtCase, upsertCourtOutcome } from './courtOutcomeRepo';
import {
  adminGetPartner,
  adminUpsertPartner,
  createPartner,
  findPartnerByImportExternalId,
  getPartner,
} from './partnersRepo';
import { createDebtCase, listDebtByPartner, upsertDebt } from './debtRepo';
import { listReportsByPartner, upsertReport } from './reportsRepo';
import { LEGACY_PENDING_BLOB_PREFIX } from '../lib/legacyPendingReport';
import {
  ENTITLEMENT_KEYS,
  ensurePartnerEntitlementsAsync,
  SERVICE_ACCESS_BUNDLES,
  type EntitlementKey,
} from '../billing/entitlements';
import { newId } from '../utils/ids';
import { nowIso } from '../domain/partners';
import { FINELY_TENANT_ID } from '../domain/tenants';

/** Stable browser/local + Supabase-friendly id (deterministic UUID). */
export const ROOSEVELT_COURT_PARTNER_ID = 'a8c3e7f1-4b2d-4e9a-9c1f-7d6e5b4a3928';

export const ROOSEVELT_IMPORT_SOURCE = 'manual' as const;
export const ROOSEVELT_IMPORT_EXTERNAL_ID = 'finely:roosevelt-corelus-court-v1';

/** Trial / hearing date for Roosevelt’s Midland / Citi matter. */
export const ROOSEVELT_HEARING_ISO = '2026-07-27';

export const ROOSEVELT_DISPLAY_NAME = 'Roosevelt Corelus';
export const ROOSEVELT_REPORT_FILENAME = 'Roosevelts-Report.html';
export const ROOSEVELT_DEBT_CASE_MARKER = 'roosevelt-midland-citi-hearing-2026-07-27';

/* ---------------------------------------------------------------------------
 * Court outcome (owner-confirmed). The hearing is over: Roosevelt had already
 * agreed to pay the collector before the court date, and the court outcome
 * reflects that prior agreement as a monthly payment plan.
 * ------------------------------------------------------------------------- */

export const ROOSEVELT_COURT_OUTCOME_MARKER = 'roosevelt-court-outcome-payment-plan-v1';
/** Date the outcome was entered — same day as the hearing. */
export const ROOSEVELT_OUTCOME_DECIDED_ISO = ROOSEVELT_HEARING_ISO;
/** $50.00 per month. */
export const ROOSEVELT_PLAN_MONTHLY_CENTS = 5000;
/** Two years of payments. */
export const ROOSEVELT_PLAN_TERM_MONTHS = 24;
/** First payment falls one month after the hearing, on the same day of month. */
export const ROOSEVELT_PLAN_FIRST_PAYMENT_ISO = '2026-08-27';
/** Last scheduled payment (24 months from the first). */
export const ROOSEVELT_PLAN_FINAL_PAYMENT_ISO = '2028-07-27';

export const ROOSEVELT_OUTCOME_SUMMARY = `Pay ${formatUsdCents(
  ROOSEVELT_PLAN_MONTHLY_CENTS,
)} per month for ${ROOSEVELT_PLAN_TERM_MONTHS} months`;

export const ROOSEVELT_OUTCOME_CONTEXT =
  'Roosevelt had already agreed to pay the collector before the court date, so the outcome carries that prior agreement forward as a monthly payment plan rather than a contested ruling.';

/** Durable case note written onto the partner record so it survives deploy. */
export const ROOSEVELT_CASE_NOTE = [
  `COURT OUTCOME (${ROOSEVELT_OUTCOME_DECIDED_ISO}) — Midland Funding LLC / Citibank, N.A.`,
  `${ROOSEVELT_OUTCOME_SUMMARY} (${formatUsdCents(
    ROOSEVELT_PLAN_MONTHLY_CENTS * ROOSEVELT_PLAN_TERM_MONTHS,
  )} total), ${ROOSEVELT_PLAN_FIRST_PAYMENT_ISO} through ${ROOSEVELT_PLAN_FINAL_PAYMENT_ISO}.`,
  ROOSEVELT_OUTCOME_CONTEXT,
  'Open items: written agreement on file, monthly payment receipts, satisfaction paperwork at plan end, credit reporting cleanup after that.',
  'Educational self-help · not legal advice.',
].join('\n');

export const ROOSEVELT_PLAN_PAYEE_NAME = 'Midland Credit Management / Midland Funding LLC';
export const ROOSEVELT_PLAINTIFF_NAME = 'Midland Funding LLC';
export const ROOSEVELT_ORIGINAL_CREDITOR = 'Citibank, N.A.';

/**
 * Durable journey signals for the partner row (Supabase-backed), so the outcome
 * survives a deploy even when the local outcome store is empty on a new device.
 */
export function rooseveltCourtJourneySignals(): Record<string, unknown> {
  return {
    courtMatter: 'midland_citi',
    hearingDate: ROOSEVELT_HEARING_ISO,
    defenseBookSubject: true,
    notYolie: true,
    hearingResolved: true,
    courtOutcome: 'payment_plan',
    courtOutcomeBasis: 'agreed_before_hearing',
    courtOutcomeDecidedIso: ROOSEVELT_OUTCOME_DECIDED_ISO,
    courtOutcomeSummary: ROOSEVELT_OUTCOME_SUMMARY,
    planMonthlyCents: ROOSEVELT_PLAN_MONTHLY_CENTS,
    planTermMonths: ROOSEVELT_PLAN_TERM_MONTHS,
    planTotalCents: ROOSEVELT_PLAN_MONTHLY_CENTS * ROOSEVELT_PLAN_TERM_MONTHS,
    planFirstPaymentIso: ROOSEVELT_PLAN_FIRST_PAYMENT_ISO,
    planFinalPaymentIso: ROOSEVELT_PLAN_FINAL_PAYMENT_ISO,
    planPayeeName: ROOSEVELT_PLAN_PAYEE_NAME,
    planAgreedBeforeHearing: true,
    postCourtTrack: 'post_court_payment_plan',
    nextStepId: 'order_on_file',
    writtenOrderOnFile: false,
  };
}

/** Outcome payload for the durable court-outcome store. */
export function buildRooseveltCourtOutcome(args: {
  partnerId: string;
  debtCaseId: string;
  existing?: PartnerCourtOutcome | null;
}): Omit<PartnerCourtOutcome, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: string } {
  const { partnerId, debtCaseId, existing } = args;
  return {
    id: existing?.id,
    createdAt: existing?.createdAt,
    partnerId,
    debtCaseId,
    kind: 'payment_plan',
    basis: 'agreed_before_hearing',
    verdictSummary: ROOSEVELT_OUTCOME_SUMMARY,
    contextNote: ROOSEVELT_OUTCOME_CONTEXT,
    decidedIso: ROOSEVELT_OUTCOME_DECIDED_ISO,
    plaintiffName: ROOSEVELT_PLAINTIFF_NAME,
    originalCreditor: ROOSEVELT_ORIGINAL_CREDITOR,
    plan: {
      monthlyCents: ROOSEVELT_PLAN_MONTHLY_CENTS,
      termMonths: ROOSEVELT_PLAN_TERM_MONTHS,
      firstPaymentIso: ROOSEVELT_PLAN_FIRST_PAYMENT_ISO,
      dueDayOfMonth: Number(ROOSEVELT_PLAN_FIRST_PAYMENT_ISO.slice(8, 10)),
      payeeName: ROOSEVELT_PLAN_PAYEE_NAME,
      agreedBeforeHearing: true,
    },
    // Owner-entered facts stay authoritative once the partner starts logging progress.
    writtenOrderOnFile: existing?.writtenOrderOnFile ?? false,
    confirmedPaymentIsos: existing?.confirmedPaymentIsos ?? [],
    courtName: existing?.courtName,
    courtCaseNumber: existing?.courtCaseNumber,
  };
}

/** Idempotent: writes Roosevelt's payment-plan outcome without erasing logged payments. */
export function ensureRooseveltCourtOutcome(partnerId: string, debtCaseId: string): PartnerCourtOutcome {
  const existing = getCourtOutcomeByDebtCase(debtCaseId);
  return upsertCourtOutcome(buildRooseveltCourtOutcome({ partnerId, debtCaseId, existing }));
}

/** Redacted high-level facts from the 07/21/2026 SmartCredit HTML (no SSN / full DOB). */
export const ROOSEVELT_REPORT_SUMMARY = {
  reportDate: '2026-07-21',
  fullName: ROOSEVELT_DISPLAY_NAME,
  scores: { tu: 443, exp: 447, eqf: 441 },
  currentAddress: '30 Portland St, Haverhill, MA 01830',
  previousAddress: '70 Boylston St Apt 2, Malden, MA 02148',
  employers: ['CARC Appliance Repair', 'Diamond Factory Service', 'Self Employed'],
  publicRecordsCount: 0,
  collectionHighlights: [
    {
      label: 'MIDLANDCRE',
      accountMasked: '33435****',
      balance: '$1,094.00',
      highCredit: '$1,610.00',
      status: 'Derogatory / Collection',
      dateOpened: '07/01/2025',
      originalCreditorHint: 'Citibank / Citi family (defense pack)',
    },
  ],
  otherTradelineLabels: [
    'CAPITAL ONE',
    'AFFIRM INC',
    'WELLS FARGO CARD SERV',
    'BARCLAYS BANK DELAWARE',
    'EASTERNBK',
  ],
} as const;

export function isRooseveltCourtPartner(partner: Partner | null | undefined): boolean {
  if (!partner) return false;
  if (partner.id === ROOSEVELT_COURT_PARTNER_ID) return true;
  if (partner.importExternalId === ROOSEVELT_IMPORT_EXTERNAL_ID) return true;
  const name = String(partner.profile?.fullName || '').toLowerCase();
  return name.includes('roosevelt') && name.includes('corelus');
}

function fullToolkitKeys(): EntitlementKey[] {
  return [
    ...new Set<EntitlementKey>([
      ...SERVICE_ACCESS_BUNDLES.credit_restore,
      ...SERVICE_ACCESS_BUNDLES.debt,
      ENTITLEMENT_KEYS.disputes,
      ENTITLEMENT_KEYS.letters,
      ENTITLEMENT_KEYS.debt,
    ]),
  ];
}

async function ensureRooseveltDebtCase(partnerId: string): Promise<DebtCase> {
  const existing = listDebtByPartner(partnerId).find(
    (c) =>
      (c.notes || '').includes(ROOSEVELT_DEBT_CASE_MARKER) ||
      (c.type === 'summons' &&
        /midland/i.test(c.name) &&
        (c.hearingDate || '').slice(0, 10) === ROOSEVELT_HEARING_ISO),
  );
  if (existing) {
    return upsertDebt({
      ...existing,
      type: 'summons',
      name: existing.name || 'Midland Funding LLC',
      originalCreditor: existing.originalCreditor || 'Citibank, N.A.',
      amountCents: existing.amountCents || 109400,
      accountNumberMasked: existing.accountNumberMasked || '33435****',
      hearingDate: ROOSEVELT_HEARING_ISO,
      stateJurisdiction: existing.stateJurisdiction || 'MA',
      recipientName: existing.recipientName || ROOSEVELT_DISPLAY_NAME,
      recipientAddress: existing.recipientAddress || ROOSEVELT_REPORT_SUMMARY.currentAddress,
      // Hearing is decided — the matter is resolved into a monthly payment plan.
      status: 'resolved',
      notes: existing.notes?.includes(ROOSEVELT_COURT_OUTCOME_MARKER)
        ? existing.notes
        : `${ROOSEVELT_DEBT_CASE_MARKER}\n${ROOSEVELT_COURT_OUTCOME_MARKER}\n${ROOSEVELT_CASE_NOTE}`,
    });
  }

  const created = createDebtCase({
    partnerId,
    type: 'summons',
    name: ROOSEVELT_PLAINTIFF_NAME,
    amountCents: 109400,
    status: 'open',
    originalCreditor: ROOSEVELT_ORIGINAL_CREDITOR,
    collectorName: ROOSEVELT_PLAN_PAYEE_NAME,
    accountNumberMasked: '33435****',
    stateJurisdiction: 'MA',
    recipientName: ROOSEVELT_DISPLAY_NAME,
    recipientAddress: ROOSEVELT_REPORT_SUMMARY.currentAddress,
    notes: `${ROOSEVELT_DEBT_CASE_MARKER}\n${ROOSEVELT_COURT_OUTCOME_MARKER}\n${ROOSEVELT_CASE_NOTE}`,
    source: 'import',
  });
  return upsertDebt({ ...created, hearingDate: ROOSEVELT_HEARING_ISO, status: 'resolved' });
}

function ensureRooseveltReportPlaceholder(partnerId: string): CreditReportRecord {
  const existing = listReportsByPartner(partnerId).find(
    (r) =>
      (r.filename || '').toLowerCase() === ROOSEVELT_REPORT_FILENAME.toLowerCase() ||
      (r.rawBlobRef || '').includes(ROOSEVELT_REPORT_FILENAME),
  );
  if (existing) {
    if (!existing.parsed?.personalInfo?.fullName) {
      return upsertReport({
        ...existing,
        parsed: {
          provider: existing.parsed?.provider || 'unknown',
          tradelines: existing.parsed?.tradelines || [],
          sections: existing.parsed?.sections || [],
          ...existing.parsed,
          personalInfo: {
            ...(existing.parsed?.personalInfo || {}),
            fullName: ROOSEVELT_DISPLAY_NAME,
            addresses: [
              {
                raw: ROOSEVELT_REPORT_SUMMARY.currentAddress,
                line1: '30 Portland St',
                city: 'Haverhill',
                state: 'MA',
                zip: '01830',
                type: 'current',
              },
            ],
            employer: ROOSEVELT_REPORT_SUMMARY.employers[0],
          },
          scores: existing.parsed?.scores?.length
            ? existing.parsed.scores
            : [
                { bureau: 'TUC', value: 443, model: 'VantageScore' },
                { bureau: 'EXP', value: 447, model: 'VantageScore' },
                { bureau: 'EQF', value: 441, model: 'VantageScore' },
              ],
        },
      });
    }
    return existing;
  }

  const now = new Date().toISOString();
  const report: CreditReportRecord = {
    id: newId('rpt'),
    partnerId,
    provider: 'unknown',
    fileType: 'html',
    uploadedBy: 'admin',
    receivedAt: now,
    reportDate: ROOSEVELT_REPORT_SUMMARY.reportDate,
    filename: ROOSEVELT_REPORT_FILENAME,
    mimeType: 'text/html',
    sizeBytes: 0,
    rawBlobRef: `${LEGACY_PENDING_BLOB_PREFIX}${ROOSEVELT_REPORT_FILENAME}`,
    parsed: {
      provider: 'unknown',
      reportDate: ROOSEVELT_REPORT_SUMMARY.reportDate,
      tradelines: [
        {
          creditorName: 'MIDLANDCRE',
          originalCreditor: 'Citibank, N.A.',
          accountNumberMasked: '33435****',
          balance: 1094,
          highBalance: 1610,
          accountType: 'Collection',
          accountStatus: 'Derogatory',
          dateOpened: '2025-07-01',
          fields: [
            { label: 'Account Status', byBureau: { TUC: 'Derogatory', EXP: 'Derogatory', EQF: 'Derogatory' } },
            { label: 'Balance', byBureau: { TUC: '$1,094', EXP: '$1,094', EQF: '$1,094' } },
          ],
        },
      ],
      scores: [
        { bureau: 'TUC', value: 443, model: 'VantageScore' },
        { bureau: 'EXP', value: 447, model: 'VantageScore' },
        { bureau: 'EQF', value: 441, model: 'VantageScore' },
      ],
      sections: [],
      personalInfo: {
        fullName: ROOSEVELT_DISPLAY_NAME,
        addresses: [
          {
            raw: ROOSEVELT_REPORT_SUMMARY.currentAddress,
            line1: '30 Portland St',
            city: 'Haverhill',
            state: 'MA',
            zip: '01830',
            type: 'current',
          },
          {
            raw: ROOSEVELT_REPORT_SUMMARY.previousAddress,
            line1: '70 Boylston St Apt 2',
            city: 'Malden',
            state: 'MA',
            zip: '02148',
            type: 'previous',
          },
        ],
        employer: ROOSEVELT_REPORT_SUMMARY.employers[0],
      },
    },
  };
  return upsertReport(report);
}

export type RooseveltSeedResult = {
  partner: Partner;
  debt: DebtCase;
  report: CreditReportRecord;
  /** Post-hearing payment plan on file (pay $50/month for 24 months). */
  outcome: PartnerCourtOutcome;
  created: boolean;
  /** True when the partner row was written via admin-list-partners (Supabase list source). */
  persistedToAdminList: boolean;
  entitlementsOk: boolean;
  entitlementsError?: string;
};

async function resolveExistingRooseveltPartner(): Promise<Partner | null> {
  // Admin edge (service_role) first — same store as /admin/partners list.
  const byAdminId = await adminGetPartner(ROOSEVELT_COURT_PARTNER_ID);
  if (byAdminId) return byAdminId;

  try {
    const byImport = await findPartnerByImportExternalId({
      source: ROOSEVELT_IMPORT_SOURCE,
      externalId: ROOSEVELT_IMPORT_EXTERNAL_ID,
    });
    if (byImport) return byImport;
  } catch {
    /* RLS / network — fall through */
  }

  try {
    return await getPartner(ROOSEVELT_COURT_PARTNER_ID);
  } catch {
    return null;
  }
}

function buildRooseveltPartnerPayload(existing?: Partner | null): Partner {
  const createdAt = existing?.createdAt || nowIso();
  const updatedAt = nowIso();
  return {
    id: ROOSEVELT_COURT_PARTNER_ID,
    tenantId: existing?.tenantId || FINELY_TENANT_ID,
    status: existing?.status || 'active',
    profile: {
      ...(existing?.profile || {}),
      fullName: ROOSEVELT_DISPLAY_NAME,
      // Never invent a Finely-branded / @finely.local email for a person.
      // Keep a real email only if already provided; otherwise leave empty.
      email: existing?.profile?.email && !/@finely(\.local|cred\.local|cred\.com)$/i.test(existing.profile.email)
        ? existing.profile.email
        : undefined,
      phone: existing?.profile?.phone,
    },
    primaryRoute: existing?.primaryRoute || 'personal_restore',
    lane: 'debt_kill',
    journeyStage: existing?.journeyStage || 'letters',
    journeySignals: {
      ...(existing?.journeySignals || {}),
      ...rooseveltCourtJourneySignals(),
      // Keep progress the partner already logged.
      writtenOrderOnFile:
        existing?.journeySignals?.writtenOrderOnFile ?? false,
    },
    importSource: existing?.importSource || ROOSEVELT_IMPORT_SOURCE,
    importExternalId: existing?.importExternalId || ROOSEVELT_IMPORT_EXTERNAL_ID,
    claimedUserId: existing?.claimedUserId,
    claimedAt: existing?.claimedAt,
    routes: existing?.routes || {},
    consents: existing?.consents || {},
    assignedAgentId: existing?.assignedAgentId,
    notes: existing?.notes?.includes(ROOSEVELT_COURT_OUTCOME_MARKER)
      ? existing.notes
      : [existing?.notes?.trim(), `${ROOSEVELT_COURT_OUTCOME_MARKER}\n${ROOSEVELT_CASE_NOTE}`]
          .filter(Boolean)
          .join('\n\n'),
    createdAt,
    updatedAt,
  };
}

/**
 * Idempotent: creates/updates Roosevelt court partner in the **same Supabase store**
 * that Admin Partners reads (`admin-list-partners` service_role upsert).
 * Also seeds local Midland summons (hearing 2026-07-27) + report placeholder.
 * Never attaches the Jul 27 Midland matter to Yolie or other partners.
 */
export async function ensureRooseveltCourtPartnerAsync(): Promise<RooseveltSeedResult> {
  const existing = await resolveExistingRooseveltPartner();
  const created = !existing;
  const payload = buildRooseveltPartnerPayload(existing);

  // Always persist via admin edge upsert (same path as Import Partners / Create Partner asAdmin).
  // Plain client upsertPartner was silently failing RLS, so Roosevelt never appeared in the list.
  let partner: Partner;
  let persistedToAdminList = false;
  try {
    partner = await adminUpsertPartner(payload);
    persistedToAdminList = true;
  } catch (adminErr) {
    // Last resort: createPartner(asAdmin) — also routes to adminUpsertPartner.
    try {
      partner = await createPartner({
        id: ROOSEVELT_COURT_PARTNER_ID,
        tenantId: payload.tenantId,
        status: payload.status,
        fullName: ROOSEVELT_DISPLAY_NAME,
        email: payload.profile.email,
        phone: payload.profile.phone,
        primaryRoute: payload.primaryRoute,
        lane: payload.lane,
        journeyStage: payload.journeyStage,
        importSource: ROOSEVELT_IMPORT_SOURCE,
        importExternalId: ROOSEVELT_IMPORT_EXTERNAL_ID,
        asAdmin: true,
        journeySignals: payload.journeySignals,
        claimedUserId: payload.claimedUserId,
        claimedAt: payload.claimedAt,
        consents: payload.consents,
        assignedAgentId: payload.assignedAgentId,
      });
      persistedToAdminList = true;
    } catch {
      const msg = (adminErr as Error)?.message || 'Could not save Roosevelt to Supabase.';
      throw new Error(
        `${msg} Sign in as a full admin, then retry Ensure Roosevelt court. If this persists, check the admin-list-partners edge function / session.`,
      );
    }
  }

  // Force stable id + court markers even if edge returned a slightly different shape.
  if (partner.id !== ROOSEVELT_COURT_PARTNER_ID || !isRooseveltCourtPartner(partner)) {
    partner = await adminUpsertPartner({
      ...partner,
      id: ROOSEVELT_COURT_PARTNER_ID,
      profile: { ...partner.profile, fullName: ROOSEVELT_DISPLAY_NAME },
      importSource: ROOSEVELT_IMPORT_SOURCE,
      importExternalId: ROOSEVELT_IMPORT_EXTERNAL_ID,
      journeySignals: {
        ...(partner.journeySignals || {}),
        ...rooseveltCourtJourneySignals(),
      },
      notes: partner.notes?.includes(ROOSEVELT_COURT_OUTCOME_MARKER)
        ? partner.notes
        : `${ROOSEVELT_COURT_OUTCOME_MARKER}\n${ROOSEVELT_CASE_NOTE}`,
    });
    persistedToAdminList = true;
  }

  const ent = await ensurePartnerEntitlementsAsync({
    partnerId: partner.id,
    keys: fullToolkitKeys(),
    sourceAgreementId: 'admin_service_full_toolkit_roosevelt',
  });

  // Debt + report are local stores keyed by partner id — only Roosevelt’s id gets Midland/Jul 27.
  const debt = await ensureRooseveltDebtCase(partner.id);
  const report = ensureRooseveltReportPlaceholder(partner.id);
  const outcome = ensureRooseveltCourtOutcome(partner.id, debt.id);

  return {
    partner,
    debt,
    report,
    outcome,
    created,
    persistedToAdminList,
    entitlementsOk: ent.ok,
    entitlementsError: ent.pushError,
  };
}
