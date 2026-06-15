import type { CrmRecord } from '../../../domain/crmRecords';
import { isClosedStage } from '../../../domain/crmRecords';

export type CrmSmartList = {
  id: string;
  label: string;
  description: string;
  filter: (record: CrmRecord) => boolean;
};

const MS_48H = 48 * 3600000;
const MS_7D = 7 * 86400000;

export const CRM_SMART_LISTS: CrmSmartList[] = [
  {
    id: 'all_open',
    label: 'All open',
    description: 'Every non-closed record',
    filter: (r) => !isClosedStage(r.stage),
  },
  {
    id: 'hot_no_touch_48h',
    label: 'Hot — no touch 48h',
    description: 'Score ≥ 60 and idle 48+ hours',
    filter: (r) => {
      if (isClosedStage(r.stage)) return false;
      const score = r.score ?? 0;
      const idle = Date.now() - Date.parse(r.updatedAt) > MS_48H;
      return score >= 60 && idle;
    },
  },
  {
    id: 'new_inbound',
    label: 'New inbound',
    description: 'Fresh leads in new stage',
    filter: (r) => r.kind === 'inbound_lead' && r.stage === 'new',
  },
  {
    id: 'due_followup',
    label: 'Follow-up due',
    description: 'Next action due within 7 days or overdue',
    filter: (r) => {
      if (isClosedStage(r.stage)) return false;
      const due = r.nextAction?.dueAt ? Date.parse(r.nextAction.dueAt) : NaN;
      if (!Number.isFinite(due)) return false;
      return due <= Date.now() + MS_7D;
    },
  },
  {
    id: 'high_value',
    label: 'High value deals',
    description: 'Expected deal value ≥ $500',
    filter: (r) => !isClosedStage(r.stage) && (r.dealValueCents ?? 0) >= 50000,
  },
  {
    id: 'affiliate_attributed',
    label: 'Affiliate attributed',
    description: 'Records with referral / promo attribution',
    filter: (r) => Boolean(r.attribution?.referralCode || r.attribution?.promoterRole),
  },
  {
    id: 'work_at_risk',
    label: 'Work at risk',
    description: 'Linked Work OS project idle or SLA breach',
    filter: (r) => !isClosedStage(r.stage) && (r.workSignals?.riskLevel === 'high' || r.workSignals?.riskLevel === 'medium'),
  },
  {
    id: 'lead_intel_imports',
    label: 'Lead intel imports',
    description: 'Prospects saved from Lead Intelligence Agent',
    filter: (r) => (r.tags ?? []).includes('lead-intel'),
  },
];

export function applyCrmSmartList(records: CrmRecord[], listId: string | 'all'): CrmRecord[] {
  if (listId === 'all') return records;
  const list = CRM_SMART_LISTS.find((l) => l.id === listId);
  if (!list) return records;
  return records.filter(list.filter);
}

export function getCrmSmartListById(id: string): CrmSmartList | null {
  return CRM_SMART_LISTS.find((l) => l.id === id) ?? null;
}
