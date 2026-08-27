# Nora Capital Group ↔ Finely Cred API bridge

Finely Cred does **not** rebuild loan origination. Nora Capital Group owns origination end-to-end. Finely exposes partner readiness and consumes status webhooks.

## Architecture (bidirectional)

| Direction | Mechanism | Function |
|-----------|-----------|----------|
| **Nora → Finely (PULL)** | Partner API POST + API key | `finely-partner-api` |
| **Finely → Nora (PUSH)** | Dossier webhook | `noraDossierPush` → Nora `/v1/partners/finelycred/webhook` |
| **Finely → Nora (PULL)** | Pull actions | `nora-capital` edge (`pull.dossier`, `pull.dossiers`, …) |
| **Nora → Finely (PUSH)** | Status webhook | `nora-capital-webhook` |
| Partner handoff UI | Client push + pull | `noraFundingHandoff.ts`, `noraCapitalPullClient.ts` |

## Secrets (Supabase)

| Secret | Purpose |
|--------|---------|
| `NORA_CAPITAL_BASE_URL` | Nora API host |
| `NORA_CAPITAL_API_KEY` | Outbound auth to Nora |
| `NORA_CAPITAL_ALLOWED_PATHS_JSON` | Allowlist for outbound paths |
| `NORA_CAPITAL_WEBHOOK_SECRET` | Verify inbound webhook HMAC |
| `FINELY_CRED_WEBHOOK_SECRET` | Outbound dossier push signature to Nora `/v1/partners/finelycred/webhook` |
| `FINELY_PARTNER_API_KEYS_JSON` | Nora-authenticated readiness API keys |

## Outbound PUSH — dossier to Nora

See **Partner API v6** `partner.funding_dossier_push` below.

## Inbound PULL — Finely Cred pulls from Nora

**POST** `/functions/v1/nora-capital` (admin auth required)

### Catalog

```json
{ "action": "catalog" }
```

### Pull dossier by exportId

```json
{ "action": "pull.dossier", "exportId": "dossier_partner_abc_1720000000000" }
```

### List dossiers

```json
{ "action": "pull.dossiers", "clientId": "nora_uid", "partnerId": "partner_abc", "limit": 20 }
```

### CRM profile snapshot

```json
{ "action": "pull.crm_profile", "clientId": "nora_uid" }
```

Client helpers: `noraPullDossier`, `noraPullDossiers`, `noraPullCrmProfile`, `noraPullLenderCatalog`, `syncPartnerFundingFromNora` in `src/lib/noraCapitalPullClient.ts`.

**Nora must implement:** `GET /v1/partners/finelycred/dossiers`, `GET .../dossiers/:exportId`, `GET .../clients/profile?clientId=`

### Lender catalog pull

Finely Cred can request Nora’s curated lender stack (relationship banks, credit unions, fintech lanes) filtered by partner geography and middle score. **Until Nora implements the route, Finely receives `{ ok: true, lenders: [] }` — not an error.**

#### Finely edge action

**POST** `/functions/v1/nora-capital` (admin auth required)

