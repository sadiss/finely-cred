# Public UI audit — Batch 2 fixes (PR #28)

| # | URL / issue | Status | Fix |
|---|-------------|--------|-----|
| 1 | `/free-restore-wealth` 404 | **SHIPPED** | `FreeRestoreWealthPage` — wealth/restore funnel + links to `/free-guide`, `/start` |
| 2 | `/refer` 404 | **SHIPPED** | `WarmReferLandingPage` — warm referral capture |
| 3 | `/partners` 404 | **SHIPPED** | `PublicPartnersHubPage` — agency, refer, portal CTAs |
| 4 | `/partner` 404 | **SHIPPED** | Redirect → `/partners` |
| 5 | `/portal` 404 under chrome | **SHIPPED** | `PortalEntryPage` + `PartnerLoadGate` bypass for `/portal`; portal 404 drops `PartnerPortalNav` |
| 6 | `/disclosures` 404 | **SHIPPED** | `DisclosuresPage` + links to terms/privacy/disclaimer |
| 7 | `/academy` 404 | **SHIPPED** | `PublicAcademyTeaserPage`; `/diy-academy` → `/academy` |
| 8 | `/meet` 404 | **SHIPPED** | Redirect → `/enlightenment-session` (`/meet/:eventId` unchanged) |
| 9 | `/blog` silent redirect | **SHIPPED** | `BlogIndexPage` — curated posts → real funnels |
| 10 | `/rent-reporting` → resources | **SHIPPED** | `RentReportingPage` |
| 11 | `/free-kreyol-guide` dual nav | **SHIPPED** | `NavView` `kreyol`; single Learn highlight; funnel kept (no forced `/haitian`) |
| 12 | `/kreyol`, `/haitian` IA | **PARTIAL** | Kreyòl nav id; Haitian desk bilingual via `?lang=ht`; deeper HT copy in PR #29 |
| 13 | `/resources` hero gap | **SHIPPED** | Intro strip; tightened top spacing |
| 14 | `/tradelines` toast overlap | **SHIPPED** | Hide approval ticker on `/tradelines` |
| 15 | `/pricing/business-credit` band/toast | **SHIPPED** | Ticker hidden on business-credit pricing; journey page top spacing |
| 16 | `/enlightenment-session` dual Company highlight | **SHIPPED** | `isCompanyNavOpen` excludes `consultation` |
| 17 | `/privacy`, `/terms` toast/chat | **SHIPPED** | Legal paths in `FORM_HEAVY` — minimal chat, no ticker |
| 18 | `/free-guide` chat overlap | **SHIPPED** | `formHeavy` + restore-wealth parity |

## Files (primary)

- Routes: `src/App.tsx` (eager P1 routes at top of `Routes`)
- Portal entry: `src/pages/portal/PortalEntryPage.tsx`, `src/auth/PartnerLoadGate.tsx`
- Public LPs: `src/pages/public/FreeRestoreWealthPage.tsx`, `WarmReferLandingPage.tsx`, `PublicPartnersHubPage.tsx`, `PublicAcademyTeaserPage.tsx`, `RentReportingPage.tsx`, `BlogIndexPage.tsx`
- Legal: `src/pages/legal/DisclosuresPage.tsx`
- Chrome/nav: `src/routing/publicMarketingRoutes.ts`, `src/routing/navActive.ts`, `src/components/layout/PageShell.tsx` (`omitWorkspaceNav`)

## MISSING / follow-up

| Item | Status |
|------|--------|
| Full CMS blog with posts | **MISSING** — index points to live funnels |
| `/meet/:eventId` marketing landing | **SHIPPED** (existing guest join) |
| Haitian full Kreyòl copy sitewide | **PARTIAL** — PR #29 |

Build: `npm run build` required before merge.
