-- Full Mode Workflow: reports, evidence, letters, cases (portable across devices)

-- Reports (store full record as jsonb for flexibility)
create table if not exists public.credit_reports (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  received_at timestamptz not null,
  filename text null,
  provider text null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists credit_reports_partner_received_idx on public.credit_reports(partner_id, received_at desc);

-- Evidence metadata (blobs live in storage; this is the index)
create table if not exists public.evidence (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  report_id text null references public.credit_reports(id) on delete set null,
  type text not null,
  source text null,
  section_key text null,
  creditor_name text null,
  caption text null,
  filename text null,
  mime_type text null,
  size_bytes bigint null,
  blob_ref text null,
  created_at timestamptz not null default now()
);

create index if not exists evidence_partner_created_idx on public.evidence(partner_id, created_at desc);

-- Letters
create table if not exists public.letters (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  status text null,
  meta jsonb null,
  pdf_blob_ref text null,
  pdf_filename text null,
  related_evidence_ids jsonb null,
  mailing jsonb null,
  archived_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists letters_partner_created_idx on public.letters(partner_id, created_at desc);

-- Dispute cases
create table if not exists public.cases (
  id text primary key,
  partner_id text not null references public.partners(id) on delete cascade,
  project_id text null,
  bureau text not null,
  title text not null,
  status text not null,
  latest_report_id text null references public.credit_reports(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  rounds jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_partner_updated_idx on public.cases(partner_id, updated_at desc);

-- -------------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------------
alter table public.credit_reports enable row level security;
alter table public.evidence enable row level security;
alter table public.letters enable row level security;
alter table public.cases enable row level security;

drop policy if exists credit_reports_select_own on public.credit_reports;
create policy credit_reports_select_own on public.credit_reports
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists credit_reports_insert_own on public.credit_reports;
create policy credit_reports_insert_own on public.credit_reports
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists credit_reports_update_own on public.credit_reports;
create policy credit_reports_update_own on public.credit_reports
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists evidence_select_own on public.evidence;
create policy evidence_select_own on public.evidence
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists evidence_insert_own on public.evidence;
create policy evidence_insert_own on public.evidence
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists evidence_update_own on public.evidence;
create policy evidence_update_own on public.evidence
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists letters_select_own on public.letters;
create policy letters_select_own on public.letters
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists letters_insert_own on public.letters;
create policy letters_insert_own on public.letters
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists letters_update_own on public.letters;
create policy letters_update_own on public.letters
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

drop policy if exists cases_select_own on public.cases;
create policy cases_select_own on public.cases
for select
to authenticated
using (public.is_partner_owner(partner_id));

drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases
for insert
to authenticated
with check (public.is_partner_owner(partner_id));

drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases
for update
to authenticated
using (public.is_partner_owner(partner_id))
with check (public.is_partner_owner(partner_id));

