# RLS Hardening Checklist (Phase 39)

Use this checklist when moving from local JSON stores to Supabase production.

## Tables requiring tenant-scoped RLS

- [ ] `partners` — partner sees own row; agent sees assigned; admin sees all
- [ ] `lead_captures` — admin read; anon insert only on public funnels
- [ ] `cases`, `tasks`, `messages` — scoped by `tenant_id` + assignment
- [ ] `voice_assets` — read by tenant; write by service role only
- [ ] `audit_events` — insert by authenticated; read admin-only

## Storage buckets

- [ ] `vault` — private; signed URLs with ≤60s TTL
- [ ] `voice-masters` — read via signed URL; no public listing
- [ ] Object keys: `tenant/{tenant_id}/partner/{partner_id}/{kind}/{id}`

## Secrets & tokens

- [ ] API keys in Supabase secrets only — never in repo or client bundle
- [ ] Rotate `FINELY_PARTNER_API_KEYS_JSON` quarterly
- [ ] Stripe / Nora webhook secrets verified on every inbound request
- [ ] OAuth tokens (Meta) encrypted at rest in edge KV

## Audit logging

Local demo: `auditRepo.ts` + `securityAuditBridge.ts`

Production targets:

- [ ] `lead.captured` — every funnel + partner API ingest
- [ ] `document.uploaded` / `document.downloaded`
- [ ] `webhook.created` / `webhook.enabled` / `webhook.disabled`
- [ ] `role.changed` / `permission.changed`
- [ ] `partner.exported` — PII export actions

## Admin access

- [ ] MFA required for platform admin emails
- [ ] `is_admin()` SQL function matches allowlist in edge guard
- [ ] No service role key in frontend

## Verification smoke

1. Partner A cannot read Partner B reports (403 or empty)
2. Anon can insert lead capture but not list leads
3. Partner API key without JWT can call `lead.capture` but not admin endpoints
4. Audit log row written on lead capture and webhook toggle

See also: [SECURITY_ARCHITECTURE_SUPABASE.md](./SECURITY_ARCHITECTURE_SUPABASE.md)
