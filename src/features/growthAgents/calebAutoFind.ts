/**
 * Caleb auto-find — default ON; turn off to stop scheduled + auto daily pack.
 * Subagent pipeline: GeoScanner → Qualifier → Enricher → Handoff.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';
import { updateFeatureFlags, getFeatureFlags } from '../../data/settingsRepo';
import {
  getMarketingFindLastRun,
  getMarketingFindReadiness,
  getMarketingMetroShardSummary,
  runMarketingDailyPack,
  runMarketingHuntTick,
  setMarketingFindGeo,
  setMarketingFindSchedule,
  startMarketingHuntScheduler,
  stopMarketingHuntScheduler,
  type MarketingFindResult,
} from '../marketingDesk/marketingDeskHunt';
import {
  getMetroShardRotationMeta,
  resolveMarketingHuntLocation,
} from '../marketingDesk/usMetroShardMap';
import {
  listCalebSubagentWorkers,
  type CalebSubagentId,
  type CalebSubagentWorker,
} from './growthAgentRegistry';
import { runGrowthFindTestSearch } from './growthFindTest';
import { runGrowthWorkerTickTest } from './growthWorkerTick';
import { runCalebHandoffRouterForProspects } from './subagents/calebReasoningSubagents';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

const AUTO_KEY = 'finely.caleb.auto_find.v1';
const COLD_OUTBOUND_KEY = 'finely.caleb.cold_outbound_autopilot.v1';
const SESSION_BOOT_KEY = 'finely.caleb.auto_session_boot.v1';
const SUBAGENT_KEY = 'finely.caleb.subagent_status.v1';

export type CalebSubagentStatus = {
  id: CalebSubagentId;
  label: string;
  lastAt?: string;
  lastMessage?: string;
  ok?: boolean;
};

export type CalebPipelineResult = MarketingFindResult & {
  subagents: CalebSubagentStatus[];
  location: string;
  shardSummary: string;
};

function dispatchStore() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

function isSameLocalDay(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    Number.isFinite(d.getTime()) &&
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

/** Default true — owner turns off explicitly. */
export function isCalebAutoFindEnabled(): boolean {
  const raw = loadJson<{ enabled?: boolean }>(AUTO_KEY, {}, 1);
  if (raw.enabled === undefined) return true;
  return Boolean(raw.enabled);
}

export function setCalebAutoFindEnabled(enabled: boolean, location?: string) {
  saveJson(AUTO_KEY, { enabled, updatedAt: new Date().toISOString() }, 1);
  const loc = resolveMarketingHuntLocation(location);
  setMarketingFindSchedule(enabled, loc);
  if (enabled) {
    setMarketingFindGeo(loc);
    if (typeof window !== 'undefined') startMarketingHuntScheduler();
  } else if (typeof window !== 'undefined') {
    stopMarketingHuntScheduler();
  }
  dispatchStore();
}

export function listCalebSubagents(): CalebSubagentWorker[] {
  return listCalebSubagentWorkers();
}

export function getCalebSubagentStatuses(): CalebSubagentStatus[] {
  const stored = loadJson<{ rows?: CalebSubagentStatus[] }>(SUBAGENT_KEY, {}, 1);
  const byId = new Map((stored.rows ?? []).map((r) => [r.id, r]));
  return listCalebSubagentWorkers().map((w) => ({
    id: w.id,
    label: w.label,
    lastAt: byId.get(w.id)?.lastAt,
    lastMessage: byId.get(w.id)?.lastMessage,
    ok: byId.get(w.id)?.ok,
  }));
}

function persistSubagentStatus(id: CalebSubagentId, message: string, ok: boolean) {
  const workers = listCalebSubagentWorkers();
  const prev = getCalebSubagentStatuses();
  const next = workers.map((w) => {
    if (w.id !== id) {
      const p = prev.find((r) => r.id === w.id);
      return p ?? { id: w.id, label: w.label };
    }
    return { id, label: w.label, lastAt: new Date().toISOString(), lastMessage: message, ok };
  });
  saveJson(SUBAGENT_KEY, { rows: next }, 1);
  dispatchStore();
}

/** Run Caleb subagent pipeline for one daily pack cycle. */
export async function runCalebSubagentPipeline(city?: string): Promise<CalebPipelineResult | null> {
  if (!isCalebAutoFindEnabled()) return null;
  ensureCalebFeatureFlags();
  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) return null;

  const location = resolveMarketingHuntLocation(city);
  const shardSummary = getMarketingMetroShardSummary();

  persistSubagentStatus('geo_scanner', `Scanning ${location} · ${shardSummary}`, true);
  setMarketingFindGeo(location);

  const aiReasoningAvailable = isFeatureEnabled('aiGateway') && isSupabaseConfigured;
  persistSubagentStatus(
    'qualifier',
    aiReasoningAvailable
      ? 'AI-gateway reasoning active on mid-band hits (≥70 auto · mid review)'
      : 'Deterministic thresholds only — AI Gateway off, reasoning falls back to score bands',
    true,
  );

  const pack = await runMarketingDailyPack({ location, mode: 'daily_pack' });

  persistSubagentStatus(
    'enricher',
    pack.found > 0
      ? `Enriched ${pack.found} live Serper hit(s) for ${location}`
      : 'No new hits — enrich idle',
    pack.found > 0 || !pack.error,
  );

  const lastRun = getMarketingFindLastRun();
  let routedCount = 0;
  if (lastRun?.prospectIds?.length) {
    try {
      const routed = await runCalebHandoffRouterForProspects(lastRun.prospectIds);
      routedCount = routed.filter((r) => r.routedToAlex).length;
    } catch {
      // non-blocking — handoff routing failure should never break the find pipeline
    }
  }

  persistSubagentStatus(
    'handoff',
    pack.autoSaved > 0 || pack.review > 0
      ? `${pack.autoSaved} auto-saved · ${pack.review} in review queue${routedCount > 0 ? ` · ${routedCount} routed to Alex now` : ''}`
      : 'Review queue unchanged',
    !pack.error,
  );

  return {
    ...pack,
    subagents: getCalebSubagentStatuses(),
    location,
    shardSummary,
  };
}

