/**
 * Lane performance chips — found → booked rates from CRM tags (max 3).
 */
import { listProspects } from '../../data/crmProspectsRepo';
import { listCrmRecords } from '../../data/crmRecordsRepo';
import { HUNT_LANE_PRESETS, type LeadEngineLane } from '../leadIntel/leadEngineAutonomy';

const LANE_IDS: LeadEngineLane[] = [
  'business_credit',
  'credit_restore',
  'debt',
  'agency_affiliates',
  'local_service',
  'funded_business',
];

export type MarketingLanePerfChip = {
  lane: LeadEngineLane;
  label: string;
  found: number;
  booked: number;
  /** 0–100 found→booked */
  ratePct: number;
};

function withinDays(iso: string, days: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 86400000;
}

function laneFromTags(tags: string[] | undefined): LeadEngineLane | null {
  for (const id of LANE_IDS) {
    if (tags?.includes(id)) return id;
  }
  return null;
}

function isDeskTagged(tags: string[] | undefined): boolean {
  return Boolean(
    tags?.some((t) => t === 'marketing-desk' || t === 'lead-engine' || t === 'lead-intel' || t === 'lead_engine'),
  );
}

function shortLabel(lane: LeadEngineLane): string {
  return HUNT_LANE_PRESETS.find((p) => p.id === lane)?.shortLabel || lane.replace(/_/g, ' ');
}

/**
 * Top lane found→booked chips (≤3). Uses 30d Desk/engine prospects + inbound Board.
 * Quiet when volume is zero — callers should hide empty lists.
 */
export function getMarketingLanePerformanceChips(limit = 3): MarketingLanePerfChip[] {
  const days = 30;
  const foundBy: Record<string, number> = {};
  const bookedBy: Record<string, number> = {};
  for (const id of LANE_IDS) {
    foundBy[id] = 0;
    bookedBy[id] = 0;
  }

  for (const p of listProspects()) {
    if (!isDeskTagged(p.tags)) continue;
    if (!withinDays(p.createdAt, days)) continue;
    const lane = laneFromTags(p.tags);
    if (!lane) continue;
    foundBy[lane] += 1;
    if (p.stage === 'booked' || p.stage === 'converted') bookedBy[lane] += 1;
  }

  for (const r of listCrmRecords({ kind: 'inbound_lead' })) {
    if (!withinDays(r.createdAt || r.updatedAt, days)) continue;
    const lane = laneFromTags(r.tags);
    if (!lane) continue;
    // Inbound without engine tags still count when lane tag present
    foundBy[lane] += 1;
    if (r.stage === 'booked' || r.stage === 'won') bookedBy[lane] += 1;
  }

  const chips: MarketingLanePerfChip[] = LANE_IDS.map((lane) => {
    const found = foundBy[lane] || 0;
    const booked = bookedBy[lane] || 0;
    const ratePct = found > 0 ? Math.round((booked / found) * 100) : 0;
    return { lane, label: shortLabel(lane), found, booked, ratePct };
  })
    .filter((c) => c.found > 0)
    .sort((a, b) => b.ratePct - a.ratePct || b.booked - a.booked || b.found - a.found)
    .slice(0, Math.min(3, Math.max(0, limit)));

  return chips;
}
