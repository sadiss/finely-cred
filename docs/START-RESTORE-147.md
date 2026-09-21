# Start Restore — $147 consumer starter (sales lock)

## Offer (do not confuse with Core)

| Field | Value |
|-------|--------|
| **Name** | Start Restore |
| **Price today** | **$147** (package id `start_restore_147`) |
| **Alt deposit** | **$200** down toward Core (manual credit on upgrade — note on partner record) |
| **Includes** | Restore roadmap, first-action plan, **15–20 min strategy call** |
| **Not included** | Full multi-month Advanced Credit Restore / DFY Core execution |
| **Upgrade credit** | **$147 applied to Core** if upgrade within **7 days** |
| **Language** | Say **credit restore**, not “credit repair” |
| **Honesty** | Restore ≠ debt erased; no score/approval guarantees |
| **Nora / funding** | Soft handoff only after trust + expressed funding interest |

**Core Membership stays $49/mo** (`personal_core`). DFY restore tiers (e.g. $750+, $1,500+) unchanged.

## Public URLs (PR #28)

- **Landing:** `https://finelycred.com/start` (after deploy)
- **Checkout path:** `/onboarding?package=start_restore_147` → `/portal/checkout?package=start_restore_147`
- **Hero CTA:** Home secondary button → `/start`
- **Pricing:** Banner on `/pricing` → `/start`
- **Kreyòl mirror:** `/free-kreyol-guide`, `/haitian?lang=ht` — Start Restore card + link to `/start`

## Paste-ready one-liner (EN)

> **Start Restore — $147 today:** your roadmap, first actions, and a 15–20 minute strategy call. Not the full Core program. $147 credits toward Core if you upgrade within 7 days. Credit restore, not credit repair — we don’t promise debt disappears.

## Paste-ready (HT)

> **Kòmanse Restore — $147 jodi a:** plan, premye aksyon, apèl estrateji 15–20 minit. Pa Core plizyè mwa. $147 kredite sou Core si w upgrade nan 7 jou. Credit restore — pa efase dèt.

## Ops

1. Stripe/catalog: `start_restore_147` at **14700** cents in `pricingCatalog.ts` (`isPublic: false` — only `/start`).
2. $200 Core deposit: tag lead/partner `start_restore_deposit_200`; apply at Core checkout manually until automated.
3. 7-day credit: verify upgrade date ≤ 7 days from Start Restore purchase before discounting Core/DFY.

## Code map

- Copy: `src/copy/startRestoreOffer.ts`
- Page: `src/pages/StartRestorePage.tsx`
- Catalog: `start_restore_147` in `src/config/pricingCatalog.ts`
