/**
 * Ruth weekly lane tip — one plain-English chip from lane pace (max 1).
 * Stable for the ISO week so Desk home / Ruth don’t flicker.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';
import { getMarketingFindGeo } from './marketingDeskHunt';
import { getMarketingLanePerformanceChips } from './marketingDeskLanePerformance';

const TIP_KEY = 'finely.marketing_desk_ruth_lane_tip.v1';

export type RuthWeeklyLaneTip = {
  tip: string;
  laneLabel: string;
  weekKey: string;
};

function isoWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

type StoredTip = { weekKey: string; tip: string; laneLabel: string };

/**
 * One tip chip for the current week from found→booked pace.
 * Quiet when there is no lane volume yet.
 */
export function getRuthWeeklyLaneTip(): RuthWeeklyLaneTip | null {
  const weekKey = isoWeekKey();
  const cached = loadJson<StoredTip | null>(TIP_KEY, null, 1);
  if (cached?.weekKey === weekKey && cached.tip) {
    return { tip: cached.tip, laneLabel: cached.laneLabel, weekKey };
  }

  const chips = getMarketingLanePerformanceChips(3);
  if (!chips.length) return null;

  const geo = getMarketingFindGeo().trim() || 'your area';
  const top = chips[0];
  const lag = [...chips].sort((a, b) => a.ratePct - b.ratePct || b.found - a.found)[0];

  let tip: string;
  let laneLabel: string;
  if (top.booked > 0 && top.ratePct >= 10) {
    tip = `This week lean ${top.label} near ${geo} — it’s booking best (${top.ratePct}%).`;
    laneLabel = top.label;
  } else if (lag && lag.found >= 3 && lag.ratePct < top.ratePct) {
    tip = `${lag.label} has volume but few books — try a tighter geo or Ruth’s book chip on the best fit.`;
    laneLabel = lag.label;
  } else {
    tip = `Keep Find on ${top.label} this week — most volume, then clear exceptions only.`;
    laneLabel = top.label;
  }

  const next: StoredTip = { weekKey, tip, laneLabel };
  saveJson(TIP_KEY, next, 1);
  return { tip, laneLabel, weekKey };
}
