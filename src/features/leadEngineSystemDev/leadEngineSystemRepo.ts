import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';
import { DEFAULT_LEAD_ENGINE_CITIES, LEAD_ENGINE_SOURCE_PLANS } from './citySourceVault';
import type { LeadActionRecommendation, LeadEngineEvent, LeadEngineEventKind, LeadEngineReport, LeadEngineSettings, LeadIntelCandidate, LeadSwarmJob, NurtureHandoff, TrackedShortLink } from './types';

const KEY = 'finely.lead.engine.system.dev.v1';

export type LeadEngineSystemStore = {
  settings: LeadEngineSettings;
  jobs: LeadSwarmJob[];
  candidates: LeadIntelCandidate[];
  actions: LeadActionRecommendation[];
  shortLinks: TrackedShortLink[];
  handoffs: NurtureHandoff[];
  events: LeadEngineEvent[];
};

const DEFAULT_SETTINGS: LeadEngineSettings = {
  enabled: true,
  mode: 'approval_required_external',
  cities: DEFAULT_LEAD_ENGINE_CITIES.slice(0, 8).map((c) => c.id),
  sources: LEAD_ENGINE_SOURCE_PLANS.filter((s) => s.enabledByDefault).map((s) => s.id),
  dailyLeadTarget: 200,
  overnightLeadTarget: 50,
  maxJobsPerTick: 24,
  maxAutoNurturesPerDay: 50,
  defaultTimezone: 'America/New_York',
  requireApprovalForExternalMessages: true,
  allowManualCommunityQueue: true,
};

function nowIso() {
  return new Date().toISOString();
}

function defaultStore(): LeadEngineSystemStore {
  return { settings: DEFAULT_SETTINGS, jobs: [], candidates: [], actions: [], shortLinks: [], handoffs: [], events: [] };
}

export function loadLeadEngineStore(): LeadEngineSystemStore {
  const loaded = loadJson<LeadEngineSystemStore>(KEY, defaultStore(), 1);
  return {
    ...defaultStore(),
    ...loaded,
    settings: { ...DEFAULT_SETTINGS, ...(loaded.settings ?? {}) },
    jobs: loaded.jobs ?? [],
    candidates: loaded.candidates ?? [],
    actions: loaded.actions ?? [],
    shortLinks: loaded.shortLinks ?? [],
    handoffs: loaded.handoffs ?? [],
    events: loaded.events ?? [],
  };
}

export function saveLeadEngineStore(store: LeadEngineSystemStore) {
  saveJson(KEY, store, 1);
}

export function updateLeadEngineSettings(patch: Partial<LeadEngineSettings>) {
  const store = loadLeadEngineStore();
  store.settings = { ...store.settings, ...patch };
  saveLeadEngineStore(store);
  return store.settings;
}

export function addLeadEngineEvent(kind: LeadEngineEventKind, summary: string, meta?: Partial<LeadEngineEvent>) {
  const store = loadLeadEngineStore();
  const event: LeadEngineEvent = {
    id: newId('legevt'),
    createdAt: nowIso(),
    kind,
    summary,
    cityId: meta?.cityId,
    candidateId: meta?.candidateId,
    funnel: meta?.funnel,
    source: meta?.source,
    meta: meta?.meta,
  };
  store.events = [event, ...store.events].slice(0, 500);
  saveLeadEngineStore(store);
  return event;
}

export function upsertSwarmJob(job: LeadSwarmJob) {
  const store = loadLeadEngineStore();
  const idx = store.jobs.findIndex((j) => j.id === job.id);
  const next = { ...job, updatedAt: nowIso() };
  if (idx >= 0) store.jobs[idx] = next;
  else store.jobs.unshift(next);
  store.jobs = store.jobs.slice(0, 1000);
  saveLeadEngineStore(store);
  return next;
}

export function addSwarmJobs(jobs: LeadSwarmJob[]) {
  const store = loadLeadEngineStore();
  const existing = new Set(store.jobs.map((j) => `${j.cityId}|${j.source}|${j.query}`));
  const accepted: LeadSwarmJob[] = [];
  for (const job of jobs) {
    const key = `${job.cityId}|${job.source}|${job.query}`;
    if (existing.has(key)) continue;
    existing.add(key);
    accepted.push(job);
  }
  store.jobs = [...accepted, ...store.jobs].slice(0, 2000);
  saveLeadEngineStore(store);
  if (accepted.length) addLeadEngineEvent('job_queued', `Queued ${accepted.length} Lead Intel jobs.`, { meta: { count: accepted.length } });
  return accepted;
}

