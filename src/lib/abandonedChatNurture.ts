/** Chat visitors who left an email but never booked — enroll in the generic follow-up. */
import { FINELY_TENANT_ID } from '../domain/tenants';
import { listLeadCaptures } from '../data/leadsRepo';
import { enrollLeadInNurtureSequence, listNurtureEnrollments } from './nurtureEngine';

const ABANDON_AFTER_MS = 2 * 60 * 60 * 1000;

export function enrollAbandonedChatLeads(limit = 25): number {
  const now = Date.now();
  const active = new Set(listNurtureEnrollments(400).filter((e) => e.status === 'active').map((e) => e.leadId));
  let enrolled = 0;

  for (const lead of listLeadCaptures()) {
    if (enrolled >= limit) break;
    if (lead.source !== 'chat') continue;
    if (!lead.email?.includes('@')) continue;
    if (!lead.consentToContact && !lead.consentEmailMarketing) continue;
    if (lead.offer === 'enlightenment_session' || lead.offer === 'consultation_booking') continue;
    const age = now - Date.parse(lead.createdAt);
    if (!Number.isFinite(age) || age < ABANDON_AFTER_MS) continue;
    if (active.has(lead.id)) continue;

    const row = enrollLeadInNurtureSequence({
      leadId: lead.id,
      sequenceId: 'seq_credit_funnel',
      tenantId: FINELY_TENANT_ID,
      context: {
        email: lead.email,
        fullName: lead.fullName,
        funnelPath: '/free-guide',
        source: 'abandoned_chat',
      },
    });
    if (row) enrolled += 1;
  }

  return enrolled;
}
