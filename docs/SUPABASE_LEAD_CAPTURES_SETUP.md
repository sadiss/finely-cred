## Supabase setup: lead captures (Resources → Free guide unlock + 1-hour consult)

This project can submit lead captures from the public `Resources` page into Supabase via `supabase.from('lead_captures').insert(...)`.

### 1) Create table + enable RLS

Run this in **Supabase SQL Editor**:

```sql
-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

create table if not exists public.lead_captures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  offer text not null,
  interest text null,
  full_name text not null,
  email text not null,
  phone text not null,
  consent_to_contact boolean not null default false,
  referral_code text null,
  promoter_role text null,
  promo_type text null,
  promo_asset text null,
  utm_source text null,
  utm_medium text null,
  utm_campaign text null,
  utm_content text null,
  funnel_path text null,
  funnel_id text null
);

-- Safe on existing tables: add columns if an older schema is already live.
alter table public.lead_captures add column if not exists referral_code text;
alter table public.lead_captures add column if not exists utm_source text;
alter table public.lead_captures add column if not exists utm_medium text;
alter table public.lead_captures add column if not exists utm_campaign text;
alter table public.lead_captures add column if not exists utm_content text;
alter table public.lead_captures add column if not exists funnel_path text;
alter table public.lead_captures add column if not exists funnel_id text;

alter table public.lead_captures enable row level security;
```

### 2) Allow **anonymous inserts** (only when consent is true)

```sql
drop policy if exists "anon_insert_lead_captures" on public.lead_captures;

create policy "anon_insert_lead_captures"
on public.lead_captures
for insert
to anon
with check (consent_to_contact = true);
```

### 3) (Optional) Allow admins to read leads

If you use Supabase Auth for admins, you can allow reads to authenticated users. The simplest (not the most secure) is:

```sql
drop policy if exists "auth_read_lead_captures" on public.lead_captures;

create policy "auth_read_lead_captures"
on public.lead_captures
for select
to authenticated
using (true);
```

For a tighter policy, restrict by allowlisted admin email(s) using JWT claims or a `profiles` table with an `is_admin` flag.

### 4) Configure env vars (public + admin read)

Ensure your Vite environment has:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

These two keys are **read-only from the browser’s point of view**. They are the public anon key, not the service-role key. Admin **Ebook conversion** (`/admin/ebook-conversions`) uses the signed-in admin session + the `auth_read_lead_captures` policy above to `select` recent rows. No extra read-only key is required.

When these are set, the app will attempt to insert into `lead_captures`. If not set (or if insert fails), it will still save the request locally in the browser. The admin conversion view then shows this browser’s local captures and says Supabase is not configured.

Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in Vite / `VITE_*`. Service role stays on the server (Edge Functions only).

