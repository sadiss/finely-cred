/**
 * Max Jr Ralph Jean-Baptiste — credit-restore client seed.
 * Stable import id so Admin Partners refresh always finds him after deploy.
 * Email is added later by admin (never invent @finely.local addresses).
 */

import type { Partner } from '../domain/partners';
import { nowIso } from '../domain/partners';
import { FINELY_TENANT_ID } from '../domain/tenants';
import {
  adminGetPartner,
  adminUpsertPartner,
  createPartner,
  findPartnerByImportExternalId,
  getPartner,
} from './partnersRepo';

/** Stable browser/local + Supabase-friendly id (deterministic UUID). */
export const MAX_JEAN_BAPTISTE_PARTNER_ID = 'c7d4a291-5e83-4b6f-9a2c-1f8e6d3b7045';

export const MAX_JEAN_BAPTISTE_IMPORT_SOURCE = 'manual' as const;
export const MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID = 'finely:max-jr-ralph-jean-baptiste-v1';

export const MAX_JEAN_BAPTISTE_DISPLAY_NAME = 'Max Jr Ralph Jean-Baptiste';

export type MaxJeanBaptisteSeedResult = {
  partner: Partner;
  created: boolean;
  persistedToAdminList: boolean;
};

export function isMaxJeanBaptistePartner(partner: Partner | null | undefined): boolean {
  if (!partner) return false;
  if (partner.id === MAX_JEAN_BAPTISTE_PARTNER_ID) return true;
  return partner.importExternalId === MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID;
}

async function resolveExistingMaxJeanBaptistePartner(): Promise<Partner | null> {
  const byId = (await getPartner(MAX_JEAN_BAPTISTE_PARTNER_ID)) ?? (await adminGetPartner(MAX_JEAN_BAPTISTE_PARTNER_ID));
  if (byId) return byId;
  return findPartnerByImportExternalId({
    source: MAX_JEAN_BAPTISTE_IMPORT_SOURCE,
    externalId: MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID,
  });
}

function buildMaxJeanBaptistePartnerPayload(existing: Partner | null): Partner {
  const createdAt = existing?.createdAt || nowIso();
  const updatedAt = nowIso();
  return {
    id: MAX_JEAN_BAPTISTE_PARTNER_ID,
    tenantId: existing?.tenantId || FINELY_TENANT_ID,
    status: existing?.status || 'active',
    profile: {
      ...(existing?.profile || {}),
      fullName: MAX_JEAN_BAPTISTE_DISPLAY_NAME,
      email: existing?.profile?.email,
      phone: existing?.profile?.phone,
    },
    primaryRoute: existing?.primaryRoute || 'personal_restore',
    lane: existing?.lane || 'funding_readiness',
    journeyStage: existing?.journeyStage || 'intake',
    journeySignals: {
      ...(existing?.journeySignals || {}),
      clientSeed: 'max-jr-ralph-jean-baptiste-v1',
    },
    importSource: existing?.importSource || MAX_JEAN_BAPTISTE_IMPORT_SOURCE,
    importExternalId: existing?.importExternalId || MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID,
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
 * Idempotent: creates/updates Max in the same Supabase store Admin Partners reads.
 * Safe to call on every admin directory refresh — email can be patched later.
 */
export async function ensureMaxJeanBaptistePartnerAsync(): Promise<MaxJeanBaptisteSeedResult> {
  const existing = await resolveExistingMaxJeanBaptistePartner();
  const created = !existing;
  const payload = buildMaxJeanBaptistePartnerPayload(existing);

  let partner: Partner;
  let persistedToAdminList = false;
  try {
    partner = await adminUpsertPartner(payload);
    persistedToAdminList = true;
  } catch (adminErr) {
    try {
      partner = await createPartner({
        id: MAX_JEAN_BAPTISTE_PARTNER_ID,
        tenantId: payload.tenantId,
        status: payload.status,
        fullName: MAX_JEAN_BAPTISTE_DISPLAY_NAME,
        email: payload.profile.email,
        phone: payload.profile.phone,
        primaryRoute: payload.primaryRoute,
        lane: payload.lane,
        journeyStage: payload.journeyStage,
        importSource: MAX_JEAN_BAPTISTE_IMPORT_SOURCE,
        importExternalId: MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID,
        asAdmin: true,
        journeySignals: payload.journeySignals,
        claimedUserId: payload.claimedUserId,
        claimedAt: payload.claimedAt,
        consents: payload.consents,
        assignedAgentId: payload.assignedAgentId,
      });
      persistedToAdminList = true;
    } catch {
      const msg = (adminErr as Error)?.message || 'Could not save Max Jean-Baptiste to Supabase.';
      throw new Error(`${msg} Sign in as admin, then refresh Partners.`);
    }
  }

  if (partner.id !== MAX_JEAN_BAPTISTE_PARTNER_ID || !isMaxJeanBaptistePartner(partner)) {
    partner = await adminUpsertPartner({
      ...partner,
      id: MAX_JEAN_BAPTISTE_PARTNER_ID,
      profile: { ...partner.profile, fullName: MAX_JEAN_BAPTISTE_DISPLAY_NAME },
      importSource: MAX_JEAN_BAPTISTE_IMPORT_SOURCE,
      importExternalId: MAX_JEAN_BAPTISTE_IMPORT_EXTERNAL_ID,
      lane: partner.lane || 'funding_readiness',
      primaryRoute: partner.primaryRoute || 'personal_restore',
      journeyStage: partner.journeyStage || 'intake',
    });
    persistedToAdminList = true;
  }

  return { partner, created, persistedToAdminList };
}