```json
{
  "action": "pull.lenderCatalog",
  "state": "TX",
  "middleScore": 720,
  "zip": "78701"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `state` | No | Two-letter US state (filters lenders with state coverage) |
| `middleScore` | No | Partner middle bureau score (filters `minMiddleScore` on each lender) |
| `zip` | No | Partner ZIP (geo / NCUA-nearby enrichment when Nora supports it) |

#### Finely edge response (degraded — Nora not live yet)

```json
{
  "ok": true,
  "action": "pull.lenderCatalog",
  "lenders": [],
  "hint": "Nora must implement GET /v1/partners/finelycred/lenders?state=&middleScore=&zip= — see docs/NORA_CAPITAL_API.md § Lender catalog pull.",
  "status": 404
}
```

#### Finely edge response (Nora implemented)

```json
{
  "ok": true,
  "action": "pull.lenderCatalog",
  "status": 200,
  "lenders": [
    {
      "id": "nfcu_flagship",
      "bank": "NAVY FEDERAL",
      "product": "Business / Flagship Rewards (relationship)",
      "projectedLimit": "$25k - $100k+",
      "category": "credit_union",
      "relationshipFriendly": true,
      "noDocFriendly": true,
      "limitBias": "high",
      "stackingTier": "primary",
      "why": "NCUA nearby",
      "matchCity": "Austin",
      "minMiddleScore": 680,
      "states": ["TX", "VA"]
    }
  ]
}
```

An empty `lenders` array with `ok: true` is always valid (no matches, or catalog not seeded).

#### Nora must implement

**GET** `/v1/partners/finelycred/lenders`

Query parameters (all optional):

| Param | Type | Description |
|-------|------|-------------|
| `state` | string | Two-letter state code |
| `middleScore` | integer | Partner middle score |
| `zip` | string | Five-digit ZIP |

**Response** `200 application/json`:

```json
{
  "lenders": [
    {
      "id": "string (stable slug)",
      "bank": "string (display name)",
      "product": "string (product line)",
      "projectedLimit": "string (e.g. \"$25k - $100k+\")",
      "category": "national | credit_union | local | private | fintech | cdfi",
      "relationshipFriendly": "boolean (optional)",
      "noDocFriendly": "boolean (optional)",
      "limitBias": "high | mid | low (optional)",
      "stackingTier": "primary | secondary | national_low (optional)",
      "why": "string (optional match reason)",
      "matchCity": "string (optional)",
      "minMiddleScore": "number (optional floor)",
      "states": ["array of state codes (optional)"],
      "color": "string (optional Tailwind gradient token)",
      "accent": "string (optional text accent class)"
    }
  ],
  "count": 12
}
```

Field names align with Finely `LenderPreset` / `LenderMatch` in `src/data/localLenders.ts` so `LenderLogicEngine` can merge Nora results without a second schema.

#### Client helper

```ts
import { noraPullLenderCatalog } from '@/lib/noraCapitalPullClient';

