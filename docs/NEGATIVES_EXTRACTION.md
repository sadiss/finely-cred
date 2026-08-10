# Negatives extraction — collections & charge-offs

## Partner-facing label

Use **Coll. & charge-offs** (Credit Intelligence tab) or **Collections & charge-offs** (section subtitles). One lane for both — same debt validation / bureau dispute playbooks.

## Classification source of truth

`classifyCollectionOrChargeOff()` in `src/lib/collectionContactBoard.ts`:

- Account type / status (charge-off, collection, bad debt)
- Tradeline field blobs (all bureaus)
- Payment-history codes (`CO`, `CL`, `COL`, Metro-2 `9`, etc.)
- Collector naming when type is ambiguous

Credit Intelligence buckets call this **before** late-payment bucketing so charge-offs are not counted as late-only tradelines.

## Dispute candidates

`deriveDisputeCandidates()` in `src/creditReports/disputeCandidates.ts`:

- Uses the same classifier per tradeline
- Emits type **`Collections & charge-offs`** (not separate Collection vs Charge-Off vs Late Payment when coll/CO signals win)
- Late payment only when coll/CO signals are absent

## Letters & debt

- `letterCategoryForCandidate()` maps both `collection` and `charge_off` negative types to **Collections & charge-offs**
- Debt center / validation uses `buildCollectionContactBoard` — charge-offs appear with collections

## Validation → Credit Letters handoff

When a partner generates a **validation** letter on Debt Letters:

1. Body is saved immediately via `upsertLetter` (type `validation`) — visible in **Your validation letters (vault)** on the same page.
2. Matching **Collections & charge-offs** bureau candidates are merged into the Credit Letters draft (`saveLettersCommandCenterDraft`).
3. Partner is routed to `/portal/letters?tab=dispute&handoff=validation` with disputes pre-selected (not mailed until PDF is generated on Credit Letters).


1. Upload a report with charged-off tradelines (status or `CO` in payment grid).
2. Credit Intel → **Coll. & charge-offs** tab lists them; **Late payments** does not.
3. Disputes / Letter Studio categories show **Collections & charge-offs**.
4. Debt validation queue includes matched charge-off tradelines.
