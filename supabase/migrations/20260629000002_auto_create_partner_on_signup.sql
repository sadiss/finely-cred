-- Fix: partner row creation during signup fails with 42501 when email confirmation
-- is enabled. In that case, supabase.auth.signUp() returns data.session = null,
-- so the Supabase client has no JWT when getOrCreatePartnerForSession() calls
-- upsertPartner(). The RLS INSERT policy checks claimed_user_id = auth.uid(), but
-- auth.uid() = null (no session) while claimed_user_id = userId -> check fails.
--
-- Solution: database trigger (SECURITY DEFINER) that auto-creates the partner row
-- immediately when an auth user is inserted, before any client code runs. This is
-- the Supabase-recommended pattern for creating profile rows on signup.
--
-- The trigger also handles admin-pre-created unclaimed partner rows (links them by
-- email) so sign-up with a matching email auto-claims without needing the client.

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

  -- 1. If partner with this deterministic ID already exists, just claim it.
  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           updated_at      = now()
     where id = v_partner_id
       and claimed_user_id is null;
    return new;
  end if;

  -- 2. If an unclaimed partner with matching email already exists (admin pre-created),
  --    link it instead of creating a duplicate.
  if v_email <> '' and exists (
    select 1 from public.partners
     where (profile->>'email') = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
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
      'goal',          v_meta->>'goal',
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
end;
$$;

-- Drop and recreate the trigger (idempotent).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();
