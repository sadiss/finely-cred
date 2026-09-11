import type { StaffMember } from '../domain/staffMember';
import { shiftBlockMatches } from '../domain/staffMember';

/** Weekday public faces — community guide and desk lead first, weekend helper last. */
export const HAITIAN_WEEKDAY_FACE_IDS = [
  'staff-marie-claire-baptiste',
  'staff-jean-marc-toussaint',
  'staff-nadege-pierre',
  'staff-farah-jean-louis',
  'staff-patrick-saint-louis',
] as const;

/** Saturday / Sunday — Samuel owns the walkthrough phone/QR lane. */
export const HAITIAN_WEEKEND_FACE_IDS = [
  'staff-samuel-augustin',
  'staff-jean-marc-toussaint',
  'staff-marie-claire-baptiste',
] as const;

/**
 * Stable Haitian-desk face. Never hash a Wednesday night onto the weekend helper,
 * and never fall through to an English sales face.
 */
export function pickHaitianCompanionOnDuty(members: StaffMember[], date = new Date()): StaffMember | null {
  const byId = new Map(
    members.filter((staff) => staff.active && staff.department === 'haitian_community').map((staff) => [staff.id, staff]),
  );
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  const order = weekend ? HAITIAN_WEEKEND_FACE_IDS : [...HAITIAN_WEEKDAY_FACE_IDS, 'staff-samuel-augustin'];
  const ordered = order.map((id) => byId.get(id)).filter((staff): staff is StaffMember => Boolean(staff));
  const onShift = ordered.filter((staff) => staff.shiftBlocks.some((block) => shiftBlockMatches(block, date)));
  if (onShift[0]) return onShift[0];
  const fallbackId = weekend ? 'staff-samuel-augustin' : 'staff-jean-marc-toussaint';
  return byId.get(fallbackId) ?? ordered[0] ?? null;
}
