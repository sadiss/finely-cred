import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { buildQueryPool } from './queryExpander';
import { getDailyMetroShardPack, metroShardSummaryLine } from '../marketingDesk/usMetroShardMap';
import { LEAD_INTEL_SOURCE_ADAPTERS, getLeadIntelSourceRuntimeMode, getPriorityLiveSourceAdapters } from './sourceAdapters';
import { LIVE_FETCH_CAPABLE_SOURCE_IDS, runLiveFetchForSource } from './liveLeadFetchers';
import type { LeadIntelJob, LeadIntelLiveFeedEvent, LeadIntelSourceId, OvernightAttribution, OvernightCity, SwarmSession, SyntheticStaffAgent } from './types';
// Real internal-source signals (Phase 5a task 4) — read-only imports, these repos are
// not modified by this feature.
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { listAffiliatesLocalSync, listAffiliateEventsLocalSync } from '../../data/affiliateRepo';
import { listLeadCaptures } from '../../data/leadsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';

const KEY = 'finely.overnight50.v1';

/** Deep mode: ~1–3% progress per tick, 45–90 ticks/job → hours at 90s cadence */
const DEEP_TICK_MIN = 45;
const DEEP_TICK_MAX = 90;
const DEEP_JOBS_PER_TICK = 2;

type Store = {
  jobs: LeadIntelJob[];
  feed: LeadIntelLiveFeedEvent[];
  attributions: OvernightAttribution[];
  swarmEnabled: boolean;
  staff: SyntheticStaffAgent[];
  swarmSession?: SwarmSession;
};

function nowIso() { return new Date().toISOString(); }
function loadStore(): Store { return loadJson<Store>(KEY, { jobs: [], feed: [], attributions: [], swarmEnabled: false, staff: [] }, 1); }
function saveStore(store: Store) { saveJson(KEY, store, 1); }

function phaseForProgress(p: number): LeadIntelJob['phase'] {
  if (p >= 100) return 'complete';
  if (p >= 82) return 'importing';
  if (p >= 58) return 'scoring';
  if (p >= 28) return 'enriching';
  return 'discovering';
}

function phaseMessage(job: LeadIntelJob): string {
  const phase = job.phase ?? 'discovering';
  const verbs: Record<string, string> = {
    discovering: 'Discovering sources',
    enriching: 'Deep-enriching pages',
    scoring: 'Scoring intent + compliance',
    importing: 'Staging CRM import',
    complete: 'Completed scan',
  };
  const v = verbs[phase] ?? 'Working';
  return `${v} — ${job.city}: ${job.query.slice(0, 72)}${job.query.length > 72 ? '…' : ''}`;
}

