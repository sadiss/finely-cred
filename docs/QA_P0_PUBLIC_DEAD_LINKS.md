# QA baseline — P0 public dead links

**Role:** verifier only. This note inventories public routes on `launch/ready-sovereign-supreme` before the sibling fix lands. It does not change UI, CSS, components, or routes.

**Checked:** 2026-09-26 against commit `72499ed` (`Ship Haitian community documents with human speech and working fulfilment.`).

**Fix PR status at this writing:** not open. Sibling agent `P0 fix dead public nav links (no UI redesign)` (`bc-78ece2dd-0c0a-5dfa-96cd-1b2feeee5940`) was still running with no branch and no pull request. Open PRs on this base do not contain a public nav-alias / dead-link fix.

**Typecheck:** not run. `node_modules` is not installed in this checkout, and there is no fix branch to typecheck yet.

## How this was checked

- Every `<Route path="...">` in `src/App.tsx` (360 unique paths), including the `*` not-found route.
- `routeFromView()` in `src/App.tsx` (footer and About page view keys).
- Public nav sources: `src/config/siteWayfinderLanes.ts`, `src/config/publicCareers.ts`, `src/config/publicResourcesHub.ts`, mobile nav in `src/components/ui/index.tsx`, homepage footer in `src/components/landing/index.tsx`.
- `public/sitemap.xml` and `src/data/publicSeoCatalog.ts` path lists (both matched a registered route).
- Redirect detection is the `element` on that exact route, not a nearby route. `/affiliate`, `/credit-specialist`, `/head-of-society`, and `/haitian` are real pages. A naive window search falsely tags them as redirects.

Unknown public paths render `NotFoundPage` (`path="*"`). A registered `<Navigate to="/" />` is a home bounce, not a working page.

## Required aliases — FAIL on this base

| Path | Route registered? | What a visitor gets | Verdict |
|---|---|---|---|
| `/solutions` | No | 404 | **FAIL** |
| `/careers` | No (only `/careers/case-help` and `/careers/real-estate`) | 404 | **FAIL** |
| `/dispute-guide` | No | 404 | **FAIL** |
| `/strategy-call` | No | 404 | **FAIL** |
| `/membership` | No | 404 | **FAIL** |
| `/dispute` | No | 404 | **FAIL** |
| `/funding` | No | 404 | **FAIL** |
| `/partners` | No | 404 | **FAIL** |
| `/restore` | No | 404 | **FAIL** |
| `/letters` | No | 404 | **FAIL** |
| `/services` | Yes | `<Navigate to="/" replace />` | **FAIL** (home bounce) |
| `/pricing` | Yes | `<Navigate to="/" replace />` | **FAIL** (home bounce) |

`PricingPage` is imported in `src/App.tsx` and never mounted. The `/pricing` and `/services` indexes do not render it.

## Live public controls that already hit those dead routes

These are not hypothetical URLs. They are wired today.

1. **Mobile “Solutions”** in `src/components/ui/index.tsx` calls `onNavigate('/pricing')`. Desktop Solutions is a dropdown of real lane paths (`/pricing/personal-credit-restore`, `/pricing/business-credit`, and the rest in `PUBLIC_SOLUTIONS_SECTIONS`). Mobile is the dead control. Adding a `/solutions` alias does not fix this button unless the button target changes too.
2. **Footer “Payment plans”** in `src/components/landing/index.tsx` uses view key `pricing`. `routeFromView('pricing')` returns `/pricing`, which bounces home. **FAIL.**
3. **About “Explore pricing”** (`src/pages/public/AboutPage.tsx`, two buttons) uses the same `pricing` view key and the same home bounce. **FAIL.**

## CTA check — business credit and payment plans

| Control | Current target | Registered destination | Verdict |
|---|---|---|---|
| Footer “Business credit” | view `pricing_business` → `/pricing/business-credit` | `BusinessCreditPreviewPage` | **PASS** (already a real page) |
| Homepage path card “Business credit” | `/pricing/business-credit` | same | **PASS** |
| Homepage services card “Business Credit” | `/pricing/business-credit` | same | **PASS** |
| `BusinessCreditSection` “Learn more” | `/pricing/business-credit` | same | **PASS** |
| Footer “Payment plans” | view `pricing` → `/pricing` → `/` | homepage | **FAIL** |
| Financing band primary CTA | `startFinancingPreapprovalInterest` (opens the application; not a route) | n/a | not a dead route |
| Financing band secondary | `/enlightenment-session` | `EnlightenmentSession` route exists | **PASS** |

A fix that retargets business credit must still land on an existing business-credit page (`/pricing/business-credit` or `/services/business-credit`). A new business-credit layout is out of scope.

Payment plans should stop resolving through `routeFromView('pricing')` → `/`. Closest existing public surfaces: the homepage financing band (`id="financing-preapproval"`) or a real pricing lane. Do not invent a new payment-plan page.

