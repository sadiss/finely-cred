import { newId } from '../../utils/ids';
import { findCity, findSource } from './citySourceVault';
import { chooseFunnelFromCandidate, scoreCandidate } from './leadIntelActionEngine';
import { addLeadEngineEvent, addSwarmJobs, bulkUpsertCandidates, getNextQueuedJobs, loadLeadEngineStore, upsertSwarmJob } from './leadEngineSystemRepo';
import { makeSwarmJobs } from './queryPlanner';
import { assignmentsForFunnel } from './roleMatrix';
import type { LeadIntelCandidate, LeadSwarmJob } from './types';

function nowIso() {
  return new Date().toISOString();
}

function domainFromQuery(query: string) {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36) || 'lead';
}

function makeDemoCandidate(job: LeadSwarmJob, n: number): LeadIntelCandidate {
  const city = findCity(job.cityId);
  const source = findSource(job.source);
  const title = `${city.label} ${source.label} opportunity ${n + 1}`;
  const snippet = `Signal from ${job.query}. This record needs routing, a short link, and a human-approved first touch.`;
  const base = scoreCandidate({ title, snippet, source: job.source, cityId: job.cityId, url: `https://${domainFromQuery(job.query)}-${n}.example.com` });
  const funnel = chooseFunnelFromCandidate({ title, snippet, source: job.source, cityId: job.cityId, emails: n % 2 === 0 ? [`lead${n}@example.com`] : [], phones: n % 3 === 0 ? ['555-010-0000'] : [] });
  const score = Math.min(150, base.score + (n % 4) * 6);
  return {
    id: newId('candidate'),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    source: job.source,
    cityId: job.cityId,
    query: job.query,
    title,
    url: `https://${domainFromQuery(job.query)}-${n}.example.com`,
    domain: `${domainFromQuery(job.query)}-${n}.example.com`,
    snippet,
    emails: n % 2 === 0 ? [`lead${n}@example.com`] : [],
    phones: n % 3 === 0 ? ['555-010-0000'] : [],
    socials: [],
    score,
    funnel,
    status: score >= 60 ? 'review' : 'new',
    fitReasons: base.reasons,
    riskFlags: base.riskFlags,
    assignedRoles: assignmentsForFunnel(funnel),
    nextBestAction: score >= 60 ? 'Build action-center recommendation and tracked short link.' : 'Keep enriching before outreach.',
  };
}

export function startContinuousSwarm(args?: { maxPerCity?: number }) {
  const store = loadLeadEngineStore();
  const jobs = makeSwarmJobs({ cityIds: store.settings.cities, sourceIds: store.settings.sources, maxPerCity: args?.maxPerCity ?? 60 });
  const accepted = addSwarmJobs(jobs);
  addLeadEngineEvent('swarm_started', `Started continuous swarm with ${accepted.length} queued jobs.`, { meta: { accepted: accepted.length } });
  return accepted;
}

export function runLocalSwarmTick(args?: { maxJobs?: number; simulateOnly?: boolean }) {
  const store = loadLeadEngineStore();
  const maxJobs = Math.max(1, args?.maxJobs ?? store.settings.maxJobsPerTick ?? 10);
  const jobs = getNextQueuedJobs(maxJobs);
  const candidates: LeadIntelCandidate[] = [];
  for (const job of jobs) {
    const running = upsertSwarmJob({ ...job, status: 'running', startedAt: job.startedAt ?? nowIso(), progressPct: Math.max(20, job.progressPct), notes: [`Running ${findSource(job.source).label}`, ...job.notes] });
    const count = Math.min(running.resultLimit, 3 + (running.query.length % 5));
    const made = Array.from({ length: count }, (_, n) => makeDemoCandidate(running, n));
    candidates.push(...made);
    const hot = made.filter((c) => c.score >= 60).length;
    upsertSwarmJob({ ...running, status: 'done', finishedAt: nowIso(), progressPct: 100, discovered: count, enriched: count, hot, imported: 0, notes: [`Completed local tick with ${count} demo candidates.`, ...running.notes] });
    addLeadEngineEvent('job_progress', `${findCity(job.cityId).label}: ${findSource(job.source).label} discovered ${count}, hot ${hot}.`, { cityId: job.cityId, source: job.source, meta: { jobId: job.id, count, hot } });
  }
  const saved = bulkUpsertCandidates(candidates);
  return { jobsProcessed: jobs.length, candidates: saved };
}

export function summarizeSwarmStatus() {
  const store = loadLeadEngineStore();
  const queued = store.jobs.filter((j) => j.status === 'queued').length;
  const running = store.jobs.filter((j) => j.status === 'running').length;
  const done = store.jobs.filter((j) => j.status === 'done').length;
  const hot = store.candidates.filter((c) => c.score >= 60).length;
  return {
    queued,
    running,
    done,
    candidates: store.candidates.length,
    hot,
    actionBacklog: store.actions.filter((a) => a.approvalStatus === 'draft').length,
    message: queued || running ? `Swarm active: ${queued} queued, ${running} running.` : 'Swarm is idle. Start continuous swarm.',
  };
}