export function listLeadIntelJobs(limit = 400): LeadIntelJob[] {
  return loadStore().jobs.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export function listLeadIntelFeed(limit = 160): LeadIntelLiveFeedEvent[] {
  return loadStore().feed.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function getSwarmSession(): SwarmSession | null {
  return loadStore().swarmSession ?? null;
}

export function setSwarmEnabled(enabled: boolean) {
  const s = loadStore();
  s.swarmEnabled = enabled;
  if (!enabled) s.swarmSession = undefined;
  saveStore(s);
  addLeadIntelFeed({ city: 'System', sourceId: 'serper_web', agent: 'Geo Commander', message: enabled ? 'Continuous deep swarm is now active.' : 'Continuous swarm paused by admin.', severity: enabled ? 'success' : 'warning' });
}

export function isSwarmEnabled() { return loadStore().swarmEnabled; }

export function upsertLeadIntelJob(job: LeadIntelJob): LeadIntelJob {
  const s = loadStore();
  const idx = s.jobs.findIndex((j) => j.id === job.id);
  const next = { ...job, updatedAt: nowIso() };
  if (idx >= 0) s.jobs[idx] = next; else s.jobs.push(next);
  s.jobs = s.jobs.slice(-8000);
  saveStore(s);
  return next;
}

export function addLeadIntelFeed(args: Omit<LeadIntelLiveFeedEvent, 'id' | 'createdAt'>) {
  const s = loadStore();
  s.feed.push({ id: newId('feed'), createdAt: nowIso(), ...args });
  s.feed = s.feed.slice(-1500);
  saveStore(s);
}

export async function enqueueLeadIntelSwarm(args?: {
  cities?: OvernightCity[];
  limit?: number;
  remote?: boolean;
  deep?: boolean;
}) {
  const deep = args?.deep !== false;
  const sourceIds = deep
    ? LEAD_INTEL_SOURCE_ADAPTERS.filter((s) => s.supportsContinuous).map((s) => s.id)
    : undefined;
  const limit = args?.limit ?? (deep ? 720 : 180);
  const plans = buildQueryPool({ cities: args?.cities, sourceIds, limit });
  const now = nowIso();
  const jobs: LeadIntelJob[] = plans.map((p) => {
    const tickBudget = deep ? DEEP_TICK_MIN + (stableMod(p.id) % (DEEP_TICK_MAX - DEEP_TICK_MIN + 1)) : 12;
    return {
      id: newId('lijob'),
      sourceId: p.sourceId,
      city: p.city,
      query: p.query,
      status: 'queued' as const,
      priority: p.priority,
      attempt: 0,
      progress: 0,
      discovered: 0,
      enriched: 0,
      hot: 0,
      imported: 0,
      phase: 'discovering' as const,
      tickBudget,
      ticksSpent: 0,
      message: `Queued deep scan (${tickBudget} ticks est.) — ${p.sourceId} / ${p.city}`,
      createdAt: now,
      updatedAt: now,
    };
  });
  const s = loadStore();
  s.jobs.push(...jobs);
  s.swarmEnabled = true;
  const avgTicks = jobs.reduce((n, j) => n + (j.tickBudget ?? 60), 0) / Math.max(1, jobs.length);
  const estHours = Math.round((avgTicks * jobs.length * 1.5) / 3600 * 10) / 10;
  s.swarmSession = {
    startedAt: now,
    mode: deep ? 'deep' : 'fast',
    estimatedHours: Math.max(2, estHours),
    jobsTotal: jobs.length,
    activeLabel: 'Night Owl Intel shift — multi-hour discovery',
  };
  saveStore(s);
  const liveSources = sourceIds?.filter((id) => getLeadIntelSourceRuntimeMode(id) === 'live').length ?? 0;
  const simSources = (sourceIds?.length ?? 0) - liveSources;
  const priorityLabels = getPriorityLiveSourceAdapters()
    .slice(0, 3)
    .map((a) => a.label)
    .join(', ');
  addLeadIntelFeed({
    city: 'System',
    sourceId: 'serper_web',
    agent: 'Night Owl Intel',
    message: `Deep swarm queued ${jobs.length} jobs — ${liveSources} live-path · ${simSources} simulation-only sources. Marketing Desk Find uses live priority: ${priorityLabels || 'Serper web'}. Est. runtime: ${s.swarmSession.estimatedHours}+ hours.`,
    severity: 'success',
  });
  if (args?.remote && isSupabaseConfigured) {
    try { await supabase.functions.invoke('lead-intel-enqueue', { body: { jobs, deep: true } }); } catch { /* local fallback */ }
  }
  return jobs;
}

function stableMod(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

type LiveJobDelta = { discovered: number; enriched: number; note?: string } | null;

const TERMINAL_CRM_STAGES = new Set(['converted', 'disqualified', 'won', 'lost']);
const REVIVAL_STALE_MS = 21 * 24 * 60 * 60 * 1000;
const AFFILIATE_RECENT_MS = 30 * 24 * 60 * 60 * 1000;
const SEO_INBOUND_RECENT_MS = 7 * 24 * 60 * 60 * 1000;
const ORGANIC_INBOUND_SOURCES = new Set(['resources', 'lead_magnet', 'contact']);

/**
 * Real internal-source signal (Phase 5a task 4) for the `internal`-method sources that
 * have a genuine, already-existing repo to back them. Read-only against those repos —
 * this feature never writes to them. Returns `null` when there's no real signal to
 * report (falls back to the pre-existing simulated bump).
 */
function computeInternalRealSignal(sourceId: LeadIntelSourceId): { total: number; note: string } | null {
  try {
    if (sourceId === ('dead_lead_revival' as LeadIntelSourceId)) {
      const stale = listCrmRecords().filter((r) => {
        if (TERMINAL_CRM_STAGES.has(String(r.stage))) return false;
        return Date.now() - new Date(r.updatedAt).getTime() > REVIVAL_STALE_MS;
      });
      return { total: stale.length, note: `${stale.length} real stale CRM record(s) eligible for revival` };
    }
    if (sourceId === ('affiliate_referral_loop' as LeadIntelSourceId)) {
      const affiliates = listAffiliatesLocalSync(FINELY_TENANT_ID);
      const recentEvents = listAffiliateEventsLocalSync().filter(
        (e) => Date.now() - new Date(e.createdAt).getTime() < AFFILIATE_RECENT_MS,
      );
      return {
        total: affiliates.length + recentEvents.length,
        note: `${affiliates.length} real affiliate(s), ${recentEvents.length} recent attribution event(s)`,
      };
    }
    if (sourceId === ('seo_inbound_forms' as LeadIntelSourceId)) {
      const leads = listLeadCaptures().filter(
        (l) => ORGANIC_INBOUND_SOURCES.has(l.source) && Date.now() - new Date(l.createdAt).getTime() < SEO_INBOUND_RECENT_MS,
      );
      return { total: leads.length, note: `${leads.length} real organic inbound form submission(s) (last 7d)` };
    }
    return null;
  } catch {
    return null;
  }
}

/** Trickles a real internal count into a job's discovered/enriched instead of a random bump. */
function internalLiveDelta(job: LeadIntelJob): LiveJobDelta {
  const real = computeInternalRealSignal(job.sourceId);
  if (!real) return null;
  const remaining = Math.max(0, real.total - job.discovered);
  if (remaining <= 0) return { discovered: 0, enriched: 0, note: real.note };
  return { discovered: 1, enriched: job.progress > 28 ? 1 : 0, note: real.note };
}

/**
 * Attempts a genuine network fetch for sources with a real fetcher wired (see
 * liveLeadFetchers.ts). Returns `null` (fall back to simulated bump) when the source
 * isn't fetch-capable, isn't marked live, or the job lacks city/query context to build
 * a real request from.
 */
async function tryLiveFetchDelta(job: LeadIntelJob): Promise<LiveJobDelta> {
  if (getLeadIntelSourceRuntimeMode(job.sourceId) !== 'live') return null;
  if (!LIVE_FETCH_CAPABLE_SOURCE_IDS.has(job.sourceId)) return null;
  if (!job.city || !job.query) return null;
  try {
    const outcome = await runLiveFetchForSource(job.sourceId, { city: String(job.city), query: job.query });
    if (!outcome.attempted || !outcome.ok) return null;
    return { discovered: outcome.discovered, enriched: outcome.enriched, note: outcome.note };
  } catch {
    return null;
  }
}

/** Resolves a real-data delta for a job (live fetch, then internal repo signal), or `null` for the old simulated path. */
async function resolveLiveDelta(job: LeadIntelJob): Promise<LiveJobDelta> {
  const fetched = await tryLiveFetchDelta(job).catch(() => null);
  if (fetched) return fetched;
  return internalLiveDelta(job);
}

function advanceDeepJob(job: LeadIntelJob, liveDelta?: LiveJobDelta): LeadIntelJob {
  const budget = job.tickBudget ?? 60;
  const spent = (job.ticksSpent ?? 0) + 1;
  const progress = Math.min(100, Math.round((spent / budget) * 100));
  const phase = phaseForProgress(progress);
  const discovered = job.discovered + (liveDelta ? liveDelta.discovered : (spent % 4 === 0 ? 1 : 0));
  const enriched = job.enriched + (liveDelta ? liveDelta.enriched : (progress > 28 && spent % 5 === 0 ? 1 : 0));
  const hot = job.hot + (progress > 58 && spent % 7 === 0 && job.priority > 60 ? 1 : 0);
  const imported = job.imported + (progress >= 100 && job.priority > 75 ? 1 : 0);
  const status = progress >= 100 ? 'done' as const : 'running' as const;
  const baseMessage = phaseMessage({ ...job, phase, progress });
  const next: LeadIntelJob = {
    ...job,
    status,
    ticksSpent: spent,
    progress,
    phase,
    attempt: job.attempt + 1,
    discovered,
    enriched,
    hot,
    imported,
    message: liveDelta?.note ? `${baseMessage} — ${liveDelta.note}` : baseMessage,
    updatedAt: nowIso(),
  };
  return next;
}

export async function runLocalSwarmTick(maxJobs = DEEP_JOBS_PER_TICK) {
  const s = loadStore();
  if (!s.swarmEnabled) return { processed: 0, message: 'Swarm paused.' };
  const deep = s.swarmSession?.mode !== 'fast';
  const cap = deep ? DEEP_JOBS_PER_TICK : Math.min(maxJobs, 8);
  const jobs = s.jobs
    .filter((j) => j.status === 'queued' || j.status === 'running')
    .sort((a, b) => b.priority - a.priority || (a.ticksSpent ?? 0) - (b.ticksSpent ?? 0))
    .slice(0, cap);

  // Real fetch/repo signals are resolved in parallel up front so a slow/timed-out
  // network call for one job doesn't stall the others in this tick.
  const liveDeltas = await Promise.all(jobs.map((job) => resolveLiveDelta(job)));

  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i]!;
    const liveDelta = liveDeltas[i] ?? null;
    const next = deep ? advanceDeepJob(job, liveDelta) : advanceFastJob(job, liveDelta);
    const idx = s.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) s.jobs[idx] = next;
    if (next.attempt % (deep ? 6 : 2) === 0 || next.status === 'done') {
      addLeadIntelFeed({
        city: next.city,
        sourceId: next.sourceId,
        agent: next.sourceId.includes('revival') ? 'Revival Specialist' : 'Night Owl Intel',
        message: next.message,
        severity: next.status === 'done' ? 'success' : 'info',
        counts: { discovered: next.discovered, enriched: next.enriched, hot: next.hot, imported: next.imported },
      });
    }
  }
  if (s.swarmSession && jobs.length) {
    const running = s.jobs.find((j) => j.status === 'running');
    s.swarmSession = { ...s.swarmSession, activeLabel: running?.message?.slice(0, 80) ?? 'Rotating sources…' };
  }
  saveStore(s);
  return { processed: jobs.length, message: `Advanced ${jobs.length} deep scan jobs (compliant cadence).` };
}

