import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '../auth/admin';
import type { PartnerRoute, PartnerRouteIntake } from '../domain/partners';
import { createPartner, findPartnerByClaimedUserId, findPartnerByEmail, getPartner, upsertPartner } from '../data/partnersRepo';
import { ensurePartnerTrialEntitlements } from '../billing/entitlements';
import { ensureEnterpriseDefaultsOnce } from '../data/seedEnterpriseDefaults';
import { ensureVendorCatalogDefaultsOnce } from '../data/vendorsRepo';
import { pullBillingSnapshotFromSupabase } from '../data/billingSupabaseSync';
import { pullWorkflowSnapshotFromSupabase } from '../data/workflowSupabaseSync';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const ADMIN_PARTNER_OVERRIDE_KEY = 'finely.admin.asPartnerId.v1';

function readOnboardingDraft(): any {
  try {
    const raw = localStorage.getItem('finely.onboarding.v1');
    const parsed = raw ? (JSON.parse(raw) as any) : null;
    return parsed?.userData ?? {};
  } catch {
    return {};
  }
}

function applyOnboardingToIntake(intake: PartnerRouteIntake | undefined, patch: Partial<PartnerRouteIntake>): PartnerRouteIntake {
  const cur: any = intake ?? {};
  return {
    ...cur,
    ...patch,
    personal: { ...(cur.personal ?? {}), ...((patch as any).personal ?? {}) },
    business: { ...(cur.business ?? {}), ...((patch as any).business ?? {}) },
  } as any;
}

async function maybeHydrateExistingPartner(args: { partner: any; user: User | null }): Promise<any> {
  const p = args.partner;
  const meta: any = (args.user as any)?.user_metadata ?? {};
  const userData = readOnboardingDraft();

  const candidateName = (meta.name ?? userData.name ?? '').trim();
  const candidatePhone = (meta.phone ?? userData.phone ?? '').trim();
  const address1 = (meta.address1 ?? userData.address1 ?? '').trim();
  const address2 = (meta.address2 ?? userData.address2 ?? '').trim();
  const city = (meta.city ?? userData.city ?? '').trim();
  const state = (meta.state ?? userData.state ?? '').trim();
  const postalCode = (meta.postalCode ?? userData.postalCode ?? '').trim();

  let changed = false;
  const next: any = { ...p };

  const existingName = String(next?.profile?.fullName || '').trim();
  if (candidateName && (!existingName || existingName.toLowerCase() === 'partner')) {
    next.profile = { ...(next.profile ?? {}), fullName: candidateName };
    changed = true;
  }
  if (candidatePhone && !String(next?.profile?.phone || '').trim()) {
    next.profile = { ...(next.profile ?? {}), phone: candidatePhone };
    changed = true;
  }

  const route: PartnerRoute | undefined = (next.primaryRoute as any) || undefined;
  if (route && (route === 'personal_restore' || route === 'personal_build' || route === 'business_build')) {
    const curIntake = next.routes?.[route] as any;
    const patch: any = {};
    if (address1 || address2 || city || state || postalCode) {
      patch.personal = {
        ...(address1 ? { address1 } : {}),
        ...(address2 ? { address2 } : {}),
        ...(city ? { city } : {}),
        ...(state ? { state } : {}),
        ...(postalCode ? { postalCode } : {}),
      };
    }
    if (Object.keys(patch).length) {
      next.routes = { ...(next.routes ?? {}) };
      next.routes[route] = applyOnboardingToIntake(curIntake, patch);
      changed = true;
    }
  }

  if (changed) return upsertPartner(next);
  return p;
}

