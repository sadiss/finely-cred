-- Guest calendar lookup + academy trainee email outbox (server-side; browser queue is interim).

create table if not exists public.public_calendar_guest_events (
  id text primary key,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  meeting_url text,
  timezone text,
  status text not null default 'confirmed' check (status in ('tentative', 'confirmed', 'completed', 'cancelled')),
  updated_at timestamptz not null default now()
);

create index if not exists public_calendar_guest_events_start_idx on public.public_calendar_guest_events (start_at);

alter table public.public_calendar_guest_events enable row level security;

-- No direct client reads; use calendar-guest-lookup edge with service role.
create policy "no_public_calendar_guest_events_select"
  on public.public_calendar_guest_events for select
  using (false);

create policy "authenticated_upsert_calendar_guest"
  on public.public_calendar_guest_events for insert
  to authenticated
  with check (true);

create policy "authenticated_update_calendar_guest"
  on public.public_calendar_guest_events for update
  to authenticated
  using (true);

create table if not exists public.academy_trainee_email_outbox (
  id text primary key,
  event text not null,
  to_email text not null,
  to_name text,
  subject text not null,
  body text not null,
  dedupe_key text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists academy_trainee_email_outbox_status_idx on public.academy_trainee_email_outbox (status, created_at desc);
create unique index if not exists academy_trainee_email_outbox_dedupe_idx on public.academy_trainee_email_outbox (dedupe_key) where dedupe_key is not null;

alter table public.academy_trainee_email_outbox enable row level security;

create policy "authenticated_insert_academy_outbox"
  on public.academy_trainee_email_outbox for insert
  to authenticated
  with check (true);

create policy "authenticated_select_academy_outbox"
  on public.academy_trainee_email_outbox for select
  to authenticated
  using (true);

create policy "authenticated_update_academy_outbox"
  on public.academy_trainee_email_outbox for update
  to authenticated
  using (true);
