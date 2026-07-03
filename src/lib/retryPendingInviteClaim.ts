import type { Partner } from '../domain/partners';
import { claimPartnerForUser, findPartnerByClaimedUserId, getPartner } from '../data/partnersRepo';
import { completePartnerInviteClaim } from './partnerInviteBootstrap';
import { clearPendingInvitePartnerId, getPendingInvitePartnerId } from './pendingInviteClaim';

/** After email confirmation or first login, finish linking an admin invite if claim did not run at signup. */
export async function retryPendingInviteClaim(args: {
  userId: string;
  email: string;
}): Promise<Partner | null> {
  const pendingId = getPendingInvitePartnerId();
  if (!pendingId) return null;

  const email = args.email.trim();
  if (!email) return null;

  const existing = await findPartnerByClaimedUserId(args.userId);
  if (existing?.id === pendingId) {
    clearPendingInvitePartnerId();
    return existing;
  }

  const target = (await getPartner(pendingId)) ?? null;
  if (!target) {
    clearPendingInvitePartnerId();
    return null;
  }

  if (target.claimedUserId && target.claimedUserId !== args.userId) {
    clearPendingInvitePartnerId();
    return null;
  }

  const targetEmail = (target.profile.email || '').trim().toLowerCase();
  if (targetEmail && targetEmail !== email.trim().toLowerCase()) {
    return null;
  }

  try {
    const claimed = await completePartnerInviteClaim({
      partnerId: pendingId,
      userId: args.userId,
      email,
    });
    clearPendingInvitePartnerId();
    return claimed;
  } catch {
    const fallback = await claimPartnerForUser({
      partnerId: pendingId,
      userId: args.userId,
      email,
    });
    if (fallback) clearPendingInvitePartnerId();
    return fallback;
  }
}
