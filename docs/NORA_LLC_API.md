# Nora, LLC (Holding Company) API

This is a **public API** intended for external systems to send leads + events into the Nora/Finely ecosystem.

It is implemented as a **Supabase Edge Function**: `nora-llc-api`.

## Authentication

This API uses an **API key header** (no Supabase user required).

- Header: `x-nora-llc-api-key: <YOUR_KEY>`
  - (also accepts `x-api-key` / `x-nora-api-key`)

### Configure keys (server-side)

Set this in **Supabase secrets**:

- `NORA_LLC_API_KEYS_JSON`

Supported formats:

```json
["dev_key_1","prod_key_2"]
```

or

```json
[
  { "key": "dev_key_1", "label": "dev" },
  { "key": "prod_key_2", "label": "prod" }
]
```

## Endpoint

POST:

- `/functions/v1/nora-llc-api`

## Idempotency (recommended)

To avoid duplicates during retries, pass:

- Header: `x-idempotency-key: <unique-per-request>`
  - or body field: `idempotencyKey`

## Actions

### 1) Health check

Body:

```json
{ "action": "health" }
```

### 2) Ingest a lead

Body:

```json
{
  "action": "lead.ingest",
  "lead": {
    "source": "web",
    "product": "finely_cred",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+15551234567",
    "company": "Acme LLC",
    "website": "https://acme.example",
    "location": "Atlanta, GA",
    "interest": "Business credit build",
    "message": "I want a consultation",
    "metadata": { "utm_source": "google", "utm_campaign": "brand" }
  }
}
```

Returns:

```json
{ "ok": true, "id": "<uuid>", "at": "<iso>" }
```

### 3) Log an event

Body:

```json
{
  "action": "event.log",
  "name": "affiliate.click",
  "level": "info",
  "meta": { "affiliateId": "abc123", "campaign": "feb-2026" }
}
```

## Curl examples

Replace:

- `<SUPABASE_PROJECT_URL>` (example: `https://xyzcompany.supabase.co`)
- `<API_KEY>`

Health:

```bash
curl -sS "<SUPABASE_PROJECT_URL>/functions/v1/nora-llc-api" \
  -X POST \
  -H "content-type: application/json" \
  -H "x-nora-llc-api-key: <API_KEY>" \
  -H "x-idempotency-key: health-$(date +%s)" \
  -d '{"action":"health"}'
```

Lead ingest:

```bash
curl -sS "<SUPABASE_PROJECT_URL>/functions/v1/nora-llc-api" \
  -X POST \
  -H "content-type: application/json" \
  -H "x-nora-llc-api-key: <API_KEY>" \
  -H "x-idempotency-key: lead-$(date +%s)" \
  -d '{"action":"lead.ingest","lead":{"source":"web","product":"finely_cred","fullName":"Jane Doe","email":"jane@example.com"}}'
```

## Monitoring

All events are written to Deno KV under the **`nora-llc-api`** namespace.

View them in:

- Admin → Monitoring → Namespace: `nora-llc-api`

