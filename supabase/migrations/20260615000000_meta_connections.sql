-- Meta Social Hub — page connections + inbox archive (Phase 3)
create table if not exists public.meta_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'finely_cred',
  page_id text not null,
  page_name text,
  ig_business_id text,
  ig_username text,
  access_token text,
  connected_at timestamptz not null default now(),
  token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (tenant_id, page_id)
);

create table if not exists public.meta_inbox_messages (
  id text primary key,
  tenant_id text not null default 'finely_cred',
  page_id text not null,
  thread_id text not null,
  channel text not null default 'messenger',
  direction text not null default 'inbound',
  text text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists meta_inbox_created_idx on public.meta_inbox_messages(created_at desc);

alter table public.meta_connections enable row level security;
alter table public.meta_inbox_messages enable row level security;

drop policy if exists meta_connections_admin on public.meta_connections;
create policy meta_connections_admin on public.meta_connections
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists meta_inbox_admin on public.meta_inbox_messages;
create policy meta_inbox_admin on public.meta_inbox_messages
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
