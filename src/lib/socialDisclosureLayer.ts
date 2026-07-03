import { findStaff } from '../features/staffCommandCenter/staffRoster';
import { isHumanStaffKind } from '../features/staffCommandCenter/StaffKindBadge';
import { STAFF_SOCIAL_PRESENCE } from '../features/staffCommandCenter/staffSocialPresence';
import type { SocialScheduledPost } from '../data/socialHubRepo';

export type SocialPosterType = 'ai_agent' | 'human_executive';

const AI_DISCLOSURE =
  'AI assistant persona · Educational only · Not legal advice · Results vary.';
const HUMAN_DISCLOSURE = 'Human executive · Finely Cred team member.';

export function resolvePosterType(staffId?: string): SocialPosterType {
  if (!staffId) return 'ai_agent';
  const presence = STAFF_SOCIAL_PRESENCE.find((p) => p.staffId === staffId);
  if (presence?.canPostAsHuman) return 'human_executive';
  const staff = findStaff(staffId);
  if (staff && isHumanStaffKind(staff.kind)) return 'human_executive';
  return 'ai_agent';
}

export function applySocialDisclosure(
  caption: string,
  opts: { staffId?: string; staffName: string; posterType?: SocialPosterType },
): string {
  const posterType = opts.posterType ?? resolvePosterType(opts.staffId);
  const base = caption.trim();
  const hasAi = /ai assistant|educational only|results vary/i.test(base);
  const hasHuman = /human executive/i.test(base);
  if (posterType === 'human_executive') {
    if (hasHuman) return base;
    return `${base}\n\n— ${opts.staffName}\n${HUMAN_DISCLOSURE}`;
  }
  if (hasAi) return base;
  return `${base}\n\n— ${opts.staffName}, Finely Cred\n${AI_DISCLOSURE}`;
}

export function evaluateDisclosureReview(post: Pick<SocialScheduledPost, 'caption' | 'assignedStaffId' | 'complianceStatus'>): {
  needsReview: boolean;
  reasons: string[];
  posterType: SocialPosterType;
} {
  const reasons: string[] = [];
  const posterType = resolvePosterType(post.assignedStaffId);
  const presence = post.assignedStaffId
    ? STAFF_SOCIAL_PRESENCE.find((p) => p.staffId === post.assignedStaffId)
    : undefined;
  const lower = post.caption.toLowerCase();

  if (posterType === 'human_executive' && !/human executive/i.test(post.caption)) {
    reasons.push('Human executive post missing disclosure line.');
  }
  if (posterType === 'ai_agent' && !/ai assistant|educational only/i.test(post.caption)) {
    reasons.push('AI persona post missing educational/AI disclosure.');
  }
  if (presence?.disclosureRequired && post.complianceStatus !== 'approved') {
    reasons.push(`${presence.displayName} requires compliance review before publish.`);
  }
  if (/\bguaranteed\b|\bdelete everything\b|\b800 score\b/i.test(lower)) {
    reasons.push('Caption contains blocked guarantee language.');
  }

  return { needsReview: reasons.length > 0, reasons, posterType };
}

export function listPostsNeedingDisclosureReview(posts: SocialScheduledPost[]): SocialScheduledPost[] {
  return posts.filter((p) => {
    if (p.complianceStatus === 'blocked') return false;
    if (p.status === 'published') return false;
    const review = evaluateDisclosureReview(p);
    return review.needsReview || p.complianceStatus === 'needs_review';
  });
}