function advanceFastJob(job: LeadIntelJob, liveDelta?: LiveJobDelta): LeadIntelJob {
  const bump = 8 + (job.query.length % 17);
  const progress = Math.min(100, job.progress + bump);
  const status = progress >= 100 ? 'done' as const : 'running' as const;
  const baseMessage = status === 'done' ? `Finished ${job.sourceId} scan for ${job.city}.` : `Scanning ${job.city}: ${job.query}`;
  return {
    ...job,
    status,
    progress,
    attempt: job.attempt + 1,
    discovered: job.discovered + (liveDelta ? liveDelta.discovered : 1 + (job.priority % 4)),
    enriched: job.enriched + (liveDelta ? liveDelta.enriched : (progress > 25 ? 1 : 0)),
    hot: job.hot + (progress > 50 && job.priority > 70 ? 1 : 0),
    imported: job.imported + (progress > 80 && job.priority > 80 ? 1 : 0),
    message: liveDelta?.note ? `${baseMessage} — ${liveDelta.note}` : baseMessage,
    updatedAt: nowIso(),
  };
}

export function getSwarmStats() {
  const jobs = listLeadIntelJobs(8000);
  const session = getSwarmSession();
  const liveSourceCount = LEAD_INTEL_SOURCE_ADAPTERS.filter(
    (a) => getLeadIntelSourceRuntimeMode(a.id) === 'live',
  ).length;
  const simulationSourceCount = LEAD_INTEL_SOURCE_ADAPTERS.length - liveSourceCount;
  return {
    totalJobs: jobs.length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    running: jobs.filter((j) => j.status === 'running').length,
    done: jobs.filter((j) => j.status === 'done').length,
    discovered: jobs.reduce((n, j) => n + j.discovered, 0),
    enriched: jobs.reduce((n, j) => n + j.enriched, 0),
    hot: jobs.reduce((n, j) => n + j.hot, 0),
    imported: jobs.reduce((n, j) => n + j.imported, 0),
    sourceCount: LEAD_INTEL_SOURCE_ADAPTERS.length,
    liveSourceCount,
    simulationSourceCount,
    priorityMarketingSourceIds: getPriorityLiveSourceAdapters().map((a) => a.id),
    estimatedHours: session?.estimatedHours ?? 0,
    sessionMode: session?.mode ?? 'idle',
    activeLabel: session?.activeLabel ?? '',
  };
}

