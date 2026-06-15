import type { ProspectTarget, ProspectStage, ProspectSource, ProspectTouch } from './crmProspects';
import type { LeadSource, LeadOffer, LeadCapture } from './leads';
import type { LeadStage } from './leadOps';

export type CrmRecordKind = 'prospect' | 'inbound_lead' | 'client';

export type CrmRecordStage =
  | ProspectStage
  | LeadStage
  | 'active_client'
  | 'won'
  | 'lost';

export type CrmTimelineEntry = {
  id: string;
  kind: string;
  label: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export type CrmRecordContact = {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
};

export type CrmWorkIdleSignals = {
  partnerId?: string;
  /** Days since last task activity on linked Work OS project */
  idleDays: number;
  slaBreachCount: number;
  /** Combined CRM idle + Work SLA risk */
  riskLevel: 'low' | 'medium' | 'high';
};

export type CrmRecord = {
  id: string;
  kind: CrmRecordKind;
  target: ProspectTarget;
  stage: CrmRecordStage;
  source: ProspectSource | LeadSource | 'partner';
  score?: number;
  tags: string[];
  contact: CrmRecordContact;
  partnerId?: string;
  projectIds?: string[];
  packageInterest?: string;
  dealValueCents?: number;
  assignedTo?: { userId?: string; email?: string };
  nextAction?: { label: string; dueAt?: string };
  attribution?: Partial<LeadCapture>;
  categoryIds?: string[];
  timeline: CrmTimelineEntry[];
  createdAt: string;
  updatedAt: string;
  /** Work OS idle / SLA signals synced at read time */
  workSignals?: CrmWorkIdleSignals;
  /** Link back to source entity */
  sourceRef?: { type: 'prospect' | 'lead' | 'partner'; id: string };
};

export function nowIso() {
  return new Date().toISOString();
}

export function crmRecordDisplayName(record: CrmRecord): string {
  return record.contact.fullName?.trim() || record.contact.email?.trim() || record.contact.company?.trim() || 'Unnamed record';
}

export function isClosedStage(stage: CrmRecordStage): boolean {
  return stage === 'converted' || stage === 'disqualified' || stage === 'won' || stage === 'lost' || stage === 'active_client';
}
