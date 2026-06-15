import type { StaffMember } from '../domain/staffMember';
import {
  STAFF_PORTRAIT_CATALOG,
  portraitFolderForGender,
  randomUserPortraitUrl,
} from '../data/staffPortraitCatalog';

export type PortraitGender = StaffMember['portraitGender'];

const LEGACY_SHARED_AVATARS = new Set([
  'morgan-advisor.png',
  'taylor-coach.png',
  'marcus-strategist.png',
  'avery-concierge.png',
  'jamie-brand.png',
  'jordan-support.png',
  'sam-coordinator.png',
  'riley-advisor.png',
  'alex-coach.png',
  'casey-debt.png',
]);

/** Ambiguous first names → explicit presentation gender for portrait selection. */
const NAME_GENDER_HINT: Record<string, PortraitGender> = {
  taylor: 'feminine',
  casey: 'masculine',
  jordan: 'masculine',
  sam: 'masculine',
  riley: 'feminine',
  alex: 'masculine',
  jamie: 'feminine',
  kai: 'masculine',
};

export function effectivePortraitGender(
  staff: Pick<StaffMember, 'firstName' | 'portraitGender'>,
): PortraitGender {
  if (staff.portraitGender && staff.portraitGender !== 'neutral') return staff.portraitGender;
  const hint = NAME_GENDER_HINT[staff.firstName.trim().toLowerCase()];
  return hint ?? staff.portraitGender ?? 'neutral';
}

export function staffPortraitStaticPath(staffId: string): string {
  return `/staff-portraits/${staffId}.jpg`;
}

export function hasStaffPhotoCatalogEntry(staffId: string): boolean {
  return Boolean(STAFF_PORTRAIT_CATALOG[staffId]);
}

export function isLegacySharedStaffAvatar(avatarPath: string): boolean {
  const file = avatarPath.split('/').pop()?.split('?')[0] ?? '';
  return LEGACY_SHARED_AVATARS.has(file);
}

function isResolvableCustomAvatar(avatarPath: string): boolean {
  const custom = avatarPath.trim();
  if (!custom || custom.startsWith('staff-portrait://')) return false;
  if (isLegacySharedStaffAvatar(custom)) return false;
  if (custom.endsWith('.svg')) return false;
  return true;
}

/** Real-person headshot — touched-up stock photo per roster member. */
export function resolveStaffPortraitUrl(
  staff: Pick<StaffMember, 'id' | 'firstName' | 'lastName' | 'portraitGender' | 'avatarPath'>,
): string {
  const custom = staff.avatarPath?.trim();
  if (custom && isResolvableCustomAvatar(custom)) return custom;

  if (hasStaffPhotoCatalogEntry(staff.id)) {
    return staffPortraitStaticPath(staff.id) + '?v=photo5';
  }

  return staffPortraitStaticPath(staff.id) + '?v=photo5';
}

/** CSS class for runtime polish on photo portraits (pairs with build-time touch-up). */
export const STAFF_PORTRAIT_PHOTO_CLASS =
  'staff-portrait-photo object-cover object-[center_18%] contrast-[1.03] saturate-[0.96]';

/** Remote fallback if local JPG missing (dev before generate script). */
export function resolveStaffPortraitFallbackUrl(
  staff: Pick<StaffMember, 'id' | 'firstName' | 'lastName' | 'portraitGender'>,
): string | null {
  const src = STAFF_PORTRAIT_CATALOG[staff.id];
  if (!src) return null;
  const folder = portraitFolderForGender(effectivePortraitGender(staff));
  return randomUserPortraitUrl(folder, src.portraitIndex);
}

/** @deprecated Use resolveStaffPortraitFallbackUrl — kept for avatar onError handlers */
export function resolveStaffPortraitDataUrl(
  staff: Pick<StaffMember, 'id' | 'firstName' | 'lastName' | 'portraitGender' | 'avatarPath'>,
): string {
  return resolveStaffPortraitFallbackUrl(staff) ?? resolveStaffPortraitUrl(staff);
}
