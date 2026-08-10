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

Implementation: `src/lib/validationCreditLetterHandoff.ts` (`matchDisputeCandidatesForDebtCase`, `mergeHandoffIntoSelectedDisputes`, `seedLawsForSelected`); `LettersCommandCenter` reads `handoff=validation` (+ optional `debtId`, `letterId`), merges draft, switches to **dispute** tab, and strips query params. Debt Letters (`debtCenterMode`) navigates to Credit Letters after `completeValidationCreditHandoff`.

## Manual QA — negatives & charge-offs

1. Upload a report with charged-off tradelines (status or `CO` in payment grid).
2. Credit Intel → **Coll. & charge-offs** tab lists them; **Late payments** does not.
3. Disputes / Letter Studio categories show **Collections & charge-offs**.
4. Debt validation queue includes matched charge-off tradelines.

## Manual QA — validation handoff & restore dock (Stage 3)

1. **Handoff:** On `/portal/debt`, open a debt case linked to a report tradeline → **Debt Letters** → generate **validation** → confirm vault entry on debt page, then redirect to `/portal/letters?tab=dispute&handoff=validation` with return notice and matching bureau disputes in the picker (draft persisted via `saveLettersCommandCenterDraft`).
2. **Restore dock (portal):** On Reports, Documents (Evidence), Credit Letters, and Debt — sticky footer dock order left→right: **Reports · Evidence · Credit letters · Debt**; active lane highlighted.
3. **Restore dock (admin):** Partner detail on Reports / Evidence / Letters / Debt tabs — same order via `PartnerDetailAdminFooter` + `PartnerRestoreWorkspaceDock` `variant="admin"`.
4. **Ivory UX:** `/portal/billing` → **Profile** tab — phone + enterprise custom fields use dark ink on white tiles (readable). Public `/personal-credit` → **Overview** — `FinelyNoticedStrip` / `FinelyNowDoThisStrip` use `surface="light"`.

Launch plan pointer: `.cursor/plans/8-hour_launch_sprint_cccde790.plan.md` (Stage 3 ivory + handoff lanes).
