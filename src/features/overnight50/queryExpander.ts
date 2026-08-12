import type { LeadIntelSourceId, OvernightCity } from './types';
import {
  getDailyMetroShardPack,
  getQueryModifierMetros,
  metroShortLabel,
  US_METRO_SHARD_CITIES,
} from '../marketingDesk/usMetroShardMap';

/** @deprecated use US_METRO_SHARD_CITIES — kept for imports; first 5 legacy seeds. */
export const DEFAULT_OVERNIGHT50_CITIES = US_METRO_SHARD_CITIES.slice(8, 13).map((c) =>
  metroShortLabel(c),
) as unknown as readonly ['Dallas', 'Houston', 'Atlanta', 'Phoenix', 'Charlotte'];

const serviceIntents = ["credit repair help", "fix credit score consultation", "business credit funding readiness", "authorized user tradeline seller", "credit specialist remote role", "agency partner credit repair", "affiliate credit repair program", "business funding partner", "dispute letter help", "credit monitoring help", "debt collection validation", "startup funding readiness"] as const;

const STATIC_MODIFIERS = ["near me", "today", "consultation", "guide", "checklist", "help", "apply", "remote", "partner program", "free", "best", "local", "urgent", "how to", "looking for"] as const;

function buildModifiers(date?: Date): string[] {
  const geoMods = getQueryModifierMetros(8, date);
  return [...STATIC_MODIFIERS, ...geoMods];
}

export type QueryPlan = { id: string; city: OvernightCity; sourceId: LeadIntelSourceId; query: string; priority: number; reason: string };

function stableHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h).toString(36);
}

export function buildQueryPool(args?: {
  cities?: OvernightCity[];
  sourceIds?: LeadIntelSourceId[];
  limit?: number;
  /** When set, rotates geo modifiers + default city pack for that day. */
  date?: Date;
}): QueryPlan[] {
  const date = args?.date;
  const defaultCities = getDailyMetroShardPack({ date, packSize: 12 }).map((c) => metroShortLabel(c));
  const cities = args?.cities?.length ? args.cities : defaultCities;
  const modifiers = buildModifiers(date);
  const sourceIds: LeadIntelSourceId[] = args?.sourceIds?.length ? args.sourceIds : ['serper_web','serper_places','reddit_geo','craigslist_services','review_sites','dead_lead_revival','affiliate_referral_loop'];
  const out: QueryPlan[] = [];
  for (const city of cities) {
    for (const sourceId of sourceIds) {
      for (const intent of serviceIntents) {
        for (const mod of modifiers) {
          const query = `${city} ${intent} ${mod}`.replace(/\s+/g, ' ').trim();
          out.push({ id: `q_${stableHash(`${sourceId}:${query}`)}`, city, sourceId, query, priority: intent.includes('consultation') || intent.includes('apply') ? 90 : 50, reason: 'geo intent + metro shard rotation' });
        }
      }
    }
  }
  const sorted = out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return typeof args?.limit === 'number' ? sorted.slice(0, Math.max(1, args.limit)) : sorted;
}
