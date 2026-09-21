# Public UI deep sweep (PR #28)

Code-level pass across static marketing routes. Canonical path list: `PUBLIC_MARKETING_STATIC_PATHS` in `src/routing/publicMarketingRoutes.ts`.

## Shared public shell

| Change | Files |
|--------|--------|
| Route-aware chrome profile (chat layout, toast hide, safe bottom) | `publicMarketingRoutes.ts`, `PublicFloatingChrome.tsx` |
| Single mount: approval toast + Ask Finely | `App.tsx` → `PublicFloatingChrome` |
| Chat layouts: `standard` / `compact` / `minimal` (forms use minimal) | `PublicChatWidget.tsx`, `index.css` |
| Page bottom padding follows `--fc-public-safe-bottom` | `PageShell.tsx`, `index.css` |
| Nav active states / `viewFromPath` unified | `publicMarketingRoutes.ts` (consumed by `App.tsx`) |
| Medallion image fallback PNG → SVG | `PublicBrandMark.tsx`, `GuideCoverImage.tsx` |
| Loading: lightweight `RouteSkeleton` (header stays mounted) | `RouteSkeleton.tsx` (unchanged — no full-page black gate) |

## Routes touched (static paths)

| Path | Notes |
|------|--------|
| `/` | Home — floating chrome standard/compact; brand mark fallback |
| `/onboarding` | Form-heavy chrome |
| `/login`, `/signup`, `/forgot-password` | Form-heavy chrome |
| `/pricing` | P0 eager route; pricing nav active |
| `/services` | P0 hub; services nav active |
| `/start` | P0 restore funnel; pricing nav active |
| `/free-guide`, `/free-guide/:kitId` | English guide; `GuideCoverImage` |
| `/free-kreyol-guide` | Kreyòl funnel |
| `/kreyol`, `/haitian` | Kreyòl / Haitian companion |
| `/tradelines`, `/checkout` | Compact chat |
| `/about` | About nav active |
| `/personal-credit`, `/fix-my-credit`, `/build-my-credit` | Legacy → services framing |
| `/debt-summons-help`, `/business-credit-solutions`, `/business-credit`, `/funding-readiness`, `/diy-academy` | Legacy marketing |
| `/blog`, `/rent-reporting`, `/resources` | Resources nav active |
| `/events`, `/testimonials`, `/bookstore` | Public chrome |
| `/affiliate`, `/agents` | Form-heavy chrome |
| `/contact` | **Layout rebuild** — KPI row, form-first mobile, minimal chat |
| `/enlightenment-session`, `/consultation` | Consultation nav; form-heavy |
| `/faq` | FAQ nav active |
| `/claim`, `/terms`, `/privacy`, `/disclaimer` | Legal; ticker hidden on legal |
| `/services/personal-credit` | Service detail |
| `/services/personal-credit-restore` | Service detail |
| `/services/personal-credit-building` | Service detail |
| `/services/business-credit` | Service detail (+ `/business-credit` redirect) |
| `/services/debt-legal` | Service detail |
| `/services/wealth-builder` | Service detail |
| `/services/privacy-id` | Service detail |
| `/services/bundles` | Service detail |
| `/services/tradelines` | Service detail |
| `/services/agencies` | Service detail |
| `/pricing/personal-credit` … `/pricing/agencies` | Pricing deep links (mirror service slugs) |

## Dynamic / section routes (home anchors)

Landing sections on `/` are not separate paths but share the same public chrome as `/`.

## P0 route correctness (verified in `App.tsx`)

- `/pricing`, `/services`, `/start` — eager imports, early `Route` entries
- `/free-guide` vs `/free-kreyol-guide` — separate components
- `/business-credit` → `/services/business-credit`
- `/consultation` → `/enlightenment-session`
- Prefetch: `/free-guide` → `FreeGuideLandingPage` (not Kreyòl page)

## Deploy

Ship `dist/` plus `public/.htaccess` SPA fallback on Bluehost.
