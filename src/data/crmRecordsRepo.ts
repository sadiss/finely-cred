import type { Prospect } from '../domain/crmProspects';
import type { LeadCapture } from '../domain/leads';
import type { LeadOp } from '../domain/leadOps';
import type { CrmRecord, CrmRecordKind, CrmRecordStage, CrmTimelineEntry } from '../domain/crmRecords';
import { listProspects, setProspectStage, getProspect, patchProspect, logProspectWorkBridge } from './crmProspectsRepo';
import { listLeadCaptures, createLeadCapture, patchLeadCapture } from './leadsRepo';
import { getLeadOp, setLeadStage, linkLeadToPartner, addLeadNote, upsertLeadOp } from './leadOpsRepo';
import { createPartner, findPartnerByEmail } from './partnersRepo';
import { createTask } from './tasksRepo';
import { addProjectNote } from './projectsRepo';
import { instantiateServiceBundle } from '../features/work/playbooks/instantiateServiceBundle';
import { getPackageById } from '../config/pricingCatalog';
import type { ProspectTarget } from '../domain/crmProspects';
import type { LeadSource } from '../domain/leads';
import { enrichCrmRecordWithWorkSignals } from '../features/crm/sync/workIdleSignals';
import { emitCrmStageChanged } from '../lib/crmLifecycleBridge';
import { applyCrmRoutingRules } from '../features/crm/routing/applyCrmRoutingRules';
import { autoEnrollCrmRecordInDefaultSequence } from '../features/crm/sequences/autoEnrollCrmRecord';
import { runLeadCapturePipeline } from '../lib/leadCapturePipeline';

const DEAL_VALUE_TAG_PREFIX = 'deal_value_cents:';

