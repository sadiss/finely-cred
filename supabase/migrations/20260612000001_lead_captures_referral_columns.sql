-- Nullable referral columns on lead_captures (handoff tier 293)
alter table if exists public.lead_captures
  add column if not exists referral_code text,
  add column if not exists referral_source text,
  add column if not exists utm_campaign text,
  add column if not exists utm_medium text,
  add column if not exists utm_source text;

comment on column public.lead_captures.referral_code is 'Short referral / affiliate code when present';
comment on column public.lead_captures.referral_source is 'Human-readable referral source label';
