# Partner Prospector — implementation spec (Composer continuation)

## Goal

Reliable **~50 qualified B2B partners** per operator run across **N metros**, each with **≥1 email and ≥1 phone**, deduped by domain, importable to CRM without breaking existing flows.

## Phase 1 — Done / in PR

- [x] `PARTNER_PROSPECTING_AUDIT.md`
- [x] Lead Intel UI: multi-metro textarea, batch run, domain dedupe, `requireContact` filter, limit 20 per query × up to 3 queries default

## Phase 2 — Edge (`lead-intel`)

```typescript
// POST body extension (additive)
{
  batch?: Array<{ query: string; location: string }>;
  requireEmail?: boolean;
  requirePhone?: boolean;
  maxResults?: number; // cap total merged, default 50
}
```

- Loop queries server-side with 300ms delay.
- Merge by `domain`, keep highest `score`.
- Return `{ ok, results, meta: { queriesRun, deduped } }`.

## Phase 3 — CRM

- `findProspectByDomain(domain)` helper (normalize www).
- Tag `partner-prospect-batch-{date}`.
- Optional `icpTier: 'partner_agency' | ...` on prospect model.

## Phase 4 — UI

- Saved **metro packs** (Miami, Atlanta, Houston, …).
- Progress bar during batch.
- “Export 50 CSV” for Bot agents.

## Phase 5 — Compliance

- Log searches in `audit_events`.
- No LinkedIn scraping; Serper + public page enrich only.

## Acceptance

- Operator runs 3 metros → ≥40 rows with email+phone → import 50 without duplicate domains in CRM.
