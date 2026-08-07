# Tradelines buyer page · AU seller careers · Agency $1k buy-in

## Verdict

Two products are colliding in careers + URLs:

| Intent | Correct surface | Wrong today |
|---|---|---|
| **Buy** AU / primary tradelines | `/tradelines` (Solutions) | Invite query + duplicate inventory rows; careers cards feel too close to seller |
| **Become** an AU / tradeline partner (supply cards) | `/au-sellers` (Careers) | Looks like marketplace; missing public menu chrome; payout floor 15% too low |
| **Agency buy-in** | `/agency-partners` | Starter buy-in **$297** / Operator **$997** — must be **≥ $1,000** and all buy-ins visible |

Digital invite `?invite=tradelines` is **not a separate page** — it lands on `/tradelines` with tracking. Keep the param; do not invent a second URL. The **buyer inventory UX** belongs only on `/tradelines`.

---

## Locked product rules

### 1. Careers vs Solutions — huge visual / copy split

- **Careers → AU sellers** (`/au-sellers`): “You supply cards · Finely brings buyers.” Join/activate. **Never** browse/checkout inventory as the hero.
- **Solutions → Tradelines** (`/tradelines`): “Choose a lane · check availability · checkout / get matched.” **Never** “become a seller” as the primary CTA.
- CareersQuickNav (and any career card grid): make AU sellers **visually and verbally distinct** from anything that sounds like buying tradelines / “seasons inventory.” Rename short label if needed (e.g. “Supply AU cards” not “Tradelines”).
- Cross-links allowed as secondary text only (“Looking to buy a tradeline? → /tradelines”).

### 2. Public menu bar on AU sellers (and any missing pages)

- `/au-sellers` uses `PageShell` inside App routes; if `showPublicChrome` is false for careers paths, restore **full public top nav** on `/au-sellers` (and audit other public career pages).
- Keep `pt-28` / offset so content doesn’t sit under the fixed nav.

### 3. `/tradelines` inventory — one row only

- **Keep** the first set: `AuListingShowcase` card **information** + **Check availability** CTA pattern (upgrade visuals, keep data story: issuer, limit, age, seats, season, reports).
- **Remove** the duplicate second block: “Institutional Inventory” + `TradelineMarketplace` as a second competing grid.
- Wire **Check availability** → checkout / get matched / live seat confirmation (not scroll to a worse duplicate grid). Prefer: open availability modal or add-to-cart / get matched from that card.
- If live seller inventory still needed, fold it into the **same** card system (or a single professional inventory section), not a second “institutional” row.
- Primary lane section can stay below or beside AU as education + strategy call.

### 4. Invite URL

- `?invite=tradelines&src=digital-card` stays on `/tradelines` for attribution only.
- Do **not** create `/tradelines-invite`. If marketing copy implies a separate page, fix copy/links to `/tradelines`.

### 5. AU seller payout tiers (simple, powerful)

- Floor: **35%** minimum seller share (replace `AU_SELLER.defaultCommissionPct: 15`).
- Tier ladder by inventory strength (cards + quality/requirements), e.g.:
  - **Starter** — 35% (1–2 verified cards, basic requirements)
  - **Growth** — ~45% (more cards / cleaner util / on-time seasons)
  - **Pro** — ~55% (higher limits / multi-bureau / dependable fulfillment)
  - **Elite** — ~65%+ (volume + perfect season compliance)
- Requirements copy plain English on `/au-sellers` (not a dense table wall).
- Reflect in `auSellerProgram.ts` + AuSellerPage pricing story.

### 6. Agency buy-in ≥ $1,000, all visible

- Raise `agency_buyin_starter` and `agency_buyin_operator` in `pricingCatalog.ts` so **both ≥ $1000** (e.g. Starter $1,000 / Operator $2,497 or keep Operator higher if already ≥ $1k after bump).
- Agency page: show **all** buy-in options clearly (no hidden tiers).

---

## Extra IA findings (from route audit)

- Solutions nav **Tradelines** currently points at `/pricing/tradelines` (packages only) — **not** `/tradelines` (inventory). Change `siteWayfinderLanes.ts` → `/tradelines`; stop classifying `/tradelines` under Resources.
- `/services/tradelines` already redirects to `/tradelines` (good). Align Solutions + PricingSolutionsHero with the same destination.
- Digital invite visual title **“Tradeline Partner”** (`au_seller`) reads like buyer marketplace — rename to **AU Seller** / supply-side wording in `digitalInviteCardDesign.ts`.
- `showPublicChrome` / PageShell treat `startsWith('/au')` as app chrome — **carves out `/au-sellers` incorrectly**. Fix: exclude only `/au/` workspace paths (marketplace/request/orders), keep `/au-sellers` public.
- No separate invite route to kill; keep `?invite=` on dest paths.

## Implementation order

1. Agency buy-in floor + visibility (quick careers fix).
2. Solutions nav + wayfinder: Tradelines → `/tradelines`; optional redirect `/pricing/tradelines` → `/tradelines` (or packages section on same page).
3. `/tradelines` — kill Institutional Inventory row; elevate showcase inventory + Check availability → purchase path; polish inventory UI.
4. `/au-sellers` — restore public nav (App + PageShell carve-out); payout tiers ≥35%; separate look from buyer page; secondary link to buy tradelines.
5. Careers + invite card labeling so AU seller ≠ buy tradelines / “Tradeline Partner.”
6. Smoke: Solutions → Tradelines inventory, Careers → AU sellers with top nav, invite query on `/tradelines`, agency buy-in labels.

## Done when

- Buying and selling are unmistakably different surfaces.
- One professional inventory experience on `/tradelines` (no institutional duplicate).
- AU sellers has top menu + tiered payouts starting at 35%.
- Agency buy-ins all visible and ≥ $1000.
- Invite param still tracks; no orphan invite page.
