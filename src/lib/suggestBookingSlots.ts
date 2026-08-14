import type { BookableSlot } from './calendarSlots';
import type { LeadScoreBand } from './leadScoring';

export type BookingUrgencySignal = {
  /** Warm/hot/qualified lead score band, when a CRM record is already available. */
  band?: LeadScoreBand;
  /** Free-text urgency signal — timeline field, goal text, funnel copy, etc. */
  urgencyText?: string;
};

const URGENT_WORDS = ['asap', 'urgent', 'immediately', 'today', 'this week', 'right away', 'summons', 'court', 'deadline'];

/** Lightweight heuristic — no ML call, just recency/urgency/lane signals already on hand. */
export function isUrgentSignal(signal?: BookingUrgencySignal): boolean {
  if (!signal) return false;
  if (signal.band === 'qualified' || signal.band === 'hot') return true;
  const text = (signal.urgencyText || '').toLowerCase();
  return URGENT_WORDS.some((w) => text.includes(w));
}

/**
 * Marks the top 1–3 slots as "Recommended" out of a flat slot list (single day or
 * multi-day). Urgent/qualified signals bias toward the earliest opening; otherwise
 * we bias toward the historically highest-completion windows (mid-morning / early
 * afternoon) since those show the best call show-up rates.
 */
export function pickRecommendedSlots(slots: BookableSlot[], signal?: BookingUrgencySignal, max = 3): Set<string> {
  if (!slots.length) return new Set();

  const urgent = isUrgentSignal(signal);
  const scored = slots.map((slot) => {
    const d = new Date(slot.startAt);
    const hour = d.getHours() + d.getMinutes() / 60;
    // Sweet-spot score: peaks near 10:30am and 2:00pm, dips early morning/late evening.
    const sweetSpotScore = -Math.min(Math.abs(hour - 10.5), Math.abs(hour - 14));
    const soonScore = -d.getTime();
    return { slot, score: urgent ? soonScore : sweetSpotScore * 1_000_000_000 + soonScore };
  });

  scored.sort((a, b) => b.score - a.score);
  return new Set(scored.slice(0, max).map((s) => s.slot.startAt));
}
