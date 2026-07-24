/**
 * Roosevelt Corelus — court / Midland–Citi hearing partner seed.
 * Stable import id so Admin can find him separately from Yolie (credit restore).
 * Hearing target: 2026-07-27. Educational self-help · not legal advice.
 */

import type { Partner } from '../domain/partners';
import type { DebtCase } from '../domain/debt';
import type { CreditReportRecord } from '../domain/creditReports';
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
      status: existing.status === 'resolved' ? existing.status : 'open',
      notes:
        existing.notes?.includes(ROOSEVELT_DEBT_CASE_MARKER)
          ? existing.notes
          : `${ROOSEVELT_DEBT_CASE_MARKER}\nMidland / Citi hearing matter. Educational self-help · not legal advice.`,
    });
  }

  const created = createDebtCase({
    partnerId,
    type: 'summons',
    name: 'Midland Funding LLC',
    amountCents: 109400,
    status: 'open',
    originalCreditor: 'Citibank, N.A.',
    collectorName: 'Midland Credit Management / Midland Funding',
    accountNumberMasked: '33435****',
    stateJurisdiction: 'MA',
    recipientName: ROOSEVELT_DISPLAY_NAME,
    recipientAddress: ROOSEVELT_REPORT_SUMMARY.currentAddress,
    notes: `${ROOSEVELT_DEBT_CASE_MARKER}\nMidland / Citi hearing matter · target hearing ${ROOSEVELT_HEARING_ISO}. Educational self-help · not legal advice.`,
    source: 'import',
  });
  return upsertDebt({ ...created, hearingDate: ROOSEVELT_HEARING_ISO });
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
      email: existing?.profile?.email || 'roosevelt.corelus.court@finely.local',
      phone: existing?.profile?.phone,
    },
    primaryRoute: existing?.primaryRoute || 'personal_restore',
    lane: 'debt_kill',
    journeyStage: existing?.journeyStage || 'letters',
    journeySignals: {
      ...(existing?.journeySignals || {}),
      courtMatter: 'midland_citi',
      hearingDate: ROOSEVELT_HEARING_ISO,
      defenseBookSubject: true,
      notYolie: true,
    },
    importSource: existing?.importSource || ROOSEVELT_IMPORT_SOURCE,
    importExternalId: existing?.importExternalId || ROOSEVELT_IMPORT_EXTERNAL_ID,
    claimedUserId: existing?.claimedUserId,
    claimedAt: existing?.claimedAt,
    routes: existing?.routes || {},
    consents: existing?.consents || {},
    assignedAgentId: existing?.assignedAgentId,
    notes: existing?.notes,
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
        courtMatter: 'midland_citi',
        hearingDate: ROOSEVELT_HEARING_ISO,
        defenseBookSubject: true,
        notYolie: true,
      },
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

  return {
    partner,
    debt,
    report,
    created,
    persistedToAdminList,
    entitlementsOk: ent.ok,
    entitlementsError: ent.pushError,
  };
}
