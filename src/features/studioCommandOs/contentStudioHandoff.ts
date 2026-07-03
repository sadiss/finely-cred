import type { ContentStudioIntake } from './types';
import type { StaffMember } from '../staffCommandCenter/types';

const CREATIVE_STAFF_IDS = new Set(['goldframe', 'shorts_factory', 'content_director', 'hook_mutator', 'cmo_prime']);

export function isCreativeStaffId(id: string): boolean {
  return CREATIVE_STAFF_IDS.has(id);
}

export function intakeFromStaff(staff: Pick<StaffMember, 'id' | 'title' | 'tagline' | 'departmentId'>, extra?: Partial<ContentStudioIntake>): ContentStudioIntake {
  const isShortForm = staff.id === 'shorts_factory' || staff.id === 'hook_mutator';
  return {
    prompt:
      extra?.prompt ??
      `${staff.title} request: ${staff.tagline} Build ${isShortForm ? 'short-form video hooks, captions, and a 28s reel plan' : 'premium creative assets with a clear CTA'} for Finely Cred.`,
    sourceSurface: 'cmo_campaign',
    requestedAssetType: isShortForm ? 'social_clip' : 'video',
    audience: extra?.audience ?? 'business owners and credit-focused consumers',
    offer: extra?.offer ?? 'Finely Cred Content Studio',
    publishTarget: isShortForm ? 'social_clip' : 'resources',
    durationSec: isShortForm ? 28 : 60,
    aspect: isShortForm ? '9:16' : '16:9',
    brandPreset: staff.id === 'goldframe' ? 'premium_gold' : 'finely_dark',
    complianceStrict: true,
    ownerStaffId: staff.id,
    ...extra,
  };
}

export function contentStudioUrlForStaff(staffId: string, room: 'intake' | 'video' | 'script' = 'video'): string {
  const params = new URLSearchParams({ room, staff: staffId });
  return `/admin/content-studio?${params.toString()}`;
}

export { contentStudioUrlForCourseLesson, intakeFromCourseLesson } from '../educationStudio/courseVideoBridge';
export { contentStudioUrlForTour, intakeFromTour } from './tourVideoBridge';
