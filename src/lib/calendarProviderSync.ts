/**
 * J1 — Google Calendar / Outlook sync adapter layer (evaluation deliverable).
 *
 * Builds on the Wave 3 server-side calendar foundation: `calendar_events`
 * (supabase/migrations/20260814100000_calendar_events_server.sql) is the
 * source of truth this module would push to / reconcile against once a real
 * provider adapter exists. See
 * `docs/planning/round3_final_phases_K_L_H_I_J.md` (Phase J, J1) for the full
 * evaluation and `src/domain/calendarProviderConnection.ts` for the schema.
 *
 * Every adapter below is a no-op stub — there is no OAuth app registered
 * with Google or Microsoft, so nothing here calls a real API. The point of
 * this file is the *interface*: `pushEvent()` / `pullBusyBlocks()` are the
 * two operations a real adapter needs (one-way Finely→external push first,
 * per the evaluation's recommendation — see this file's header note below on
 * why two-way sync is out of scope for the stub pass). When real credentials
 * land, replace `notConfiguredAdapter(...)` for a provider with a real
 * implementation (e.g. a new `googleCalendarAdapter.ts` that calls the
 * Google Calendar API through a Supabase Edge Function using the token
 * stored in `calendar_provider_connections`) — every caller in this file
 * (and any future caller in `suggestBookingSlots.ts` / the booking flow)
 * keeps working unchanged, because the adapter's shape does not change.
 *
 * Fails closed by design: `isFeatureEnabled('calendarExternalSync')` being
 * false (the default) short-circuits every sync function before the adapter
 * is even consulted, and the stub adapters themselves also always report
 * "not configured" regardless of the flag — so flipping the flag on today
 * changes zero runtime behavior beyond revealing the "coming soon" admin UI
 * affordance in `CalendarSettingsPanel.tsx`.
 */
import { isFeatureEnabled } from '../data/settingsRepo';
import type { CalendarEvent } from '../domain/calendar';
import type {
  CalendarProviderConnectionSummary,
  CalendarProviderKind,
  ExternalBusyBlock,
  ExternalCalendarPushResult,
} from '../domain/calendarProviderConnection';

export interface CalendarProviderAdapter {
  readonly provider: CalendarProviderKind;
  /** Human label for admin UI (e.g. "Google Calendar"). */
  readonly label: string;
  /**
   * Push (create/update) a Finely `CalendarEvent` to the connected external
   * calendar. One-way Finely→external only — the evaluation's recommended
   * first slice; two-way (external edits flowing back into `calendar_events`)
   * would need a webhook/polling reconciliation step this stub does not model.
   */
  pushEvent(connection: CalendarProviderConnectionSummary, event: CalendarEvent): Promise<ExternalCalendarPushResult>;
  /**
   * Pull free/busy blocks for a date range so a future revision of
   * `suggestBookingSlots.ts` can avoid recommending a slot that's free in
   * Finely but already booked on the partner's/admin's real calendar.
   */
  pullBusyBlocks(
    connection: CalendarProviderConnectionSummary,
    range: { fromIso: string; toIso: string },
  ): Promise<ExternalBusyBlock[]>;
}

function notConfiguredAdapter(provider: CalendarProviderKind, label: string): CalendarProviderAdapter {
  return {
    provider,
    label,
    async pushEvent() {
      return {
        ok: false,
        reason: 'not_configured',
        detail: `${label} sync has no live OAuth credentials configured yet.`,
      };
    },
    async pullBusyBlocks() {
      return [];
    },
  };
}

const STUB_ADAPTERS: Record<CalendarProviderKind, CalendarProviderAdapter> = {
  google: notConfiguredAdapter('google', 'Google Calendar'),
  microsoft: notConfiguredAdapter('microsoft', 'Outlook / Microsoft 365'),
};

/**
 * Returns the adapter for a provider. Swap a provider's stub for a real
 * implementation here once OAuth credentials exist — this is the single
 * seam every caller (below, and any future booking-flow caller) goes
 * through, so no call site needs to change when that happens.
 */
export function getCalendarProviderAdapter(provider: CalendarProviderKind): CalendarProviderAdapter {
  return STUB_ADAPTERS[provider];
}

export function isCalendarExternalSyncEnabled(): boolean {
  return isFeatureEnabled('calendarExternalSync');
}

/** Best-effort — call after a `calendar_events` create/update/status write. Never throws. */
export async function pushCalendarEventExternally(
  connection: CalendarProviderConnectionSummary,
  event: CalendarEvent,
): Promise<ExternalCalendarPushResult> {
  if (!isCalendarExternalSyncEnabled()) return { ok: false, reason: 'feature_disabled' };
  try {
    return await getCalendarProviderAdapter(connection.provider).pushEvent(connection, event);
  } catch (err: unknown) {
    return { ok: false, reason: 'provider_error', detail: (err as Error)?.message ?? String(err) };
  }
}

/** Never throws — an empty array means "no external busy data available," not an error. */
export async function pullExternalBusyBlocks(
  connection: CalendarProviderConnectionSummary,
  range: { fromIso: string; toIso: string },
): Promise<ExternalBusyBlock[]> {
  if (!isCalendarExternalSyncEnabled()) return [];
  try {
    return await getCalendarProviderAdapter(connection.provider).pullBusyBlocks(connection, range);
  } catch {
    return [];
  }
}

export type CalendarProviderPreviewStatus = {
  provider: CalendarProviderKind;
  label: string;
  status: 'coming_soon';
};

/**
 * Compact status list for the admin "coming soon" affordance
 * (`CalendarSettingsPanel.tsx`). Safe to call regardless of the feature flag
 * or whether any connection exists — always returns the same static preview
 * today, since every adapter is a stub.
 */
export function getCalendarExternalSyncPreviewStatus(): CalendarProviderPreviewStatus[] {
  return (Object.keys(STUB_ADAPTERS) as CalendarProviderKind[]).map((provider) => ({
    provider,
    label: STUB_ADAPTERS[provider].label,
    status: 'coming_soon' as const,
  }));
}
