import { createInvite, listInvitesByPartner } from '../data/invitesRepo';
import type { InviteRecord } from '../domain/imports';

export function partnerSetupBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/partner-setup`;
  }
  return '/partner-setup';
}

export function partnerClaimBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/claim`;
  }
  return '/claim';
}

/** Prefer an active (unclaimed) invite; otherwise create a new setup link. */
export function getOrCreatePartnerSetupInvite(args: {
  partnerId: string;
  toEmail?: string;
  toPhone?: string;
}): InviteRecord {
  const existing = listInvitesByPartner(args.partnerId).find((i) => !i.claimedAt);
  if (existing) return existing;
  return createInvite({
    partnerId: args.partnerId,
    claimUrl: partnerSetupBaseUrl(),
    toEmail: args.toEmail,
    toPhone: args.toPhone,
  });
}

export function getOrCreatePartnerClaimInvite(args: {
  partnerId: string;
  toEmail?: string;
  toPhone?: string;
}): InviteRecord {
  const existing = listInvitesByPartner(args.partnerId).find((i) => !i.claimedAt);
  if (existing) return existing;
  return createInvite({
    partnerId: args.partnerId,
    claimUrl: partnerClaimBaseUrl(),
    toEmail: args.toEmail,
    toPhone: args.toPhone,
  });
}
