/** Honor marketing opt-out across local lead records (Phase 12). */
import { listLeadCaptures, patchLeadCapture } from '../data/leadsRepo';
import { recordSecurityAudit } from './securityAuditBridge';

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

export type MarketingUnsubscribeResult = {
  ok: boolean;
  email: string;
  updatedCount: number;
  message: string;
};

export function unsubscribeMarketingByEmail(email: string): MarketingUnsubscribeResult {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, email: normalized, updatedCount: 0, message: 'Enter a valid email address.' };
  }

  let updatedCount = 0;
  for (const lead of listLeadCaptures()) {
    if (normalizeEmail(lead.email) !== normalized) continue;
    if (!lead.consentEmailMarketing && !lead.consentSmsMarketing) continue;
    patchLeadCapture(lead.id, { consentEmailMarketing: false, consentSmsMarketing: false });
    updatedCount += 1;
  }

  try {
    recordSecurityAudit({
      action: 'marketing_unsubscribe',
      entityType: 'lead',
      meta: { email: normalized, leadsUpdated: updatedCount },
    });
  } catch {
    // non-blocking
  }

  return {
    ok: true,
    email: normalized,
    updatedCount,
    message:
      updatedCount > 0
        ? 'You are unsubscribed from marketing email and SMS for this address.'
        : 'No active marketing subscriptions found — you will not receive promotional messages from this device record.',
  };
}
