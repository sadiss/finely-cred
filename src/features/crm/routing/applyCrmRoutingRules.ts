import type { CrmRecord } from '../../../domain/crmRecords';
import type { CrmRoutingRule } from '../../../domain/crmRoutingRules';
import { listCrmRoutingRules } from '../../../data/crmRoutingRulesRepo';
import { getCrmRecord, setCrmRecordStage } from '../../../data/crmRecordsRepo';
import { patchProspect } from '../../../data/crmProspectsRepo';
import { getLeadOp, upsertLeadOp } from '../../../data/leadOpsRepo';
import { addLeadNote } from '../../../data/leadOpsRepo';
import { createTask } from '../../../data/tasksRepo';

function matchRule(record: CrmRecord, rule: CrmRoutingRule): boolean {
  const w = rule.when;
  if (w.kind && record.kind !== w.kind) return false;
  if (w.target && record.target !== w.target) return false;
  if (w.stage && record.stage !== w.stage) return false;
  if (w.source && record.source !== w.source) return false;
  if (w.referralCode === '*' && !record.attribution?.referralCode) return false;
  if (w.referralCode && w.referralCode !== '*' && record.attribution?.referralCode !== w.referralCode) return false;
  if (w.interestContains) {
    const hay = (record.packageInterest || record.attribution?.interest || '').toLowerCase();
    if (!hay.includes(w.interestContains.toLowerCase())) return false;
  }
  if (w.offer && record.attribution?.offer !== w.offer) return false;
  return true;
}

export function applyCrmRoutingRules(recordId: string): CrmRecord | null {
  const record = getCrmRecord(recordId);
  if (!record) return null;

  const rules = listCrmRoutingRules().filter((r) => r.enabled);
  for (const rule of rules) {
    if (!matchRule(record, rule)) continue;
    applyRuleActions(record, rule);
    return getCrmRecord(recordId);
  }
  return record;
}

function applyRuleActions(record: CrmRecord, rule: CrmRoutingRule) {
  const { then } = rule;

  if (then.moveStage) {
    setCrmRecordStage(record.id, then.moveStage);
  }

  if (record.sourceRef?.type === 'prospect' && (then.addTags?.length || then.assignEmail)) {
    patchProspect(record.sourceRef.id, {
      tags: then.addTags ? Array.from(new Set([...(record.tags ?? []), ...then.addTags])) : undefined,
      assignedTo: then.assignEmail ? { email: then.assignEmail } : undefined,
    });
  }

  if (record.sourceRef?.type === 'lead') {
    const leadId = record.sourceRef.id;
    const op = getLeadOp(leadId);
    const tags = then.addTags ? Array.from(new Set([...(op.tags ?? []), ...then.addTags])) : op.tags;
    upsertLeadOp({ ...op, tags });
    if (then.note) addLeadNote(leadId, `[Routing] ${then.note}`);
    else if (rule.name) addLeadNote(leadId, `[Routing] Applied rule: ${rule.name}`);
  }

  if (then.createFollowUpTask && record.partnerId) {
    createTask({
      partnerId: record.partnerId,
      title: `CRM routing follow-up — ${record.contact.fullName || record.contact.email || 'lead'}`,
      kind: 'follow_up',
      stage: 'intake',
      status: 'pending',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      assignedTo: 'admin',
      tags: ['crm-routing'],
    });
  }
}
