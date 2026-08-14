/**
 * J1 — Google Calendar / Outlook sync groundwork (evaluation deliverable).
 *
 * These types describe how an admin's or partner's external calendar account
 * would be linked to Finely Cred's server-side `calendar_events` table (see
 * `supabase/migrations/20260814100000_calendar_events_server.sql` and
 * `src/data/calendarServerSync.ts` — the Wave 3 server-side calendar
 * foundation this feature builds on top of).
 *
 * No OAuth app is registered with Google or Microsoft yet, so nothing here is
 * wired to a live provider. This file exists so the schema/interface shape is
 * settled and ready for a future pass to drop real credentials into — see
 * `src/lib/calendarProviderSync.ts` for the adapter layer and
 * `docs/planning/round3_final_phases_K_L_H_I_J.md` (Phase J, J1) for the
 * evaluation this groundwork is based on.
 */

export type CalendarProviderKind = 'google' | 'microsoft';

export type CalendarProviderConnectionStatus = 'not_connected' | 'connected' | 'expired' | 'error';

/** Who connected the external calendar — an admin/staff seat or a specific partner. */
export type CalendarProviderConnectionOwnerKind = 'admin' | 'partner';

/**
 * Row shape for the `calendar_provider_connections` Supabase table (see
 * migration `20260814140000_calendar_provider_connections.sql`). OAuth tokens
 * belong server-side only, written by a future OAuth callback edge function
 * (the same pattern `meta-oauth` already uses for `meta_connections` —
 * see `src/pages/admin/AdminSocialHubPage.tsx`'s Meta OAuth flow for the
 * precedent to follow). The client should never read `accessToken` /
 * `refreshToken` directly — use `CalendarProviderConnectionSummary` instead.
 */
export type CalendarProviderConnectionRecord = {
  id: string;
  tenantId: string;
  ownerKind: CalendarProviderConnectionOwnerKind;
  /** Admin/staff id, or partnerId when ownerKind === 'partner'. */
  ownerId: string;
  provider: CalendarProviderKind;
  status: CalendarProviderConnectionStatus;
  externalAccountEmail?: string;
  /** Server-side only — never sent to the client. */
  accessToken?: string;
  /** Server-side only — never sent to the client. */
  refreshToken?: string;
  scope?: string;
  tokenExpiresAt?: string;
  lastSyncedAt?: string;
  lastSyncError?: string;
  createdAt: string;
  updatedAt: string;
};

/** Client-safe projection — everything except token material. */
export type CalendarProviderConnectionSummary = Pick<
  CalendarProviderConnectionRecord,
  'id' | 'tenantId' | 'ownerKind' | 'ownerId' | 'provider' | 'status' | 'externalAccountEmail' | 'lastSyncedAt' | 'lastSyncError'
>;

/** A single busy window pulled from an external calendar's free/busy API. */
export type ExternalBusyBlock = {
  startAt: string; // ISO
  endAt: string; // ISO
};

export type ExternalCalendarPushResult =
  | { ok: true; externalEventId: string }
  | { ok: false; reason: 'not_configured' | 'feature_disabled' | 'provider_error'; detail?: string };

export function nowIso() {
  return new Date().toISOString();
}
