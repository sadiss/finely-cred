# Nora Capital Group ↔ Finely Cred API bridge

Finely Cred does **not** rebuild loan origination. Nora Capital Group owns origination end-to-end. Finely exposes partner readiness and consumes status webhooks.

## Architecture

| Direction | Mechanism | Function |
|-----------|-----------|----------|
| Finely → Nora | Outbound REST (allowlisted) | `nora-capital` edge function |
| Nora → Finely | Webhook POST | `nora-capital-webhook` |
| Nora → Finely (pull) | Partner readiness GET | `finely-partner-api` |
| Partner handoff | Client `submitPartnerFundingHandoff()` | `noraFundingHandoff.ts` |

## Secrets (Supabase)

| Secret | Purpose |
|--------|---------|
| `NORA_CAPITAL_BASE_URL` | Nora API host |
| `NORA_CAPITAL_API_KEY` | Outbound auth to Nora |
| `NORA_CAPITAL_ALLOWED_PATHS_JSON` | Allowlist for outbound paths |
| `NORA_CAPITAL_WEBHOOK_SECRET` | Verify inbound webhook HMAC |
| `FINELY_PARTNER_API_KEYS_JSON` | Nora-authenticated readiness API keys |

## Outbound — `nora-capital`

**POST** `/functions/v1/nora-capital`

Body (via `noraCapitalClient.ts`):

```json
{
  "path": "/v1/applications",
  "method": "POST",
  "body": { "...partnerReadinessPayload..." },
  "idempotencyKey": "fund:partner_abc:..."
}
```

Default allowlisted paths (extend via env):

- `/ping`
- `/v1/applications`
- `/v1/applications/:id`

## Partner readiness payload (Tier 382)

Produced by `partnerReadinessPayload()` in `src/lib/partnerFundingReadiness.ts`:

```json
{
  "partnerId": "partner_…",
  "externalId": "laravel_uid_or_null",
  "fullName": "…",
  "email": "…",
  "phone": "…",
  "journeyStage": "mailing",
  "fundingStage": "ready",
  "readinessScore": 72,
  "blockers": [],
  "primaryRoute": "personal",
  "lane": "Personal Credit",
  "journeySignals": { "legacyReportCount": 1, "legacyLetterCount": 3 },
  "exportedAt": "2026-06-10T…"
}
```

## Inbound — `finely-partner-api`

**POST** `/functions/v1/finely-partner-api`

Header: `x-finely-partner-api-key: <key>`

### Health

```json
{ "action": "health" }
```

### Readiness snapshot

```json
{ "action": "partner.readiness", "partnerId": "partner_…" }
```

or

```json
{ "action": "partner.readiness", "email": "partner@example.com" }
```

### Funding intent flag

```json
{
  "action": "partner.funding_intent",
  "partnerId": "partner_…",
  "intent": "business_funding",
  "metadata": { "source": "wealth_paths" }
}
```

## Partner API v2 (white-label)

All actions use **POST** `/functions/v1/finely-partner-api` with header `x-finely-partner-api-key`.

### Embed config (white-label funnels)

```json
{ "action": "tenant.embed_config", "tenantId": "nora_capital" }
```

Returns funnel paths, voice tenant id, and `leadCaptureAction` for iframe/embed integrations.

### Lead capture (server-to-server)

```json
{
  "action": "lead.capture",
  "tenantId": "nora_capital",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-0100",
  "source": "agent",
  "offer": "business_credit_jumpstart",
  "funnelPath": "/business-credit-guide",
  "referralCode": "NORA10",
  "consentToContact": true
}
```

Response: `{ "ok": true, "leadId": "lead_…", "email": "…" }`

Voice actions (`voice.catalog`, `voice.asset`, `voice.render`) — see [VOICE_STUDIO_API.md](./VOICE_STUDIO_API.md).

## Webhook — `nora-capital-webhook`

**POST** `/functions/v1/nora-capital-webhook`

Header: `x-nora-signature` or `x-signature` (HMAC-SHA256 hex of raw body when `NORA_CAPITAL_WEBHOOK_SECRET` is set)

Body (any of these fields update `partners.funding_stage`):

```json
{
  "partnerId": "partner_…",
  "fundingStage": "in_review",
  "applicationId": "nora_app_123",
  "status": "review"
}
```

Stage normalization: `review` → `in_review`, `approved` → `funded`, `rejected` → `declined`.

## Portal UX

- **Partner dashboard** — `PartnerFundingCommandStrip` + Apply handoff
- **Wealth Paths** — Nora lane + funding strip when entitled
- **Admin** — `/admin/nora-capital` pipeline + test console

## Smoke checklist (Tiers 391–395)

1. Configure secrets on Supabase project
2. `npm run deploy:functions` (includes `nora-capital`, `nora-capital-webhook`, `finely-partner-api`)
3. Admin → Nora Capital → Ping
4. Partner with report + letters → Apply for funding → verify `funding_stage = submitted`
5. POST webhook with test signature → verify portal stage updates
6. POST `finely-partner-api` readiness with API key → verify JSON snapshot