/** Default false — owner must turn on before seq_cold_prospect autopilot enrolls. */
export function isColdOutboundAutopilotEnabled(): boolean {
  return Boolean(loadJson<{ enabled?: boolean }>(COLD_OUTBOUND_KEY, {}, 1).enabled);
}

export function setColdOutboundAutopilotEnabled(enabled: boolean) {
  saveJson(COLD_OUTBOUND_KEY, { enabled, updatedAt: new Date().toISOString() }, 1);
  dispatchStore();
}

/** Turn on Find flags in-app so Caleb is not blocked by defaults. */
export function ensureCalebFeatureFlags(): boolean {
  const flags = getFeatureFlags();
  if (flags.marketingDesk && flags.leadIntel) return false;
  updateFeatureFlags({
    marketingDesk: true,
    leadIntel: true,
  });
  dispatchStore();
  return true;
}

/** Blocks auto re-runs only — empty daily_pack no longer blocks manual retries. */
function alreadyRanAutoFindToday(): boolean {
  const last = getMarketingFindLastRun();
  if (!last?.at || !isSameLocalDay(last.at)) return false;
  if (last.errors?.[0]) return false;
  if (last.found > 0 || last.autoSaved > 0 || (last.review ?? 0) > 0) return true;
  if (last.mode === 'scheduled') return true;
  // Empty daily_pack: allow auto retry later same day (Serper may have been down).
  if (last.mode === 'daily_pack' && last.found === 0 && (last.autoSaved ?? 0) === 0) return false;
  return last.mode === 'daily_pack';
}

let bootstrapInFlight: Promise<void> | null = null;

/** Once per browser session: worker probe + search test when auto is on. */
export async function bootstrapCalebAutoSession(): Promise<void> {
  if (!isCalebAutoFindEnabled()) return;
  if (typeof window === 'undefined') return;
  const sessionKey = `${SESSION_BOOT_KEY}::${new Date().toISOString().slice(0, 10)}`;
  if (sessionStorage.getItem(sessionKey) === '1') return;
  if (bootstrapInFlight) return bootstrapInFlight;

  bootstrapInFlight = (async () => {
    ensureCalebFeatureFlags();
    const readiness = getMarketingFindReadiness();
    if (!readiness.ready) return;
    void runGrowthWorkerTickTest();
    if (!alreadyRanAutoFindToday()) {
      await runGrowthFindTestSearch();
    }
    sessionStorage.setItem(sessionKey, '1');
  })().finally(() => {
    bootstrapInFlight = null;
  });

  return bootstrapInFlight;
}

export type CalebAutoFindOptions = {
  /** Skip the once-per-day auto gate (manual Run / toggle-on). */
  force?: boolean;
};

/** Daily pack when auto on and not yet run today (unless force). */
export async function runCalebAutoFindIfDue(
  city: string,
  opts?: CalebAutoFindOptions,
): Promise<MarketingFindResult | null> {
  if (!isCalebAutoFindEnabled()) return null;
  ensureCalebFeatureFlags();
  await bootstrapCalebAutoSession();
  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) return null;
  if (!opts?.force && alreadyRanAutoFindToday()) return null;
  const location = resolveMarketingHuntLocation(city);
  setMarketingFindGeo(location);
  setMarketingFindSchedule(true, location);
  if (typeof window !== 'undefined') startMarketingHuntScheduler();
  void runMarketingHuntTick();
  const pipeline = await runCalebSubagentPipeline(location);
  return pipeline;
}

export function calebAutoStatusLine(): string {
  if (!isCalebAutoFindEnabled()) return 'Auto-find is off — turn on to run daily pack for you.';
  const readiness = getMarketingFindReadiness();
  const meta = getMetroShardRotationMeta();
  const shard = meta.citiesToday.map((c) => c.split(',')[0]).slice(0, 3).join(', ');
  if (!readiness.ready) return 'Auto-find is on — finishing one-time setup (flags + Supabase).';
  if (alreadyRanAutoFindToday()) {
    const last = getMarketingFindLastRun();
    if (last && last.found === 0 && !last.errors?.[0]) {
      return `Auto-find is on — today's pack found 0 (${shard}…). Use Find once now or Test search to retry.`;
    }
    return `Auto-find is on — today's pack ran (${shard}…). Review people or wait until tomorrow.`;
  }
  return `Auto-find is on — Caleb rotates ${meta.poolSize} metros (today: ${shard}…). Geo Scanner → Qualifier → Enricher → Handoff.`;
}
