-- Phase J1 — Google Calendar / Outlook sync groundwork (evaluation deliverable).
--
-- No OAuth app is registered with Google or Microsoft yet — this table is
-- schema-only groundwork so a future OAuth callback edge function (mirroring
-- the existing `meta-oauth` function that already writes to
-- `meta_connections`, see 20260615000000_meta_connections.sql) has somewhere
-- real to persist tokens without another migration pass. Tokens are
-- server-side only; the client only ever reads the non-token columns via
-- `CalendarProviderConnectionSummary` (src/domain/calendarProviderConnection.ts).
--
-- Tenant id uses the literal 'finely_cred', matching calendar_events / crm_* /
-- comms_* (see calendarServerSync.ts's header comment for this codebase's
-- pre-existing dual-tenant-id convention) — this table exists to reconcile
-- against calendar_events (20260814100000_calendar_events_server.sql), which
-- already uses the same tenant_id literal.
create table if not exists public.calendar_provider_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'finely_cred',
  -- 'admin' for a staff/admin-connected calendar (e.g. the booking calendar
  -- CalendarSettingsPanel.tsx configures), 'partner' for a partner's own
  -- external calendar, once partner self-connect ships.
  owner_kind text not null check (owner_kind in ('admin', 'partner')),
  owner_id text not null,
  provider text not null check (provider in ('google', 'microsoft')),
  status text not null default 'not_connected' check (status in ('not_connected', 'connected', 'expired', 'error')),
  external_account_email text,
  access_token text,
  refresh_token text,
  scope text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, owner_kind, owner_id, provider)
);

create index if not exists calendar_provider_connections_owner_idx
  on public.calendar_provider_connections (tenant_id, owner_kind, owner_id);

alter table public.calendar_provider_connections enable row level security;

-- Admin-only for now (mirrors meta_connections_admin) — this table carries
-- OAuth token material, so even read access is restricted to admins/service
-- role until a token-redacted status view is built for partner self-connect.
drop policy if exists calendar_provider_connections_admin on public.calendar_provider_connections;
create policy calendar_provider_connections_admin on public.calendar_provider_connections
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
