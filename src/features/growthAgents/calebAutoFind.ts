/**
 * Caleb auto-find — default ON; turn off to stop scheduled + auto daily pack.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';
import { updateFeatureFlags, getFeatureFlags } from '../../data/settingsRepo';
import {
  getMarketingFindLastRun,
  getMarketingFindGeo,
  getMarketingFindReadiness,
  runMarketingDailyPack,
  setMarketingFindGeo,
  setMarketingFindSchedule,
  type MarketingFindResult,
} from '../marketingDesk/marketingDeskHunt';
import { runGrowthFindTestSearch } from './growthFindTest';
import { runGrowthWorkerTickTest } from './growthWorkerTick';

const AUTO_KEY = 'finely.caleb.auto_find.v1';
const COLD_OUTBOUND_KEY = 'finely.caleb.cold_outbound_autopilot.v1';
const SESSION_BOOT_KEY = 'finely.caleb.auto_session_boot.v1';

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
  const loc = (location || getMarketingFindGeo()).trim() || 'United States';
  setMarketingFindSchedule(enabled, loc);
  if (enabled) setMarketingFindGeo(loc);
  dispatchStore();
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

function alreadyRanFindToday(): boolean {
  const last = getMarketingFindLastRun();
  if (!last?.at || !isSameLocalDay(last.at)) return false;
  if (last.errors?.[0]) return false;
  return last.found > 0 || last.autoSaved > 0 || last.mode === 'daily_pack' || last.mode === 'scheduled';
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
    if (!alreadyRanFindToday()) {
      await runGrowthFindTestSearch();
    }
    sessionStorage.setItem(sessionKey, '1');
  })().finally(() => {
    bootstrapInFlight = null;
  });

  return bootstrapInFlight;
}

/** Daily pack when auto on and not yet run today. */
export async function runCalebAutoFindIfDue(city: string): Promise<MarketingFindResult | null> {
  if (!isCalebAutoFindEnabled()) return null;
  ensureCalebFeatureFlags();
  await bootstrapCalebAutoSession();
  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) return null;
  if (alreadyRanFindToday()) return null;
  const location = (city || getMarketingFindGeo()).trim() || 'United States';
  setMarketingFindGeo(location);
  setMarketingFindSchedule(true, location);
  return runMarketingDailyPack({ location, mode: 'daily_pack' });
}

export function calebAutoStatusLine(): string {
  if (!isCalebAutoFindEnabled()) return 'Auto-find is off — turn on to run daily pack for you.';
  const readiness = getMarketingFindReadiness();
  if (!readiness.ready) return 'Auto-find is on — finishing one-time setup (flags + Supabase).';
  if (alreadyRanFindToday()) return 'Auto-find is on — today’s pack already ran. Review people or wait until tomorrow.';
  return 'Auto-find is on — Caleb runs the daily pack and overnight find while you work.';
}