export function listSwarmJobs() {
  return loadLeadEngineStore().jobs.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getNextQueuedJobs(limit: number) {
  return listSwarmJobs().filter((j) => j.status === 'queued').slice(0, Math.max(1, limit));
}

export function upsertCandidate(candidate: LeadIntelCandidate) {
  const store = loadLeadEngineStore();
  const idx = store.candidates.findIndex((c) => c.id === candidate.id || (candidate.url && c.url === candidate.url));
  const next = { ...candidate, updatedAt: nowIso() };
  if (idx >= 0) store.candidates[idx] = { ...store.candidates[idx], ...next };
  else store.candidates.unshift(next);
  store.candidates = store.candidates.slice(0, 2000);
  saveLeadEngineStore(store);
  return next;
}

export function bulkUpsertCandidates(candidates: LeadIntelCandidate[]) {
  const out: LeadIntelCandidate[] = [];
  for (const c of candidates) out.push(upsertCandidate(c));
  if (out.length) addLeadEngineEvent('candidate_discovered', `Discovered ${out.length} candidates.`, { meta: { count: out.length } });
  return out;
}

export function listCandidates() {
  return loadLeadEngineStore().candidates.slice().sort((a, b) => b.score - a.score || b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertAction(action: LeadActionRecommendation) {
  const store = loadLeadEngineStore();
  const idx = store.actions.findIndex((a) => a.id === action.id || a.candidateId === action.candidateId);
  if (idx >= 0) store.actions[idx] = action;
  else store.actions.unshift(action);
  const linkIdx = store.shortLinks.findIndex((l) => l.id === action.shortLink.id || l.slug === action.shortLink.slug);
  if (linkIdx >= 0) store.shortLinks[linkIdx] = action.shortLink;
  else store.shortLinks.unshift(action.shortLink);
  store.actions = store.actions.slice(0, 1000);
  store.shortLinks = store.shortLinks.slice(0, 1000);
  saveLeadEngineStore(store);
  return action;
}

export function listActions() {
  return loadLeadEngineStore().actions.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function approveAction(actionId: string) {
  const store = loadLeadEngineStore();
  const idx = store.actions.findIndex((a) => a.id === actionId);
  if (idx < 0) return null;
  const next = { ...store.actions[idx], approvalStatus: 'approved' as const };
  store.actions[idx] = next;
  saveLeadEngineStore(store);
  addLeadEngineEvent('message_approved', `Approved action: ${next.headline}`, { candidateId: next.candidateId, funnel: next.funnel });
  return next;
}

export function upsertHandoff(handoff: NurtureHandoff) {
  const store = loadLeadEngineStore();
  const idx = store.handoffs.findIndex((h) => h.id === handoff.id || h.candidateId === handoff.candidateId);
  if (idx >= 0) store.handoffs[idx] = handoff;
  else store.handoffs.unshift(handoff);
  store.handoffs = store.handoffs.slice(0, 1000);
  saveLeadEngineStore(store);
  addLeadEngineEvent('nurture_handoff', `Prepared nurture handoff for ${handoff.funnel}.`, { candidateId: handoff.candidateId, funnel: handoff.funnel });
  return handoff;
}

export function listHandoffs() {
  return loadLeadEngineStore().handoffs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listShortLinks() {
  return loadLeadEngineStore().shortLinks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordShortLinkLead(slug: string) {
  const store = loadLeadEngineStore();
  const idx = store.shortLinks.findIndex((l) => l.slug === slug);
  if (idx < 0) return null;
  const next = { ...store.shortLinks[idx], leads: (store.shortLinks[idx].leads ?? 0) + 1 };
  store.shortLinks[idx] = next;
  saveLeadEngineStore(store);
  addLeadEngineEvent('lead_captured', `Lead captured through ${slug}.`, { funnel: next.funnel, cityId: next.cityId, source: next.source });
  return next;
}

export function buildLeadEngineReport(windowLabel = 'Today'): LeadEngineReport {
  const store = loadLeadEngineStore();
  const cityRows = store.settings.cities.map((cityId) => {
    const city = DEFAULT_LEAD_ENGINE_CITIES.find((c) => c.id === cityId);
    const candidates = store.candidates.filter((c) => c.cityId === cityId);
    const links = store.shortLinks.filter((l) => l.cityId === cityId);
    const handoffs = store.handoffs.filter((h) => store.candidates.find((c) => c.id === h.candidateId)?.cityId === cityId);
    return {
      cityId,
      label: city ? `${city.label}, ${city.state}` : cityId,
      discovered: candidates.length,
      hot: candidates.filter((c) => c.score >= 60).length,
      imported: candidates.filter((c) => c.prospectId).length,
      nurtures: handoffs.length,
      clicks: links.reduce((sum, x) => sum + (x.clicks ?? 0), 0),
      leads: links.reduce((sum, x) => sum + (x.leads ?? 0), 0),
      bookings: links.reduce((sum, x) => sum + (x.bookings ?? 0), 0),
    };
  });
  const jobsQueued = store.jobs.filter((j) => j.status === 'queued').length;
  const jobsRunning = store.jobs.filter((j) => j.status === 'running').length;
  const hotCandidates = store.candidates.filter((c) => c.score >= 60).length;
  const bottlenecks: string[] = [];
  if (jobsQueued === 0 && jobsRunning === 0) bottlenecks.push('No active swarm jobs. Start or schedule continuous swarm.');
  if (store.actions.filter((a) => a.approvalStatus === 'draft').length > 25) bottlenecks.push('Action approvals are backing up. Review the Action Center.');
  if (store.shortLinks.length === 0) bottlenecks.push('No tracked short links created yet. Build action recommendations.');
  if (store.handoffs.length === 0) bottlenecks.push('No nurture handoffs. Connect high-score candidates to sequences.');
  return {
    generatedAt: nowIso(),
    windowLabel,
    cities: cityRows,
    totals: {
      jobsQueued,
      jobsRunning,
      candidates: store.candidates.length,
      hotCandidates,
      shortLinks: store.shortLinks.length,
      nurtures: store.handoffs.length,
      leads: store.shortLinks.reduce((sum, x) => sum + (x.leads ?? 0), 0),
      bookings: store.shortLinks.reduce((sum, x) => sum + (x.bookings ?? 0), 0),
    },
    bottlenecks,
    nextMoves: [
      'Keep swarm running on the highest-priority cities first.',
      'Approve safe action-center messages with tracked links.',
      'Deploy lead magnet pages and connect captures back to short links.',
      'Turn on nurture only when consent or manual outreach basis is clear.',
    ],
  };
}
