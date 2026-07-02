create table if not exists public.sitewide_ux_audit_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  page_count integer not null default 0,
  critical_count integer not null default 0,
  protected_count integer not null default 0,
  summary jsonb not null default '{}'::jsonb
);

create table if not exists public.sitewide_ux_page_findings (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.sitewide_ux_audit_runs(id) on delete cascade,
  created_at timestamptz not null default now(),
  path text not null,
  route text,
  zone text not null,
  priority text not null,
  finding text not null,
  recommended_pattern text not null,
  protected boolean not null default false
);

create index if not exists sitewide_ux_page_findings_run_idx on public.sitewide_ux_page_findings(run_id);
create index if not exists sitewide_ux_page_findings_zone_idx on public.sitewide_ux_page_findings(zone);
