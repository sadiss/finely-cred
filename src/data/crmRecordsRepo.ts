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
import { handleMarketingLifecycleOnCrmStageChange } from '../features/marketingDepartment/marketingLifecycleAutomations';
import { applyCrmRoutingRules } from '../features/crm/routing/applyCrmRoutingRules';
import { autoEnrollCrmRecordInDefaultSequence } from '../features/crm/sequences/autoEnrollCrmRecord';
import { runLeadCapturePipeline } from '../lib/leadCapturePipeline';
import { isLeadTrashed } from '../features/studioCommandOs/leadTrashRepo';
import { leadOfferLabel } from '../lib/leadOfferLabels';
import { loadJson, saveJson } from './localJsonStore';

const DEAL_VALUE_TAG_PREFIX = 'deal_value_cents:';

// ─────────────────────────────────────────────────────────────────────────
// Server-pull fallback cache (Phase F4). `CrmRecord` is normally a computed
// view over `crmProspectsRepo.ts` (prospects) + `leadsRepo.ts`/`leadOpsRepo.ts`
// (inbound leads) — there is no independent "CrmRecord store" to merge into.
// `kind: 'prospect'` rows are fully recomputable once prospects are restored
// via `mergeProspectsFromServer()`, so only non-prospect rows (inbound leads
// whose underlying `LeadCapture` may not exist in this browser) are cached
// here as a read-only fallback for `listCrmRecords()`/`getCrmRecord()`.
// ─────────────────────────────────────────────────────────────────────────
const SERVER_CACHE_KEY = 'finely.crm.records.serverCache.v1';
type ServerCacheStore = { records: CrmRecord[] };

function loadServerCache(): ServerCacheStore {
  return loadJson<ServerCacheStore>(SERVER_CACHE_KEY, { records: [] }, 1);
}

function saveServerCache(store: ServerCacheStore) {
  saveJson(SERVER_CACHE_KEY, store, 1);
}

/** Merge CRM records pulled from Supabase into the local fallback cache — see note above. */
export function mergeCrmRecordsFromServer(serverRecords: CrmRecord[]): { cached: number } {
  const cache = loadServerCache();
  const incoming = serverRecords.filter((r) => r.kind !== 'prospect');
  for (const r of incoming) {
    const idx = cache.records.findIndex((x) => x.id === r.id);
    if (idx < 0) cache.records.push(r);
    else if (r.updatedAt > cache.records[idx].updatedAt) cache.records[idx] = r;
  }
  if (incoming.length) saveServerCache(cache);
  return { cached: incoming.length };
}

function serverCachedRecords(): CrmRecord[] {
  return loadServerCache().records;
}

/** Best-effort server mirror — never blocks or throws on the local write path. */
function syncRecordServerSide(record: CrmRecord | null) {
  if (!record) return;
  void import('./crmServerSync').then((m) => m.syncCrmRecordToSupabase(record));
}

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
    label: `Captured via ${lead.source} — ${leadOfferLabel(lead.offer)}`,
    createdAt: lead.createdAt,
  });

  const target: ProspectTarget =
    lead.offer === 'affiliate_application'
      ? 'affiliates'
      : lead.offer === 'agent_application' ||
          lead.offer === 'credit_specialist_join' ||
          lead.offer === 'credit_specialist_guide' ||
          (lead.offer as string) === 'specialist_program_apply'
        ? 'agents'
        : 'clients';

  const csTags =
    lead.offer === 'credit_specialist_join' || lead.offer === 'credit_specialist_guide'
      ? ['credit-specialist', `offer:${lead.offer}`]
      : [];

  return {
    id: `crm_lead_${lead.id}`,
    kind: 'inbound_lead',
    target,
    stage: op.stage,
    source: lead.source,
    tags: Array.from(new Set([...(op.tags ?? []), ...csTags])),
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

  // Server-pull fallback (Phase F4): surface cached records restored via
  // pullCrmSnapshotFromSupabase() whose underlying local source (a
  // LeadCapture) doesn't exist in this browser yet.
  if (!filters?.kind || filters.kind !== 'prospect') {
    const liveIds = new Set(rows.map((r) => r.id));
    const cachedFallback = serverCachedRecords().filter((r) => {
      if (liveIds.has(r.id)) return false;
      if (filters?.kind && r.kind !== filters.kind) return false;
      if (filters?.target && r.target !== filters.target) return false;
      if (filters?.stage && r.stage !== filters.stage) return false;
      return true;
    });
    rows = [...rows, ...cachedFallback];
  }

  // Cleanup (trash) removes cards from Board immediately — Put back restores visibility.
  rows = rows.filter((r) => {
    const sourceId = r.sourceRef?.id;
    if (sourceId && isLeadTrashed(sourceId)) return false;
    if (isLeadTrashed(r.id)) return false;
    return true;
  });

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
    if (lead) return enrichWork(enrichRecordDealValue(leadToRecord(lead, getLeadOp(leadId))));
  }
  // Server-pull fallback (Phase F4) — restores a record synced from another
  // browser session whose underlying local source isn't present here yet.
  return serverCachedRecords().find((r) => r.id === id) ?? null;
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
    handleMarketingLifecycleOnCrmStageChange(recordId, previousStage, stage);
  }
  syncRecordServerSide(updated);
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
  const updated = getCrmRecord(recordId);
  syncRecordServerSide(updated);
  return updated;
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

  syncRecordServerSide(getCrmRecord(args.recordId));
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
  const result = applyCrmRoutingRules(base.id) ?? base;
  syncRecordServerSide(result);
  return result;
}

export function updateCrmRecordConsent(
  recordId: string,
  consent: Partial<Pick<import('../domain/leads').LeadCapture, 'consentToContact' | 'consentEmailMarketing' | 'consentSmsMarketing'>>,
): CrmRecord | null {
  const record = getCrmRecord(recordId);
  if (!record?.sourceRef || record.sourceRef.type !== 'lead') return null;
  patchLeadCapture(record.sourceRef.id, consent);
  const updated = getCrmRecord(recordId);
  syncRecordServerSide(updated);
  return updated;
}