/** Live overnight50 adapters wired to Marketing Desk Find staging (Serper + internal). */
export function getMarketingStagingPrioritySourceIds() {
  return getPriorityLiveSourceAdapters().map((a) => a.id);
}

export type LiveSerperBridgeSnapshot = {
  shardSummary: string;
  metroPack: string[];
  stagingPending: number;
  lastFindAt?: string;
  lastFindFound?: number;
  lastFindAutoSaved?: number;
  workerMode?: string;
  workerMessage?: string;
  workerAt?: string;
};

/** Bridge simulation dashboard to live Marketing Desk / Serper queue signals. */
export function getLiveSerperBridgeSnapshot(args?: {
  stagingPending?: number;
  lastFindAt?: string;
  lastFindFound?: number;
  lastFindAutoSaved?: number;
  workerMode?: string;
  workerMessage?: string;
  workerAt?: string;
}): LiveSerperBridgeSnapshot {
  const pack = getDailyMetroShardPack().map((c) => c.split(',')[0]!.trim());
  return {
    shardSummary: metroShardSummaryLine(),
    metroPack: pack,
    stagingPending: args?.stagingPending ?? 0,
    lastFindAt: args?.lastFindAt,
    lastFindFound: args?.lastFindFound,
    lastFindAutoSaved: args?.lastFindAutoSaved,
    workerMode: args?.workerMode,
    workerMessage: args?.workerMessage,
    workerAt: args?.workerAt,
  };
}

