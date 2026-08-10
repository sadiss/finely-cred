import { HUNT_LANE_PRESETS } from '../leadIntel/leadEngineAutonomy';
import { getMarketingFindGeo } from '../marketingDesk/marketingDeskHunt';
import { loadJson, saveJson } from '../../data/localJsonStore';
import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import { GROWTH_AGENT_WAVE0_LANE } from './growthAgentRegistry';

const KEY = 'finely.growth_week_focus.v1';

export type GrowthWeekFocus = {
  lane: LeadEngineLane;
  laneLabel: string;
  city: string;
  ctaPath: string;
  /** Content Studio promote → Hannah video attribution key (resource or command id). */
  pillarVideoId?: string;
  updatedAt: string;
};

export function getGrowthWeekFocus(): GrowthWeekFocus {
  const raw = loadJson<Partial<GrowthWeekFocus>>(KEY, {}, 1);
  const lane = (raw.lane as LeadEngineLane) || GROWTH_AGENT_WAVE0_LANE;
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === lane) || HUNT_LANE_PRESETS[1]!;
  return {
    lane,
    laneLabel: raw.laneLabel || preset.shortLabel,
    city: (raw.city || getMarketingFindGeo()).trim() || 'United States',
    ctaPath: raw.ctaPath || '/enlightenment-session',
    pillarVideoId: raw.pillarVideoId?.trim() || undefined,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function setGrowthWeekFocus(patch: Partial<Omit<GrowthWeekFocus, 'updatedAt'>>) {
  const prev = getGrowthWeekFocus();
  const lane = patch.lane ?? prev.lane;
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === lane);
  saveJson(
    KEY,
    {
      lane,
      laneLabel: patch.laneLabel ?? preset?.shortLabel ?? prev.laneLabel,
      city: (patch.city ?? prev.city).trim(),
      ctaPath: patch.ctaPath ?? prev.ctaPath,
      pillarVideoId: patch.pillarVideoId !== undefined ? patch.pillarVideoId?.trim() || undefined : prev.pillarVideoId,
      updatedAt: new Date().toISOString(),
    },
    1,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}
