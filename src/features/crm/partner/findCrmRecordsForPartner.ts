import { listCrmRecords } from '../../../data/crmRecordsRepo';
import type { CrmRecord } from '../../../domain/crmRecords';

/** Match CRM records linked to a partner by id, email, or conversion tag. */
export function findCrmRecordsForPartner(args: { partnerId: string; email?: string }): CrmRecord[] {
  const email = args.email?.trim().toLowerCase();
  const tagNeedle = `partner:${args.partnerId}`;
  return listCrmRecords().filter((r) => {
    if (r.partnerId === args.partnerId) return true;
    if (r.tags?.some((t) => t === tagNeedle || t.includes(tagNeedle))) return true;
    if (email && r.contact.email?.trim().toLowerCase() === email) return true;
    return false;
  });
}
