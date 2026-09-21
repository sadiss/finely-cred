# Finely dashboard — Marketing HQ & CRM (PR #28)

## Marketing HQ (`/admin/marketing`)

| Area | Behavior |
|------|----------|
| **Source of truth** | `docs/sales-packs/finely` (bundled raw for Copy/Download) + `public/marketing-packs/finely` (synced HTML preview) |
| **Sync** | `npm run sync:packs` / prebuild — copies docs → public, patches brand paths, injects credibility bar + medallion on one-sheets |
| **Catalog** | `src/features/marketingHq/finelyPackCatalog.ts` — 21-day emails/SMS, HTML one-sheets, guides, $147 Start Restore, scripts |
| **Visibility** | Command floor **Full Finely pack library**; every channel room lists **entire library** (room-relevant sorts first) |
| **Start here** | Large A–E buttons: full library, social, 21-day email, $147 offer, partner one-sheets |
| **Actions** | Preview (HTML/live), Copy (raw from docs), Download — **manual send only** |

### Pack counts (approx.)

- 21 email + 21 SMS + 19 HTML one-sheets + guides/brand/scripts + Start Restore offer

## Flyer / one-sheet polish

- Shared CSS: `docs/sales-packs/finely/_brand/finely-brand.css` — framed sheet, gold top rule, credibility bar, medallion header (sync injects markup when missing).

## CRM warm prospects (`/admin/crm` → **Warm library** tab)

| Rule | Detail |
|------|--------|
| **Not inbound** | Separate store `finely.crm.warmProspects.v1` — never mixed with form captures |
| **Heat** | `warm` → `nurture` → `hot` |
| **Source** | `library` \| `scrape` \| `import` |
| **Repo CSV** | Drop files in `docs/warm-prospects/*.csv` → **Load repo CSV library** |
| **Sequences** | Draft templates in `warmProspectSequences.ts` — copy to Comms Studio; **no auto-send** |

## Specialist Academy — Track F depth

New lessons:

- `10-fcra-investigation-doctrine.md`
- `11-fdcpa-collection-honesty.md`
- `12-metro2-factual-disputes.md`
- `13-fico-score-model-honesty.md`

Quiz: **`track-f-statutory-depth`** (80% pass) — linked from walkthrough **Statutory depth drill**.

## Public UI

No regressions intended — see `docs/PUBLIC-UI-DEEP-SWEEP.md`.

## Anna Charlotin

No Finely-side reference in repo — left to Nora funding track.

## Overseer preview path

Pull PR #28 branch to `E:\Finely-Cred\Tishobe\finely-cred-pr28-preview`, run `npm run build`, deploy `dist/` + `.htaccess`.
