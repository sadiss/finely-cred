-- Phase 9 — Comms send log persistence + email provider webhooks + social poster_type

create table if not exists public.comms_send_logs (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  template_id text,
  channel text not null,
  partner_id text,
  to_address text,
  status text not null default 'sent',
  subject text,
  body_preview text,
  error_message text,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comms_send_logs_created_idx
  on public.comms_send_logs (tenant_id, created_at desc);

create index if not exists comms_send_logs_partner_idx
  on public.comms_send_logs (tenant_id, partner_id, created_at desc);

create table if not exists public.email_webhook_events (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  provider text not null,
  event_type text not null,
  message_id text,
  recipient text,
  payload jsonb,
  received_at timestamptz not null default now()
);

create index if not exists email_webhook_events_received_idx
  on public.email_webhook_events (tenant_id, received_at desc);

alter table public.comms_send_logs enable row level security;
alter table public.email_webhook_events enable row level security;

drop policy if exists comms_send_logs_admin on public.comms_send_logs;
create policy comms_send_logs_admin on public.comms_send_logs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists email_webhook_events_admin on public.email_webhook_events;
create policy email_webhook_events_admin on public.email_webhook_events
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Social Hub: disclosure poster type (AI vs human executive)
alter table public.social_scheduled_posts
  add column if not exists poster_type text;
