import type { ProspectTarget, ProspectStage } from '../../domain/crmProspects';
import type { LeadStage } from '../../domain/leadOps';
import type { CrmRecordKind, CrmRecordStage } from '../../domain/crmRecords';

export type CrmPipelineDef = {
  id: string;
  target: ProspectTarget;
  label: string;
  kindFilter?: CrmRecordKind[];
  stages: Array<{ id: CrmRecordStage; label: string; color: string }>;
};

const PROSPECT_STAGES: CrmPipelineDef['stages'] = [
  { id: 'new', label: 'New', color: 'slate' },
  { id: 'researching', label: 'Researching', color: 'blue' },
  { id: 'contact_ready', label: 'Contact ready', color: 'cyan' },
  { id: 'outreach_sent', label: 'Outreach sent', color: 'violet' },
  { id: 'replied', label: 'Replied', color: 'amber' },
  { id: 'booked', label: 'Booked', color: 'emerald' },
  { id: 'converted', label: 'Converted', color: 'green' },
  { id: 'disqualified', label: 'Disqualified', color: 'rose' },
];

const LEAD_STAGES: CrmPipelineDef['stages'] = [
  { id: 'new', label: 'New', color: 'slate' },
  { id: 'contacted', label: 'Contacted', color: 'blue' },
  { id: 'booked', label: 'Booked', color: 'emerald' },
  { id: 'converted', label: 'Converted', color: 'green' },
  { id: 'disqualified', label: 'Disqualified', color: 'rose' },
];

export const CRM_PIPELINES: CrmPipelineDef[] = [
  { id: 'clients', target: 'clients', label: 'Clients', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'affiliates', target: 'affiliates', label: 'Affiliates', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'agents', target: 'agents', label: 'Credit specialists', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'teams', target: 'teams', label: 'Teams', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'au_sellers', target: 'au_sellers', label: 'AU sellers', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'b2b_partners', target: 'b2b_partners', label: 'B2B partners', kindFilter: ['prospect', 'inbound_lead'], stages: PROSPECT_STAGES },
  { id: 'inbound', target: 'clients', label: 'Inbound leads', kindFilter: ['inbound_lead'], stages: LEAD_STAGES },
];

export function getPipelineById(id: string): CrmPipelineDef | null {
  return CRM_PIPELINES.find((p) => p.id === id) ?? null;
}

export function stageLabelForPipeline(pipelineId: string, stage: CrmRecordStage): string {
  const pipe = getPipelineById(pipelineId);
  return pipe?.stages.find((s) => s.id === stage)?.label ?? String(stage);
}

export function isProspectStage(stage: CrmRecordStage): stage is ProspectStage {
  return ['new', 'researching', 'contact_ready', 'outreach_sent', 'replied', 'booked', 'converted', 'disqualified'].includes(stage);
}

export function isLeadStage(stage: CrmRecordStage): stage is LeadStage {
  return ['new', 'contacted', 'booked', 'converted', 'disqualified'].includes(stage);
}
