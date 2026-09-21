# Public UI sweep (PR #28)

Live audit fixes for **finelycred.com** public routes. Admin/portal unchanged.

## P0 — routing (must work after deploy + `.htaccess` SPA fallback)

| # | Issue | Fix |
|---|--------|-----|
| P0-1 | `/pricing` showed homepage | Eager `PricingPage` route registered early; Apache `public/.htaccess` → `index.html` |
| P0-2 | `/services` showed homepage | Dedicated `ServicesHubPage` at `/services` (not landing) |
| P0-3 | `/start` 404 | Eager `StartRestorePage` at `/start` |
| P0-4 | `/free-kreyol-guide` merged into `/haitian` | Dedicated `FreeKreyolGuidePage` — no redirect to Haitian desk |
| P0-5 | `/kreyol` duplicated Haitian page | `KreyolHubPage` hub → kit funnel + link to `/haitian` desk |

## P1 — UX / performance

| # | Issue | Fix |
|---|--------|-----|
| P1-6 | Long black full-page loader | `RouteSkeleton` lighter (transparent, shorter min-height); P0 routes eager-loaded |
| P1-7 | “Just Approved” + Ask Finely overlap | Ticker: 12s delay, dismissible, `z-70`, bottom-left above chat; chat `z-85`, compact layout on tradelines/legal/contact |
| P1-8 | Typewriter mid-word glitch | `LoopingTypingHeader` full-phrase fade (no caret) |
| P1-9 | Broken video poster / debt visual | Promo `poster` → `/brand/finely-cred-mark.png` |
| P1-10 | `/free-guide` missing funnel | `FreeGuideLandingPage` — pages 01/03/06 previews, cover medallion, ~~$297~~ **$0** |
| P1-11 | `/business-credit` silent pricing rewrite | Canonical redirect → `/services/business-credit`; nav highlights **Services** |
| P1-12 | `/consultation` dual nav | Redirect to `/enlightenment-session`; only enlightenment maps to `consultation` nav |
| P1-13 | Tradelines chat/toast over hero | Compact chat + delayed/dismissible ticker positioning |

## P2 — polish (partial)

| # | Issue | Fix |
|---|--------|-----|
| P2 | FAQ / About nav active | Company dropdown includes `faq` in active state |
| P2 | Resources / contact chat dominance | Compact chat on contact/testimonials/enlightenment |
| P2 | Privacy/terms toast over text | Ticker dismiss + higher bottom offset on legal routes (compact chat) |

## Console — `automation_rules` 401 on public `/`

| Before | After |
|--------|--------|
| Launch `main.tsx` eager staff sync | `bootSyncGate` + empty `staffAutomationSyncRunners` — sync only on admin workspace + admin email |

## Brand / copy

- Medallion favicon set in `public/` + `index.html`
- Gold `#fbbf24`, ink `#0b1110` / `#060908`
- User-facing copy: **credit restore** (not repair) on touched public pages
- No Nora logos on Finely cold pages

## Marketing HQ (same PR)

- Finely `docs/sales-packs/finely` wired in Marketing HQ rooms (preview / copy / download)
- `npm run sync:packs` copies packs to `public/marketing-packs/finely` for HTML preview URLs

## QA

```bash
npm run build
```

Deploy **dist/** + **public/.htaccess** to Bluehost. Toshiba preview: pull PR #28 to `E:\Finely-Cred\Tishobe\finely-cred-pr28-preview`.