const res = await noraPullLenderCatalog({ state: 'TX', middleScore: 720, zip: '78701' });
const lenders = res.lenders ?? []; // always safe — empty when Nora not ready
```

Add `/v1/partners/finelycred/lenders` to `NORA_CAPITAL_ALLOWED_PATHS_JSON` (or shared prefix allowlist) when Nora deploys the route.

## Outbound generic proxy — `nora-capital`

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

Default allowlisted path prefixes (extend via env):

- `/ping`, `/health`, `/v1/ping`
- `/v1/applications`, `/v1/submissions`
- `/v1/partners/finelycred/dossiers`
- `/v1/partners/finelycred/clients/status`
- `/v1/partners/finelycred/clients/profile`
- `/v1/partners/finelycred/webhook` (push only)

## Nora PULLS from Finely — `finely-partner-api`

**POST** `/functions/v1/finely-partner-api`  
**Header:** `x-finely-partner-api-key`

```json
{ "action": "api.pull_catalog" }
```

```json
{ "action": "partner.nora_sync_bundle", "partnerId": "partner_…" }
```

Client (Nora or Finely admin): `finelyPullCatalogForNora`, `noraPartnerSyncBundle` in `noraPartnerApiClient.ts`.

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

## Partner API v4 (Nora Capital Group — ML advisory)

Version **v4** adds machine-learning advisory endpoints with OpenAI-powered suggestions and heuristic fallback.

### ML advisory (full partner action plan)

```json
{ "action": "ml.advisory", "partnerId": "partner_…" }
```

Returns `executiveSummary`, `topPriorities`, detailed `suggestions[]` (title, rationale, steps, confidence, statutes), `fundingPath`, and `disputeStrategy`.

### Funding path only

```json
{ "action": "ml.funding_path", "email": "partner@example.com" }
```

### Dispute strategy only

```json
{ "action": "ml.dispute_strategy", "partnerId": "partner_…" }
```

### Pipeline insights (NCG ops — aggregate)

```json
{ "action": "ml.pipeline_insights", "tenantId": "nora_capital", "limit": 20 }
```

### Enriched profile (full file + ML advisory)

```json
{ "action": "partner.enriched_profile", "partnerId": "partner_…" }
```

Client helpers: `noraMlAdvisory`, `noraMlFundingPath`, `noraMlDisputeStrategy`, `noraMlPipelineInsights`, `noraPartnerEnrichedProfile`, `noraPartnerFundingDossierV5`, `noraPartnerFundingDossierPush`.

## Partner API v6 — Funding dossier (full credit + debt + documents)

The **funding API v6** is the primary Nora Capital handoff. It is designed to be **fast when you need a snapshot** and **complete when you need underwriting depth**.

### Recommended flow

1. `partner.funding_brief` — CRM card / mobile (~200ms)
2. `partner.funding_dossier_v6` — full file (`sections: "full"` or subset)
3. `partner.funding_dossier_push` — deliver to Nora webhook

### Fast brief (dashboard)

```json
{ "action": "partner.funding_brief", "partnerId": "partner_…" }
```

Returns `brief` (scorecard, verdict, doThisNext), `lenderReadiness`, `nextSteps`, `compliance` — no ML, no full tradeline dump.

### Full dossier v6

```json
{
  "action": "partner.funding_dossier_v6",
  "partnerId": "partner_…",
  "sections": "full",
  "includeMl": true
}
```

**Section filter** (efficient pulls): `"brief"` | `"credit,debt"` | `["disputes","evidence"]` | `"full"`

### Push to Nora

```json
{
  "action": "partner.funding_dossier_push",
  "partnerId": "partner_…",
  "clientId": "nora_firebase_uid",
  "force": false
}
```

Retries 3× with idempotency. Returns `brief`, `lenderReadiness`, `compliance`, `message`.

### Ops batch

```json
{ "action": "partner.funding_queue", "limit": 25, "minScore": 65 }
{ "action": "partner.batch_dossier_push", "limit": 5, "minScore": 70 }
```

### API playbook (human guide)

```json
{ "action": "api.playbook" }
{ "action": "api.playbook", "topic": "partner.funding_dossier_push" }
```

### v6 sections

| Section | Contents |
|---------|----------|
| `executiveBrief` | Scorecard, verdict, doThisNext, lender snapshot |
| `lenderReadiness` | Approve track / conditional / restore-first + weeks estimate |
| `credit` | Scores, tradelines, utilization, inquiries, public records |
| `disputes` | Cases, letters, dispute candidates, creditor contacts |
| `debt` | Collections, bankruptcy from report, debt signals |
| `evidence` | Classified vault documents |
| `compliance` | Checklist score + export-ready flag |
| `timeline` | Reports, letters, cases, evidence, auth, funding events |
| `workTasks` | Open Bridge/restore tasks |
| `mlAdvisory` | Executive summary, funding path, dispute strategy |

Client helpers: `noraPartnerFundingBrief`, `noraPartnerFundingDossierV6`, `noraPartnerFundingDossierPush`, `noraPartnerFundingQueue`, `previewPartnerFundingBrief`, `submitPartnerFundingHandoff`.

### Nora-side retrieval

After push, dossiers are in Firestore `finelyCredDossiers`:

- `GET /v1/partners/finelycred/dossiers?clientId=&limit=20`
- `GET /v1/partners/finelycred/dossiers/:exportId`

## Partner API v5 — Funding dossier (legacy)

Still supported. Prefer v6 for new integrations.

```json
{ "action": "partner.funding_dossier_v5", "partnerId": "partner_…" }
```


## Partner API v3 (Nora Capital Group — extended)

All actions use **POST** `/functions/v1/finely-partner-api` with header `x-finely-partner-api-key`.

### API catalog

```json
{ "action": "api.catalog" }
```

### Full partner profile (reports + evidence + letters)

```json
{ "action": "partner.full_profile", "partnerId": "partner_…" }
```

### Evidence manifest (underwriting pull)

```json
{ "action": "partner.evidence_manifest", "partnerId": "partner_…" }
```

### Owner vault intel feed (shared secrets for NCG ops)

```json
{ "action": "vault.intel_feed", "tenantId": "finely_cred", "limit": 25 }
```

### Cross-role recognition (Finely + NCG staff)

```json
{ "action": "roles.recognize", "email": "ops@noracapitalgroup.com", "tenantId": "finely_cred" }
```

Client helpers: `src/lib/noraPartnerApiClient.ts` — `noraApiCatalog`, `noraPartnerFullProfile`, `noraPartnerEvidenceManifest`, `noraVaultIntelFeed`, `noraRecognizeRole`.

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
