import { isAdminEmail } from './admin';
import { isDeveloperEmail } from './developer';

export type StaffTier = 'admin' | 'developer';

export function resolveStaffTier(email?: string | null): StaffTier | null {
  if (isAdminEmail(email)) return 'admin';
  if (isDeveloperEmail(email)) return 'developer';
  return null;
}

export function isStaffEmail(email?: string | null): boolean {
  return resolveStaffTier(email) != null;
}

/** Developer QA without full admin powers. */
export function isDeveloperQaOnly(email?: string | null): boolean {
  return isDeveloperEmail(email) && !isAdminEmail(email);
}
