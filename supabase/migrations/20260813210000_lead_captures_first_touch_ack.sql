-- Phase N1 — Instant Lead Acknowledgment: first-touch tracking columns.
--
-- Both the client-side instant-ack senders (sendImmediateWelcomeEmail in
-- funnelEmail.ts, sendImmediateWelcomeSms in instantLeadAck.ts) and the
-- server-side sender for leads that never touch the client pipeline
-- (sendInstantLeadAckServerSide, called from meta-webhook/index.ts) write
-- these columns best-effort on the first successful send. This avoids
-- duplicate acknowledgment sends across the two paths and gives N2's
-- time-to-first-touch KPI real data to read.
alter table if exists public.lead_captures
  add column if not exists first_touch_at timestamptz null,
  add column if not exists first_touch_channel text null;

comment on column public.lead_captures.first_touch_at is
  'Timestamp of the first instant acknowledgment send (email or SMS) to this lead. Null = never acknowledged yet.';
comment on column public.lead_captures.first_touch_channel is
  'Channel of the first acknowledgment send: ''email'' or ''sms''. Null = never acknowledged yet.';

create index if not exists lead_captures_first_touch_idx on public.lead_captures(first_touch_at);