## Public nav hrefs that already resolve

Header dropdowns and career tracks point at registered pages:

- Core: `/`, `/free-guide`, `/enlightenment-session`
- Solutions lanes: `/pricing/personal-credit-restore`, `/pricing/personal-credit-building`, `/pricing/business-credit`, `/pricing/debt-legal`, `/pricing/wealth-builder`, `/tradelines`, `/pricing/privacy-id`, `/pricing/bundles`, `/haitian`
- Resources, contact, and career tracks in `PUBLIC_RESOURCES_SECTIONS`, `PUBLIC_CONTACT_LINKS`, and `PUBLIC_CAREER_TRACKS` matched a route (including `/credit-specialist`, `/agency-partners`, `/affiliate`, `/au-sellers`, `/careers/case-help`, `/careers/real-estate`)
- Sitemap and SEO catalog paths matched a route

`/funding-readiness` already redirects to `/fundability-readiness`. That does not cover bare `/funding`.

`/business/funding` is a protected redirect to `/business/lender-logic`. Guests are sent to signup. It is not a public alias for `/funding`.

## Sensible alias targets (for the review, not a redesign)

A surgical fix is `<Navigate>` (preserve query string where the canonical page reads it) onto a page that already exists. Mounting the existing `PricingPage` on `/pricing` is also surgical. A new marketing layout, new CSS, or a rewritten nav component is not.

| Alias | Existing page that already covers the intent |
|---|---|
| `/dispute-guide` | `/free-guide` |
| `/strategy-call` | `/enlightenment-session` |
| `/restore` | `/pricing/personal-credit-restore` |
| `/funding` | `/fundability-readiness` (or the existing `/funding-readiness` redirect) |
| `/services`, `/pricing` | stop bouncing to `/`; use an existing lane or the unmounted `PricingPage` |
| `/solutions` | no index page exists; do not build one. Mobile must stop navigating to `/pricing` until `/pricing` is a real page. Desktop dropdown links are already valid. |
| `/careers` | no index page. Subroutes exist. Redirect to an existing track (`/credit-specialist` is the first public career path) rather than a new careers layout. |
| `/letters` | public education is `/free-guide`; the studio is protected `/portal/letters` (guests go to signup). Say which one the alias uses. |
| `/dispute` | public education is `/free-guide` or `/pricing/personal-credit-restore`; the center is protected `/portal/disputes`. |
| `/partners` | public program pages are `/agency-partners` and `/affiliate`. Do not collide with a future `/partners/refer`. |
| `/membership` | no public membership route in this tree. Closest existing pages are `/head-of-society` and `/pricing/bundles`. An invented membership page is out of scope. |

## What a later diff review will reject

Revert any of these if they show up in the fix PR:

- CSS, Tailwind class rewrites, or layout/spacing changes on landing, nav, cards, or heroes
- New pages, new logos, or a replacement homepage
- Edits to `PricingPage.tsx` or preview pages beyond wiring an existing component to a route
- Visual edits in `src/components/landing/**` or `src/components/ui/index.tsx` beyond the dead `path` / `onNavigate` string
- Portal, admin, or Haitian-funnel work unrelated to these public aliases

Expected touch list if the diff stays surgical: `src/App.tsx` route aliases and possibly `routeFromView`; the mobile Solutions target in `src/components/ui/index.tsx`; the footer Payment plans view key in `src/components/landing/index.tsx`; the About pricing buttons only if they still call `routeFromView('pricing')`.

## Residual gaps this baseline still leaves open

All twelve aliases above, plus the three live controls (mobile Solutions, footer Payment plans, About Explore pricing). Header dropdown lane links, sitemap URLs, and the business-credit CTAs are not in that residual set.

## Review of fix PR #39 (`cursor/fix-public-nav-routes-5940`, `b549c0d`)

**Verdict: FAIL.** The diff is surgical (no CSS, no new page, no visual restyle). No files to revert for look. It does not clear the dead-route bar.

Posted on https://github.com/sadiss/finely-cred/pull/39.

Passes: `/pricing` and `/services` render existing `PricingPage` (no home bounce). `/solutions` → `/services`. `/careers` → `/credit-specialist`. `/dispute-guide` → `/free-guide`. `/strategy-call` → `/enlightenment-session`. `/membership` → `/pricing`. Business-credit links were not retargeted to restore.

Fails still open: `/dispute`, `/funding`, `/partners`, `/restore`, `/letters`, `/portal` (no routes). Footer Payment plans still uses view key `pricing`, so it opens the catalog on the Personal / Restore lane instead of a payment-plan action. The Solutions label opens that same restore-default catalog. Guest `/free-kreyol-guide` still redirects to `/haitian`; the PR says that was left as-is, so it is not a false “fixed” claim.

`tsc` was not re-run in this checkout (`node_modules` absent). The PR author reports `tsc --noEmit` passed.
