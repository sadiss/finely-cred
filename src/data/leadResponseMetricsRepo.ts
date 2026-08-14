/**
 * Time-to-first-touch KPI (Phase N2) — reads `lead_captures.created_at` vs.
 * `first_touch_at` (added by N1's migration) directly via Supabase. No new
 * RPC needed at this volume: a capped client-side scan of the most recent
 * acknowledged leads is sufficient.
 *
 * Raw reply/response rate is intentionally NOT computed here — the planning
 * pass confirmed no inbound-SMS capture path exists yet (`sourceAdapters.ts`'s
 * own notes for `sms_reply_capture` say so), so N2's first cut is scoped to
 * time-to-first-touch only, per the Round 3 spec.
 */
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export type LeadResponseMetrics = {
  dataSource: 'supabase' | 'unavailable';
  /** Leads considered in the average (had both created_at and first_touch_at). */
  sampleSize: number;
  avgTimeToFirstTouchMinutes: number | null;
  /** True when sampleSize is too small to be a meaningful average — show an honest empty state, not 0/NaN. */
  insufficientData: boolean;
  error?: string;
};

const MIN_SAMPLE_SIZE = 5;

function emptyMetrics(dataSource: LeadResponseMetrics['dataSource'], error?: string): LeadResponseMetrics {
  return { dataSource, sampleSize: 0, avgTimeToFirstTouchMinutes: null, insufficientData: true, error };
}

export async function pullLeadResponseMetrics(): Promise<LeadResponseMetrics> {
  if (!isSupabaseConfigured) return emptyMetrics('unavailable', 'Supabase not configured');

  try {
    const { data, error } = await supabase
      .from('lead_captures')
      .select('created_at, first_touch_at')
      .not('first_touch_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('[leadResponseMetricsRepo] Error pulling lead_captures:', error.message);
      return emptyMetrics('unavailable', error.message);
    }

    const rows = (data ?? []) as Array<{ created_at: string; first_touch_at: string | null }>;
    const deltasMinutes: number[] = [];
    for (const row of rows) {
      if (!row.first_touch_at) continue;
      const createdMs = Date.parse(row.created_at);
      const touchedMs = Date.parse(row.first_touch_at);
      if (!Number.isFinite(createdMs) || !Number.isFinite(touchedMs)) continue;
      const deltaMinutes = (touchedMs - createdMs) / 60_000;
      if (deltaMinutes >= 0) deltasMinutes.push(deltaMinutes);
    }

    const sampleSize = deltasMinutes.length;
    if (sampleSize < MIN_SAMPLE_SIZE) {
      return { dataSource: 'supabase', sampleSize, avgTimeToFirstTouchMinutes: null, insufficientData: true };
    }

    const avg = deltasMinutes.reduce((acc, v) => acc + v, 0) / sampleSize;
    return {
      dataSource: 'supabase',
      sampleSize,
      avgTimeToFirstTouchMinutes: Math.round(avg * 10) / 10,
      insufficientData: false,
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message ?? String(err);
    console.warn('[leadResponseMetricsRepo] Unexpected error:', message);
    return emptyMetrics('unavailable', message);
  }
}
