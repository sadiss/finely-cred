/**
 * US metro shard map — nationwide lead scanning rotation for Marketing Desk / overnight50.
 * Replaces single "United States" hunts with a daily rotating city queue.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';

/** 60 major US metros — shard rotates daily / per pack. */
export const US_METRO_SHARD_CITIES = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'Fort Worth, TX',
  'Columbus, OH',
  'Charlotte, NC',
  'San Francisco, CA',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Washington, DC',
  'Boston, MA',
  'El Paso, TX',
  'Nashville, TN',
  'Detroit, MI',
  'Oklahoma City, OK',
  'Portland, OR',
  'Las Vegas, NV',
  'Memphis, TN',
  'Louisville, KY',
  'Baltimore, MD',
  'Milwaukee, WI',
  'Albuquerque, NM',
  'Tucson, AZ',
  'Fresno, CA',
  'Sacramento, CA',
  'Kansas City, MO',
  'Mesa, AZ',
  'Atlanta, GA',
  'Colorado Springs, CO',
  'Raleigh, NC',
  'Miami, FL',
  'Long Beach, CA',
  'Virginia Beach, VA',
  'Oakland, CA',
  'Minneapolis, MN',
  'Tampa, FL',
  'Tulsa, OK',
  'Arlington, TX',
  'New Orleans, LA',
  'Wichita, KS',
  'Cleveland, OH',
  'Bakersfield, CA',
  'Aurora, CO',
  'Anaheim, CA',
  'Honolulu, HI',
  'Santa Ana, CA',
  'Riverside, CA',
  'Corpus Christi, TX',
  'Lexington, KY',
  'Henderson, NV',
  'St. Louis, MO',
  'Cincinnati, OH',
] as const;

export type UsMetroShardCity = (typeof US_METRO_SHARD_CITIES)[number] | string;

/** Legacy overnight50 seed metros (subset). */
export const LEGACY_OVERNIGHT50_CITIES = US_METRO_SHARD_CITIES.slice(8, 13).map((c) =>
  c.split(',')[0]!.trim(),
);

export const METRO_SHARD_PACK_SIZE = 5;
export const METRO_HUNT_QUEUE_KEY = 'finely.marketing_metro_hunt_queue.v1';

const NATIONAL_FALLBACK = 'United States';

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function isNationalGeoFallback(location?: string | null): boolean {
  const loc = (location || '').trim().toLowerCase();
  return !loc || loc === 'united states' || loc === 'us' || loc === 'usa';
}

/** Daily rotating pack of metros (default 5) from the 60-city shard. */
export function getDailyMetroShardPack(opts?: {
  date?: Date;
  packSize?: number;
  shardOffset?: number;
}): UsMetroShardCity[] {
  const date = opts?.date ?? new Date();
  const packSize = Math.max(1, Math.min(METRO_SHARD_PACK_SIZE, opts?.packSize ?? METRO_SHARD_PACK_SIZE));
  const pool = US_METRO_SHARD_CITIES.length;
  const shardIndex =
    opts?.shardOffset ??
    Math.floor(dayOfYear(date) / packSize) % Math.ceil(pool / packSize);
  const start = (shardIndex * packSize) % pool;
  const out: UsMetroShardCity[] = [];
  for (let i = 0; i < packSize; i += 1) {
    out.push(US_METRO_SHARD_CITIES[(start + i) % pool]!);
  }
  return out;
}

export type MetroShardRotationMeta = {
  dayKey: string;
  shardIndex: number;
  packSize: number;
  poolSize: number;
  citiesToday: UsMetroShardCity[];
  primaryCity: UsMetroShardCity;
};

export function getMetroShardRotationMeta(date = new Date()): MetroShardRotationMeta {
  const citiesToday = getDailyMetroShardPack({ date });
  const packSize = citiesToday.length;
  const pool = US_METRO_SHARD_CITIES.length;
  const shardIndex = Math.floor(dayOfYear(date) / packSize) % Math.ceil(pool / packSize);
  return {
    dayKey: dayKey(date),
    shardIndex,
    packSize,
    poolSize: pool,
    citiesToday,
    primaryCity: citiesToday[0] ?? US_METRO_SHARD_CITIES[0]!,
  };
}

type HuntQueueStore = {
  dayKey?: string;
  cursor?: number;
  queue?: UsMetroShardCity[];
};

function loadHuntQueue(): HuntQueueStore {
  return loadJson<HuntQueueStore>(METRO_HUNT_QUEUE_KEY, {}, 1);
}

function saveHuntQueue(store: HuntQueueStore) {
  saveJson(METRO_HUNT_QUEUE_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

/** Advance city-queue cursor within today's shard pack. */
export function peekNextHuntMetro(): UsMetroShardCity {
  const meta = getMetroShardRotationMeta();
  const store = loadHuntQueue();
  if (store.dayKey !== meta.dayKey || !store.queue?.length) {
    return meta.primaryCity;
  }
  const idx = Math.max(0, store.cursor ?? 0) % store.queue.length;
  return store.queue[idx] ?? meta.primaryCity;
}

export function advanceHuntMetroQueue(): UsMetroShardCity {
  const meta = getMetroShardRotationMeta();
  const store = loadHuntQueue();
  let queue = store.queue;
  let cursor = store.cursor ?? 0;
  if (store.dayKey !== meta.dayKey || !queue?.length) {
    queue = [...meta.citiesToday];
    cursor = 0;
  }
  const city = queue[cursor % queue.length]!;
  saveHuntQueue({ dayKey: meta.dayKey, queue, cursor: (cursor + 1) % queue.length });
  return city;
}

/**
 * Resolve hunt location — explicit override wins; otherwise rotate city queue (not national).
 */
export function resolveMarketingHuntLocation(override?: string | null): UsMetroShardCity {
  const explicit = (override || '').trim();
  if (explicit && !isNationalGeoFallback(explicit)) return explicit;
  return peekNextHuntMetro();
}

/** Cities for a daily pack run — full shard when national/default, else single override. */
export function resolveDailyPackMetroTargets(override?: string | null): UsMetroShardCity[] {
  const explicit = (override || '').trim();
  if (explicit && !isNationalGeoFallback(explicit)) return [explicit];
  return getDailyMetroShardPack();
}

/** Short labels for UI chips (city name only). */
export function metroShortLabel(city: string): string {
  return city.split(',')[0]?.trim() || city;
}

/** Deterministic modifier cities for query expander (geo rotation without full pack). */
export function getQueryModifierMetros(limit = 8, date = new Date()): string[] {
  const pack = getDailyMetroShardPack({ date, packSize: limit });
  return pack.map(metroShortLabel);
}

export function metroShardSummaryLine(): string {
  const meta = getMetroShardRotationMeta();
  const names = meta.citiesToday.map(metroShortLabel).join(' · ');
  return `Shard ${meta.shardIndex + 1} · ${meta.poolSize} metros · today: ${names}`;
}

/** Edge / cron shard index for a given ISO timestamp. */
export function getMetroShardIndexForIso(iso?: string): number {
  const d = iso ? new Date(iso) : new Date();
  const packSize = METRO_SHARD_PACK_SIZE;
  return Math.floor(dayOfYear(d) / packSize) % Math.ceil(US_METRO_SHARD_CITIES.length / packSize);
}

export function getMetroForEdgeHuntTick(iso?: string): UsMetroShardCity {
  const d = iso ? new Date(iso) : new Date();
  return getDailyMetroShardPack({ date: d })[0] ?? US_METRO_SHARD_CITIES[0]!;
}

export { NATIONAL_FALLBACK, stableHash, dayKey };
