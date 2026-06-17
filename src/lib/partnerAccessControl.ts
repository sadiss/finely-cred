import type { Partner } from '../domain/partners';
import { hasEntitlement } from '../data/billingRepo';

export type PartnerAccessFlags = {
  accessApproved: boolean;
  roleUnlocked: boolean;
  paymentWaived: boolean;
};

export function readPartnerAccessFlags(partner: Partner | null | undefined): PartnerAccessFlags {
  const sig = (partner?.journeySignals ?? {}) as Record<string, unknown>;
  const status = partner?.status ?? 'lead';
  return {
    accessApproved: sig.accessApproved === true || status === 'active',
    roleUnlocked: sig.roleUnlocked === true || status === 'active',
    paymentWaived: sig.paymentWaived === true,
  };
}

export function partnerAccessBlocked(partner: Partner | null | undefined): { blocked: boolean; reason?: string } {
  if (!partner) return { blocked: false };
  const flags = readPartnerAccessFlags(partner);
  if (partner.status === 'paused') {
    return { blocked: true, reason: 'Your account is paused. Contact support or wait for admin approval.' };
  }
  if (!flags.accessApproved && partner.status === 'lead') {
    return { blocked: true, reason: 'Your account is pending admin approval. We will email you when access is unlocked.' };
  }
  return { blocked: false };
}

export function partnerCanUsePortalModule(args: {
  partner: Partner;
  entitlementKey: string;
}): boolean {
  const flags = readPartnerAccessFlags(args.partner);
  if (!flags.roleUnlocked && args.partner.status === 'lead') return false;
  if (flags.paymentWaived) return true;
  return hasEntitlement(args.partner.id, args.entitlementKey);
}

export function patchPartnerAccessFlags(
  partner: Partner,
  patch: Partial<PartnerAccessFlags>,
): Partner {
  const cur = readPartnerAccessFlags(partner);
  const next = { ...cur, ...patch };
  let status = partner.status;
  if (next.accessApproved && status === 'lead') status = 'active';
  return {
    ...partner,
    status,
    journeySignals: {
      ...(partner.journeySignals ?? {}),
      accessApproved: next.accessApproved,
      roleUnlocked: next.roleUnlocked,
      paymentWaived: next.paymentWaived,
      accessUpdatedAt: new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };
}