/** Optional remote tick — marketing-hunt-tick (live Serper) then worker probe. */
export async function runLiveSerperBridgeTick(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: 'Supabase not configured — simulation only.' };
  }
  try {
    const hunt = await supabase.functions.invoke('marketing-hunt-tick', {
      body: { metros: getDailyMetroShardPack() },
    });
    if (hunt.error) {
      return { ok: false, message: hunt.error.message };
    }
    const msg = String((hunt.data as { message?: string })?.message || 'marketing-hunt-tick OK');
    addLeadIntelFeed({
      city: 'System',
      sourceId: 'serper_web',
      agent: 'Geo Scanner',
      message: `Live bridge · ${msg}`,
      severity: 'info',
    });
    return { ok: true, message: msg };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Live bridge tick failed' };
  }
}

export function listOvernightAttributions(limit = 300): OvernightAttribution[] {
  return loadStore().attributions.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export function recordOvernightLeadAttribution(args: {
  city?: string;
  source: OvernightAttribution['source'];
  leads?: number;
  costCents?: number;
  notes?: string;
}) {
  const s = loadStore();
  const row: OvernightAttribution = {
    id: newId('onight'),
    runId: `live_${new Date().toISOString().slice(0, 10)}`,
    createdAt: nowIso(),
    city: args.city || 'National',
    source: args.source,
    leads: Math.max(1, args.leads ?? 1),
    costCents: Math.max(0, args.costCents ?? 0),
    notes: args.notes,
  };
  s.attributions.push(row);
  s.attributions = s.attributions.slice(-5000);
  saveStore(s);
  addLeadIntelFeed({
    city: row.city,
    sourceId: 'seo_inbound_forms',
    agent: 'Morning Hawk',
    message: `+${row.leads} lead(s) from ${row.source.replace(/_/g, ' ')}${row.notes ? ` — ${row.notes}` : ''}`,
    severity: 'success',
    counts: { imported: row.leads },
  });
  return row;
}

export function getOvernightLeadTotals(hours = 12) {
  const since = Date.now() - hours * 60 * 60 * 1000;
  const rows = listOvernightAttributions(5000).filter((r) => new Date(r.createdAt).getTime() >= since);
  const bySource: Record<string, number> = {};
  let total = 0;
  let costCents = 0;
  for (const r of rows) {
    total += r.leads;
    costCents += r.costCents;
    bySource[r.source] = (bySource[r.source] ?? 0) + r.leads;
  }
  return { total, costCents, bySource, rows };
}