export function dealValueFromTags(tags: string[] | undefined): number | undefined {
  const tag = (tags ?? []).find((t) => t.startsWith(DEAL_VALUE_TAG_PREFIX));
  if (!tag) return undefined;
  const n = parseInt(tag.slice(DEAL_VALUE_TAG_PREFIX.length), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function withDealValueTag(tags: string[], cents: number): string[] {
  const next = (tags ?? []).filter((t) => !t.startsWith(DEAL_VALUE_TAG_PREFIX));
  if (cents > 0) next.push(`${DEAL_VALUE_TAG_PREFIX}${Math.round(cents)}`);
  return next;
}

function prospectToRecord(p: Prospect): CrmRecord {
  const timeline: CrmTimelineEntry[] = (p.touches ?? []).map((t) => ({
    id: t.id,
    kind: t.kind,
    label:
      t.kind === 'converted'
        ? 'Converted → partner + Work OS'
        : t.kind === 'work_linked'
          ? 'Work delivery project linked'
          : t.kind.replace(/_/g, ' '),
    createdAt: t.createdAt,
    meta: t.meta,
  }));
  for (const n of p.notes ?? []) {
    timeline.push({ id: n.id, kind: 'note', label: n.text.slice(0, 80), createdAt: n.createdAt });
  }
  timeline.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    id: `crm_prospect_${p.id}`,
    kind: 'prospect',
    target: p.target,
    stage: p.stage,
    source: p.source,
    score: p.score,
    tags: p.tags ?? [],
    contact: {
      fullName: p.contact.name,
      email: p.contact.emails?.[0],
      phone: p.contact.phones?.[0],
      company: p.company.name,
      title: p.contact.title,
      website: p.company.website,
    },
    assignedTo: p.assignedTo,
    nextAction: p.nextAction,
    timeline,
    dealValueCents: dealValueFromTags(p.tags),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    sourceRef: { type: 'prospect', id: p.id },
  };
}

function leadToRecord(lead: LeadCapture, op: LeadOp): CrmRecord {
  const timeline: CrmTimelineEntry[] = (op.notes ?? []).map((n) => ({
    id: n.id,
    kind: 'note',
    label: n.text.slice(0, 80),
    createdAt: n.createdAt,
  }));
  timeline.unshift({
    id: `lead_capture_${lead.id}`,
    kind: 'capture',
    label: `Captured via ${lead.source} — ${lead.offer}`,
    createdAt: lead.createdAt,
  });

  const target: ProspectTarget =
    lead.offer === 'affiliate_application'
      ? 'affiliates'
      : lead.offer === 'agent_application'
        ? 'agents'
        : 'clients';

  return {
    id: `crm_lead_${lead.id}`,
    kind: 'inbound_lead',
    target,
    stage: op.stage,
    source: lead.source,
    tags: op.tags ?? [],
    contact: {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
    },
    partnerId: op.partnerId,
    packageInterest: lead.interest,
    attribution: lead,
    dealValueCents: dealValueFromTags(op.tags),
    timeline,
    createdAt: lead.createdAt,
    updatedAt: op.updatedAt,
    sourceRef: { type: 'lead', id: lead.id },
  };
}

function enrichRecordDealValue(record: CrmRecord): CrmRecord {
  if (record.dealValueCents != null && record.dealValueCents > 0) return record;
  const pkg = getRecommendedPackageForRecord(record)[0];
  if (!pkg) return record;
  return { ...record, dealValueCents: pkg.priceAmount };
}

export function listCrmRecords(filters?: {
  q?: string;
  target?: ProspectTarget;
  kind?: CrmRecordKind;
  stage?: CrmRecordStage;
}): CrmRecord[] {
  const prospects = listProspects({ q: filters?.q, stage: filters?.stage as any, target: filters?.target }).map(prospectToRecord);
  const leads = listLeadCaptures()
    .map((lead) => leadToRecord(lead, getLeadOp(lead.id)))
    .filter((r) => {
      if (filters?.target && r.target !== filters.target) return false;
      if (filters?.kind && r.kind !== filters.kind) return false;
      if (filters?.stage && r.stage !== filters.stage) return false;
      if (filters?.q?.trim()) {
        const q = filters.q.trim().toLowerCase();
        const hay = [r.contact.fullName, r.contact.email, r.contact.company, r.contact.phone].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

  let rows = [...prospects, ...leads];
  if (filters?.kind === 'prospect') rows = prospects;
  if (filters?.kind === 'inbound_lead') rows = leads;

  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(enrichRecordDealValue).map(enrichCrmRecordWithWorkSignals);
}

export function getCrmRecord(id: string): CrmRecord | null {
  if (id.startsWith('crm_prospect_')) {
    const p = getProspect(id.replace('crm_prospect_', ''));
    return p ? enrichWork(enrichRecordDealValue(prospectToRecord(p))) : null;
  }
  if (id.startsWith('crm_lead_')) {
    const leadId = id.replace('crm_lead_', '');
    const lead = listLeadCaptures().find((l) => l.id === leadId);
    return lead ? enrichWork(enrichRecordDealValue(leadToRecord(lead, getLeadOp(leadId)))) : null;
  }
  return null;
}

function enrichWork(r: CrmRecord): CrmRecord {
  return enrichCrmRecordWithWorkSignals(r);
}

export function setCrmRecordStage(recordId: string, stage: CrmRecordStage): CrmRecord | null {
  const record = getCrmRecord(recordId);
  if (!record?.sourceRef) return null;
  const previousStage = record.stage;
  if (record.sourceRef.type === 'prospect') {
    setProspectStage(record.sourceRef.id, stage as any);
  } else if (record.sourceRef.type === 'lead') {
    setLeadStage(record.sourceRef.id, stage as any);
  }
  const updated = getCrmRecord(recordId);
  if (updated && previousStage !== stage) {
    emitCrmStageChanged({
      recordId,
      previousStage,
      stage,
      target: updated.target,
      kind: updated.kind,
      leadId: record.sourceRef.type === 'lead' ? record.sourceRef.id : undefined,
      score: updated.score ?? undefined,
    });
  }
  return updated;
}

export function patchCrmRecordDealValue(recordId: string, dealValueCents: number): CrmRecord | null {
  const record = getCrmRecord(recordId);
  if (!record?.sourceRef) return null;
  const cents = Math.max(0, Math.round(dealValueCents));
  if (record.sourceRef.type === 'prospect') {
    const p = getProspect(record.sourceRef.id);
    if (!p) return null;
    patchProspect(record.sourceRef.id, { tags: withDealValueTag(p.tags, cents) });
  } else if (record.sourceRef.type === 'lead') {
    const op = getLeadOp(record.sourceRef.id);
    upsertLeadOp({ ...op, tags: withDealValueTag(op.tags, cents) });
  }
  return getCrmRecord(recordId);
}

export async function convertCrmRecordToPartner(args: {
  recordId: string;
  packageId?: string;
  primaryRoute?: 'personal_restore' | 'personal_build' | 'business_build';
}): Promise<{ partnerId: string; projectId?: string } | null> {
  const record = getCrmRecord(args.recordId);
  if (!record || !record.contact.email) return null;

  const email = record.contact.email.trim().toLowerCase();
  let partner = await findPartnerByEmail(email);
  if (!partner) {
    partner = await createPartner({
      status: 'lead',
      fullName: record.contact.fullName || email,
      email,
      phone: record.contact.phone || '',
      primaryRoute: args.primaryRoute ?? 'personal_restore',
      intake: {},
      asAdmin: true,
    });
  }

  let projectId: string | undefined;
  if (args.packageId) {
    const result = instantiateServiceBundle({ partnerId: partner.id, packageId: args.packageId });
    projectId = result?.project.id;
  } else {
    createTask({
      partnerId: partner.id,
      title: 'Follow up — new CRM conversion',
      kind: 'follow_up',
      stage: 'intake',
      status: 'pending',
      dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      assignedTo: 'admin',
    });
  }

  if (record.sourceRef?.type === 'lead') {
    linkLeadToPartner(record.sourceRef.id, partner.id);
    const pkg = args.packageId ? getPackageById(args.packageId) : null;
    addLeadNote(
      record.sourceRef.id,
      `CRM convert → partner ${partner.id}${projectId ? ` · Work project ${projectId}` : ''}${pkg ? ` · ${pkg.name}` : ''}`,
    );
  } else if (record.sourceRef?.type === 'prospect') {
    setProspectStage(record.sourceRef.id, 'converted');
    patchProspect(record.sourceRef.id, { tags: [...(record.tags ?? []), `partner:${partner.id}`] });
    logProspectWorkBridge(record.sourceRef.id, {
      partnerId: partner.id,
      projectId,
      packageId: args.packageId,
    });
  }

  if (projectId) {
    const pkg = args.packageId ? getPackageById(args.packageId) : null;
    addProjectNote(
      projectId,
      `Created from CRM convert (${record.id})${pkg ? ` — ${pkg.name}` : ''}`,
    );
  }

  try {
    autoEnrollCrmRecordInDefaultSequence(args.recordId, { noteLabel: `[Sequence] Auto-enrolled after convert` });
  } catch {
    // non-blocking
  }

  return { partnerId: partner.id, projectId };
}

export function getCrmRecordPackageRecommendations(record: CrmRecord): string[] {
  const interest = (record.packageInterest || record.attribution?.interest || '').toLowerCase();
  if (interest.includes('business')) return ['business_foundation', 'business_builder'];
  if (interest.includes('debt')) return ['debt_kill_starter_dfy', 'debt_kill_pro'];
  if (interest.includes('tradeline')) return ['tradeline_starter', 'personal_build_starter'];
  if (interest.includes('guide') || record.attribution?.offer === 'dispute_letter_guide') {
    return ['personal_free', 'personal_restore_starter'];
  }
  return ['personal_restore', 'personal_core'];
}

export function getRecommendedPackageForRecord(record: CrmRecord) {
  const ids = getCrmRecordPackageRecommendations(record);
  return ids.map((id) => getPackageById(id)).filter(Boolean);
}

export function createCrmInboundLead(args: {
  fullName: string;
  email: string;
  phone?: string;
  interest?: string;
  consentToContact: boolean;
  consentEmailMarketing?: boolean;
  consentSmsMarketing?: boolean;
  source?: LeadSource;
  referralCode?: string;
}): CrmRecord {
  const lead = createLeadCapture({
    source: args.source ?? 'contact',
    offer: 'general_inquiry',
    interest: args.interest,
    fullName: args.fullName,
    email: args.email,
    phone: args.phone ?? '',
    consentToContact: args.consentToContact,
    consentEmailMarketing: args.consentEmailMarketing,
    consentSmsMarketing: args.consentSmsMarketing,
    referralCode: args.referralCode,
    funnelPath: '/contact',
  });
  void runLeadCapturePipeline({ lead, guideTitle: args.interest ?? 'your inquiry' }).catch(() => {});
  const base = enrichWork(enrichRecordDealValue(leadToRecord(lead, getLeadOp(lead.id))));
  return applyCrmRoutingRules(base.id) ?? base;
}

export function updateCrmRecordConsent(
  recordId: string,
  consent: Partial<Pick<import('../domain/leads').LeadCapture, 'consentToContact' | 'consentEmailMarketing' | 'consentSmsMarketing'>>,
): CrmRecord | null {
  const record = getCrmRecord(recordId);
  if (!record?.sourceRef || record.sourceRef.type !== 'lead') return null;
  patchLeadCapture(record.sourceRef.id, consent);
  return getCrmRecord(recordId);
}

