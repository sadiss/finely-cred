-- Fix: trigger handle_new_auth_user() references claimed_at in its INSERT but
-- the column was never added to public.partners — causing "Database error saving
-- new user" (code: unexpected_failure) on every new signup.
--
-- This migration:
--   1. Adds the missing claimed_at column.
--   2. Backfills it from created_at for existing claimed rows.
--   3. Recreates the trigger function with a top-level EXCEPTION block so any
--      future bug in the trigger cannot block auth.users insertion.

-- 1. Add missing column (idempotent).
alter table public.partners
  add column if not exists claimed_at timestamptz null;

-- 2. Backfill existing claimed rows.
update public.partners
   set claimed_at = created_at
 where claimed_user_id is not null
   and claimed_at is null;

-- 3. Recreate function — identical logic but wrapped in EXCEPTION so auth never
--    breaks if something else goes wrong in the trigger body.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partner_id text;
  v_email      text;
  v_name       text;
  v_meta       jsonb;
begin
  v_meta       := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_partner_id := 'partner_' || new.id::text;
  v_email      := lower(trim(coalesce(new.email, '')));
  v_name       := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(v_email, ''),
    'Partner'
  );

  -- 1. Partner with this deterministic ID already exists — just claim it.
  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at      = coalesce(claimed_at, now()),
           updated_at      = now()
     where id = v_partner_id
       and claimed_user_id is null;
    return new;
  end if;

  -- 2. Unclaimed partner with matching email (admin pre-created) — link it.
  if v_email <> '' and exists (
    select 1 from public.partners
     where (profile->>'email') = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at      = coalesce(claimed_at, now()),
           updated_at      = now()
     where (profile->>'email') = v_email
       and claimed_user_id is null;
    return new;
  end if;

  -- 3. Create a fresh partner row (SECURITY DEFINER bypasses RLS).
  insert into public.partners (
    id,
    tenant_id,
    status,
    profile,
    primary_route,
    lane,
    journey_stage,
    journey_signals,
    consents,
    routes,
    claimed_user_id,
    claimed_at,
    created_at,
    updated_at
  ) values (
    v_partner_id,
    coalesce(nullif(trim(v_meta->>'tenantId'), ''), 'tenant_finely_primary'),
    'active',
    jsonb_build_object(
      'fullName', v_name,
      'email',    v_email,
      'phone',    nullif(trim(v_meta->>'phone'), '')
    ),
    nullif(trim(v_meta->>'primaryRoute'), ''),
    nullif(trim(v_meta->>'lane'), ''),
    'intake',
    jsonb_build_object(
      'goal',           v_meta->>'goal',
      'accessApproved', true,
      'roleUnlocked',   true,
      'fractures',      v_meta->'fractures',
      'liabilityTier',  v_meta->>'liabilityTier',
      'urgency',        v_meta->>'urgency'
    ),
    coalesce(v_meta->'legalConsents', '{}'::jsonb),
    '{}'::jsonb,
    new.id,
    now(),
    now(),
    now()
  );

  return new;

exception when others then
  -- Log the error but never block the auth.users insert.
  raise warning 'handle_new_auth_user: failed for user % (email %): % %',
    new.id, new.email, sqlerrm, sqlstate;
  return new;
end;
$$;

-- Recreate trigger (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
