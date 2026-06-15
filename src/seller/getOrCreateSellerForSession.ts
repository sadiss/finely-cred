import type { User } from '@supabase/supabase-js';
import { createAuSeller, findAuSellerByClaimedUserId, findAuSellerByEmail } from '../data/auSellerRepo';

export function getOrCreateSellerForSession(args: { user: User | null }) {
  const userId = args.user?.id || '';
  if (userId) {
    const claimed = findAuSellerByClaimedUserId(userId);
    if (claimed) return claimed;
  }

  const email = args.user?.email || '';
  if (!email) return null;

  const existing = findAuSellerByEmail(email);
  if (existing) return existing;

  const meta: any = (args.user as any)?.user_metadata ?? {};
  const draftRaw = localStorage.getItem('finely.onboarding.v1');
  let draft: any = {};
  try {
    draft = draftRaw ? JSON.parse(draftRaw) : {};
  } catch {
    draft = {};
  }
  const userData = draft?.userData ?? {};
  const laneRaw = `${meta.lane || userData.lane || ''}`.toLowerCase();

  // Only auto-create sellers when the onboarding lane is explicitly seller.
  if (!laneRaw.includes('seller')) return null;

  const tenantId = meta.tenantId ?? userData.tenantId;

  return createAuSeller({
    tenantId,
    email,
    fullName: meta.name || userData.name,
    claimedUserId: userId || undefined,
  });
}

