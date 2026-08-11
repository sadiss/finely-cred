-- Max Jr Ralph Jean-Baptiste — credit-restore client (email added later by admin).
-- Idempotent: safe to re-run on deploy; appears in Admin Partners after refresh.

insert into public.partners (
  id,
  tenant_id,
  status,
  profile,
  primary_route,
  lane,
  journey_stage,
  import_source,
  import_external_id,
  journey_signals,
  created_at,
  updated_at
)
values (
  'c7d4a291-5e83-4b6f-9a2c-1f8e6d3b7045',
  'tenant_finely_primary',
  'active',
  jsonb_build_object('fullName', 'Max Jr Ralph Jean-Baptiste'),
  'personal_restore',
  'funding_readiness',
  'intake',
  'manual',
  'finely:max-jr-ralph-jean-baptiste-v1',
  jsonb_build_object('clientSeed', 'max-jr-ralph-jean-baptiste-v1'),
  now(),
  now()
)
on conflict (id) do update set
  status = excluded.status,
  profile = coalesce(public.partners.profile, '{}'::jsonb) || excluded.profile,
  primary_route = coalesce(excluded.primary_route, public.partners.primary_route),
  lane = coalesce(excluded.lane, public.partners.lane),
  journey_stage = coalesce(excluded.journey_stage, public.partners.journey_stage),
  import_source = coalesce(public.partners.import_source, excluded.import_source),
  import_external_id = coalesce(public.partners.import_external_id, excluded.import_external_id),
  journey_signals = coalesce(public.partners.journey_signals, '{}'::jsonb) || excluded.journey_signals,
  updated_at = now();
