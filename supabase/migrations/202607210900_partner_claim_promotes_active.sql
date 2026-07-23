-- On auth signup claim: promote lead → active, stamp claimed_at + authActivity.
-- Fixes admin partners list stuck on "Pending" after invitee finishes registration.

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
  v_invite_id  text;
  v_now        timestamptz := now();
  v_signals    jsonb;
begin
  v_meta       := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_partner_id := 'partner_' || new.id::text;
  v_email      := lower(trim(coalesce(new.email, '')));
  v_invite_id  := nullif(trim(coalesce(v_meta->>'partnerId', v_meta->>'partner_id', '')), '');
  v_name       := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(v_email, ''),
    'Partner'
  );

  -- Prefer explicit invite partner id from signup metadata.
  if v_invite_id is not null and exists (select 1 from public.partners where id = v_invite_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where id = v_invite_id
       and (claimed_user_id is null or claimed_user_id = new.id);
    return new;
  end if;

  if exists (select 1 from public.partners where id = v_partner_id) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where id = v_partner_id
       and (claimed_user_id is null or claimed_user_id = new.id);
    return new;
  end if;

  -- Case-insensitive email match for admin pre-created invite partners.
  if v_email <> '' and exists (
    select 1 from public.partners
     where lower(trim(coalesce(profile->>'email', ''))) = v_email
       and claimed_user_id is null
  ) then
    update public.partners
       set claimed_user_id = new.id,
           claimed_at = coalesce(claimed_at, v_now),
           status = case when status = 'paused' then status else 'active' end,
           journey_signals = coalesce(journey_signals, '{}'::jsonb)
             || jsonb_build_object(
               'authActivity',
               coalesce(journey_signals->'authActivity', '{}'::jsonb)
                 || jsonb_build_object(
                   'accountClaimedAt', coalesce(journey_signals->'authActivity'->>'accountClaimedAt', v_now::text),
                   'signupCompletedAt', coalesce(journey_signals->'authActivity'->>'signupCompletedAt', v_now::text)
                 )
             ),
           updated_at = v_now
     where lower(trim(coalesce(profile->>'email', ''))) = v_email
       and claimed_user_id is null;
    return new;
  end if;

  v_signals := jsonb_build_object(
    'goal', v_meta->>'goal',
    'accessApproved', true,
    'roleUnlocked', true,
    'fractures', v_meta->'fractures',
    'liabilityTier', v_meta->>'liabilityTier',
    'urgency', v_meta->>'urgency',
    'authActivity', jsonb_build_object(
      'accountClaimedAt', v_now::text,
      'signupCompletedAt', v_now::text
    )
  );

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
      'email', v_email,
      'phone', nullif(trim(v_meta->>'phone'), '')
    ),
    nullif(trim(v_meta->>'primaryRoute'), ''),
    nullif(trim(v_meta->>'lane'), ''),
    'intake',
    v_signals,
    coalesce(v_meta->'legalConsents', '{}'::jsonb),
    '{}'::jsonb,
    new.id,
    v_now,
    v_now,
    v_now
  );

  return new;
end;
$$;
