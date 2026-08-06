import { getSecuritySettings, loadSettings, updateSecuritySettings } from '../data/settingsRepo';
import type { SensitiveActionCodes } from '../domain/settings';

export type SensitiveActionKey = 'partner_delete' | 'hos_access_grant' | 'partner_access_grant' | 'bulk_report_purge';

const LABELS: Record<SensitiveActionKey, string> = {
  partner_delete: 'Delete partner file (all reports, letters, evidence)',
  hos_access_grant: 'Grant Head of Society access keys',
  partner_access_grant: 'Grant partner portal module access',
  bulk_report_purge: 'Bulk purge / re-import credit reports',
};

const CODE_FIELD: Record<SensitiveActionKey, keyof SensitiveActionCodes> = {
  partner_delete: 'partnerDelete',
  hos_access_grant: 'hosAccessGrant',
  partner_access_grant: 'partnerAccessGrant',
  bulk_report_purge: 'bulkReportPurge',
};

export function sensitiveActionLabel(key: SensitiveActionKey): string {
  return LABELS[key];
}

export function getSensitiveActionCodes(): SensitiveActionCodes {
  return getSecuritySettings().sensitiveActionCodes ?? {};
}

export function setSensitiveActionCode(key: SensitiveActionKey, code: string): void {
  const trimmed = code.trim();
  const cur = getSensitiveActionCodes();
  updateSecuritySettings({
    sensitiveActionCodes: {
      ...cur,
      [CODE_FIELD[key]]: trimmed,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function verifySensitiveActionCode(key: SensitiveActionKey, attempt: string): boolean {
  const expected = String(getSensitiveActionCodes()[CODE_FIELD[key]] ?? '').trim();
  if (!expected) return false;
  return expected === attempt.trim();
}

export function hasSensitiveActionCode(key: SensitiveActionKey): boolean {
  return Boolean(String(getSensitiveActionCodes()[CODE_FIELD[key]] ?? '').trim());
}
