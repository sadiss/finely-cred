-- Phase F1 — Meeting reminders + no-show detection ported to platform-cron.
--
-- Confirmed before this migration: src/data/calendarRepo.ts stored every
-- ConsultationRequest/CalendarEvent/PublicAppointmentRequest 100% in
-- localStorage ('finely.calendar.v1') — zero server table existed, so a
-- confirmed meeting could only get a reminder or no-show recovery if an
-- admin/partner browser tab happened to be open with the calendar page
-- loaded. This table mirrors the CalendarEvent shape (src/domain/calendar.ts)
-- so a server cron tick (platform-cron) can read due events and send
-- reminders / detect no-shows without any browser open.
--
-- Tenant id uses the literal 'finely_cred' (matching crm_prospects/crm_records/
-- comms_suppression/nurture_enrollments and all platform-cron/automation-runner
-- edge functions), NOT the FINELY_TENANT_ID app constant ('tenant_finely_primary')
-- used by partners/agreements/entitlements — see crmServerSync.ts's header
-- comment for the same pre-existing dual-convention note in this codebase.
create table if not exists public.calendar_events (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  partner_id text not null,
  type text not null check (type in ('consultation', 'follow_up', 'ops')),
  status text not null check (status in ('tentative', 'confirmed', 'completed', 'cancelled', 'no_show')),
  title text not null,
  description text,
  meeting_agenda text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  slot_duration_minutes int,
  timezone text,
  meeting_url text,
  location text,
  source_request_id text,
  -- Server-owned send-dedupe columns — replace the client's separate
  -- SMS_SENT_KEY / RECOVERED_KEY local-only dedupe logs so a server tick and
  -- an admin-browser tick can never double-send the same reminder/recovery.
  reminder_sent_at timestamptz,
  sms_reminder_sent_at timestamptz,
  no_show_recovery_sent_at timestamptz,
  meeting_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Due-scan indexes for the two new cron processors.
create index if not exists calendar_events_reminder_due_idx
  on public.calendar_events (tenant_id, status, start_at);
create index if not exists calendar_events_no_show_due_idx
  on public.calendar_events (tenant_id, status, end_at);
create index if not exists calendar_events_partner_idx
  on public.calendar_events (tenant_id, partner_id, start_at desc);

alter table public.calendar_events enable row level security;

-- Admin/service-role: full read+write (server cron + admin calendar tools).
drop policy if exists calendar_events_admin on public.calendar_events;
create policy calendar_events_admin on public.calendar_events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Partner: read-only visibility into their own scheduled meetings, matching
-- the agreements_select_own / work_tasks_partner_read pattern.
drop policy if exists calendar_events_partner_read on public.calendar_events;
create policy calendar_events_partner_read on public.calendar_events
for select to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.partners p
    where p.id = calendar_events.partner_id
      and p.claimed_user_id = auth.uid()
  )
);