export async function getOrCreatePartnerForSession(args: { user: User | null }): Promise<any> {
  const userId = args.user?.id || '';
  if (userId) {
    const claimed = await findPartnerByClaimedUserId(userId);
    if (claimed) {
      ensureEnterpriseDefaultsOnce({ tenantId: (claimed as any)?.tenantId });
      ensureVendorCatalogDefaultsOnce({ tenantId: (claimed as any)?.tenantId });
      const hydrated = await maybeHydrateExistingPartner({ partner: claimed as any, user: args.user });
      queueMicrotask(() => {
        void pullBillingSnapshotFromSupabase({ partnerId: (hydrated as any)?.id }).catch(() => {});
        void pullWorkflowSnapshotFromSupabase({ partnerId: (hydrated as any)?.id }).catch(() => {});
      });
      return hydrated;
    }
  }

  const email = args.user?.email || '';
  if (!email) return null;
  if (isAdminEmail(email)) {
    const overrideId = (localStorage.getItem(ADMIN_PARTNER_OVERRIDE_KEY) || '').trim();
    if (overrideId) {
      const p = await getPartner(overrideId);
      if (p) return p;
    }
    return null;
  }

  const existing = await findPartnerByEmail(email);
  if (existing) {
    ensureEnterpriseDefaultsOnce({ tenantId: (existing as any)?.tenantId });
    ensureVendorCatalogDefaultsOnce({ tenantId: (existing as any)?.tenantId });
    const hydrated = await maybeHydrateExistingPartner({ partner: existing as any, user: args.user });
    queueMicrotask(() => {
      void pullBillingSnapshotFromSupabase({ partnerId: (hydrated as any)?.id }).catch(() => {});
      void pullWorkflowSnapshotFromSupabase({ partnerId: (hydrated as any)?.id }).catch(() => {});
    });
    return hydrated;
  }

  const meta: any = (args.user as any)?.user_metadata ?? {};
  const userData = readOnboardingDraft();

  const business = {
    businessName: meta.businessName ?? userData.businessName,
    entityState: meta.entityState ?? userData.entityState,
    einLast4: meta.einLast4 ?? userData.einLast4,
    naics: meta.naics ?? userData.naics,
  };

  const rawGoal = `${meta.goal || userData.goal || ''}`.toLowerCase();
  const laneRaw = `${meta.lane || userData.lane || ''}`.toLowerCase();
  if (laneRaw.includes('seller')) return null;
  const primaryRoute =
    rawGoal.includes('business') || laneRaw.includes('business')
      ? 'business_build'
      : rawGoal.includes('build')
        ? 'personal_build'
        : rawGoal
          ? 'personal_restore'
          : undefined;

  const lane =
    laneRaw.includes('seller')
      ? 'other'
      : laneRaw.includes('au')
      ? 'au_tradelines'
      : laneRaw.includes('primary')
        ? 'primary_tradeline'
        : laneRaw.includes('debt')
          ? 'debt_kill'
          : laneRaw.includes('affiliate')
            ? 'affiliate'
            : laneRaw.includes('agent')
              ? 'agent'
          : laneRaw.includes('business')
            ? 'business_credit'
            : rawGoal.includes('business')
              ? 'business_credit'
              : rawGoal.includes('funding')
                ? 'funding_readiness'
                : 'other';

  const intake: any = {
    goal: meta.goal || userData.goal,
    score: meta.score ?? userData.score,
    fundingTarget: meta.target ?? userData.target,
    fractures: meta.fractures ?? userData.fractures,
    liabilityTier: meta.liabilityTier ?? userData.liabilityTier,
    urgency: meta.urgency ?? userData.urgency,
  };
  const addr1 = (meta.address1 ?? userData.address1 ?? '').trim();
  const addr2 = (meta.address2 ?? userData.address2 ?? '').trim();
  const city = (meta.city ?? userData.city ?? '').trim();
  const state = (meta.state ?? userData.state ?? '').trim();
  const postalCode = (meta.postalCode ?? userData.postalCode ?? '').trim();
  if (addr1 || addr2 || city || state || postalCode) {
    intake.personal = {
      ...(addr1 ? { address1: addr1 } : {}),
      ...(addr2 ? { address2: addr2 } : {}),
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
      ...(postalCode ? { postalCode } : {}),
    };
  }
  if (primaryRoute === 'business_build') {
    intake.business = {
      businessName: business.businessName,
      entityState: business.entityState,
      einLast4: business.einLast4,
      naics: business.naics,
    };
  }

  const partner = await createPartner({
    id: isSupabaseConfigured && userId ? `partner_${userId}` : undefined,
    tenantId: meta.tenantId ?? userData.tenantId,
    fullName: meta.name || userData.name || 'Partner',
    email,
    phone: meta.phone ?? userData.phone,
    primaryRoute,
    lane,
    journeyStage: 'intake',
    journeySignals: {
      goal: meta.goal || userData.goal,
      score: meta.score ?? userData.score,
      fundingTarget: meta.target ?? userData.target,
      fractures: meta.fractures ?? userData.fractures,
      liabilityTier: meta.liabilityTier ?? userData.liabilityTier,
      urgency: meta.urgency ?? userData.urgency,
      selectedPackageId: meta.selectedPackageId ?? userData.selectedPackageId,
      selectedRail: meta.selectedRail ?? userData.selectedRail,
      businessName: business.businessName,
      entityState: business.entityState,
      einLast4: business.einLast4,
      naics: business.naics,
      phone: meta.phone ?? userData.phone,
      address1: meta.address1 ?? userData.address1,
      city: meta.city ?? userData.city,
      state: meta.state ?? userData.state,
      postalCode: meta.postalCode ?? userData.postalCode,
    },
    intake,
  });

  ensureEnterpriseDefaultsOnce({ tenantId: (partner as any)?.tenantId });
  ensureVendorCatalogDefaultsOnce({ tenantId: (partner as any)?.tenantId });
  try {
    ensurePartnerTrialEntitlements({ partnerId: partner.id, lane: partner.lane ?? 'other', trialDays: 30 });
  } catch {
    // best-effort only
  }

  queueMicrotask(() => {
    void pullBillingSnapshotFromSupabase({ partnerId: partner.id }).catch(() => {});
    void pullWorkflowSnapshotFromSupabase({ partnerId: partner.id }).catch(() => {});
  });

  return partner;
}
