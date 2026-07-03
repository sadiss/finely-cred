import { findStaff, staffFullName } from '../features/staffCommandCenter/staffRoster';
import { STAFF_SOCIAL_PRESENCE } from '../features/staffCommandCenter/staffSocialPresence';
import { getSocialSopById, type SocialSopTemplate } from '../domain/socialContentSop';
import { queueSocialPost, listScheduledPosts, type SocialScheduledPost } from '../data/socialHubRepo';
import { applySocialDisclosure, evaluateDisclosureReview } from './socialDisclosureLayer';
import { draftCaptionFromSop, reviewSocialCaptionCompliance } from './socialAutopilotEngine';

export const RECRUITING_STAFF_IDS = ['partner_recruiter', 'affiliate_wrangler', 'scout_supreme'] as const;

export const RECRUITING_SOP_IDS = [
  'sop-recruit-credit-specialist',
  'sop-recruit-affiliate-wrangler',
  'sop-recruit-scout-nurture',
] as const;

const RECRUITING_DAY_MAP: Record<number, string[]> = {
  1: ['sop-recruit-credit-specialist'],
  3: ['sop-recruit-affiliate-wrangler'],
  5: ['sop-recruit-scout-nurture'],
};

export function listRecruitingSopsForDay(dayOfWeek: number): SocialSopTemplate[] {
  const ids = RECRUITING_DAY_MAP[dayOfWeek] ?? [];
  return ids.map((id) => getSocialSopById(id)).filter(Boolean) as SocialSopTemplate[];
}

export function recruitingStaffForSop(sop: SocialSopTemplate): string | undefined {
  if (sop.assignedStaffId) return sop.assignedStaffId;
  const mission =
    sop.id.includes('affiliate') ? 'recruit' : sop.id.includes('scout') ? 'nurture' : 'recruit';
  return STAFF_SOCIAL_PRESENCE.find((p) => p.mission === mission && p.autopilotEligible)?.staffId;
}

export function draftRecruitingCaption(sop: SocialSopTemplate): string {
  const staffId = recruitingStaffForSop(sop);
  const staff = staffId ? findStaff(staffId) : null;
  const name = staff ? staffFullName(staff) : 'Finely Cred team';
  const base = draftCaptionFromSop(sop);
  return applySocialDisclosure(base, { staffId, staffName: name });
}

export type RecruitingAutopilotResult = {
  at: string;
  queued: SocialScheduledPost[];
  skipped: number;
  complianceBlocked: number;
};

export function processRecruitingAutopilotTick(opts?: { dryRun?: boolean; force?: boolean }): RecruitingAutopilotResult {
  const dryRun = opts?.dryRun ?? true;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const existingToday = listScheduledPosts().filter((p) => p.createdAt.slice(0, 10) === today);
  const sops = listRecruitingSopsForDay(now.getDay());
  const queued: SocialScheduledPost[] = [];
  let skipped = 0;
  let complianceBlocked = 0;

  for (const sop of sops) {
    if (existingToday.some((p) => p.sopTemplateId === sop.id)) {
      skipped += 1;
      continue;
    }
    const staffId = recruitingStaffForSop(sop);
    const caption = draftRecruitingCaption(sop);
    const compliance = reviewSocialCaptionCompliance(caption, sop);
    const disclosure = evaluateDisclosureReview({
      caption,
      assignedStaffId: staffId,
      complianceStatus: compliance.ok ? 'approved' : 'needs_review',
    });
    const needsReview = !compliance.ok || disclosure.needsReview || sop.approvalRequired;
    if (needsReview && sop.approvalRequired && !opts?.force) {
      complianceBlocked += 1;
      if (!dryRun) {
        const scheduledAt = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
        queued.push(
          queueSocialPost({
            caption,
            scheduledAt,
            platforms: sop.platforms,
            sopTemplateId: sop.id,
            assignedStaffId: staffId,
            complianceStatus: 'needs_review',
            posterType: disclosure.posterType,
          }),
        );
      }
      continue;
    }
    if (dryRun) {
      skipped += 1;
      continue;
    }
    const scheduledAt = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
    const post = queueSocialPost({
      caption,
      scheduledAt,
      platforms: sop.platforms,
      sopTemplateId: sop.id,
      assignedStaffId: staffId,
      complianceStatus: needsReview ? 'needs_review' : 'approved',
      posterType: disclosure.posterType,
    });
    queued.push(post);
  }

  return { at: now.toISOString(), queued, skipped, complianceBlocked };
}
