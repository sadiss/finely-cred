import type { CrmRecordKind, CrmRecordStage } from './crmRecords';
import type { LeadSource } from './leads';
import type { ProspectTarget } from './crmProspects';

export type CrmRoutingRuleMatch = {
  kind?: CrmRecordKind;
  target?: ProspectTarget;
  stage?: CrmRecordStage;
  source?: LeadSource;
  referralCode?: string;
  interestContains?: string;
  offer?: string;
};

export type CrmRoutingRuleAction = {
  moveStage?: CrmRecordStage;
  assignEmail?: string;
  addTags?: string[];
  createFollowUpTask?: boolean;
  note?: string;
};

export type CrmRoutingRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  when: CrmRoutingRuleMatch;
  then: CrmRoutingRuleAction;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}
