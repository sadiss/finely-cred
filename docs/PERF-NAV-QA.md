# Navigation & route paint QA (P0 fix)

## Symptom (before)

- Clicking internal links updated the URL but the screen often stayed **blank** or **spinning** until a manual refresh.
- After refresh, pages could still hang for a long time.
- Affected **public marketing**, **Mastery workspace**, **partner portal**, and **admin** navigation (finelycred.com and local).

## Root cause (verified)

### 1. `lazyWithRetry` could suspend forever (Overseer hint)

On some branches, chunk recovery did:

```ts
window.location.reload();
return await new Promise(() => undefined); // never resolves → Suspense never completes
```

When a dynamic import failed twice within ~30s (stale deploy hash, CDN blip), React Router updated the URL but **no route element ever committed** — classic “URL changes, blank page until hard refresh.”

**This branch:** `src/lib/lazyWithRetry.ts` **does not** use a never-resolving promise. It retries, optionally triggers **one** guarded hard reload (sessionStorage window), then **throws** so Suspense ends and `RouteChunkErrorBoundary` shows **Try again** / **Refresh site**.

### 2. Global Suspense (fixed earlier)

A single `<Suspense>` around all `<Routes>` suspended the entire outlet; fallback sat under fixed nav → looked blank.

### 3. Partner session hang

`PartnerSessionContext` set `loading: true` with no timeout while `getOrCreatePartnerForSession()` ran. Portal pages often `return null` when `!partner` → blank content under `/portal/*`.

### 4. Auth bootstrap

`getSession()` with no cap (or missing env) left `isLoading: true` → `ProtectedRoute` spinner forever.

### 5. Secondary

- Sync `MasteryOSDashboard` in main bundle (now lazy).
- `Reveal` `opacity-0` until IO (timeout fallback added).

## Fix (after)

| Change | File(s) | User-visible effect |
|--------|---------|---------------------|
| Safe `lazyWithRetry` + throw on failure | `src/lib/lazyWithRetry.ts` | No infinite Suspense on chunk errors |
| Per-route `lazyRoute()` + skeleton + chunk error UI | `src/routing/lazyRoute.tsx`, `RouteSkeleton.tsx`, `RouteChunkErrorBoundary.tsx` | Immediate skeleton; recoverable error with Retry |
| `PartnerLoadGate` + 5s partner timeout | `PartnerSessionContext.tsx`, `PartnerLoadGate.tsx`, `App.tsx` | Portal never blank-waits; Retry / onboarding CTAs |
| Auth 5s timeout + missing-env UI | `AuthProvider.tsx`, `ProtectedRoute.tsx` | Guards unblock with clear messaging |
| Hover/focus prefetch | `routePrefetch.ts`, `dashboardPrefetch.ts`, dashboard + `PartnerPortalNav` | Faster portal/admin nav after hover |
| Prior nav perf items | `App.tsx`, `ScrollToTop`, lazy dashboard, `Reveal` | Smaller shell, scroll reset, visible marketing |

## Proof: lazy loader cannot hang Suspense

`lazyWithRetry` ends every path with either:

1. `return await importFn()` success, or  
2. `throw new Error(...)` after retries (and optional one-time `reload()` without awaiting a pending promise).

There is **no** `new Promise(() => {})` or equivalent non-settling await.

## Manual QA checklist

1. **Public:** `/` → `/resources` → `/pricing` — skeleton then content, no refresh.
2. **Chunk error simulation:** DevTools → Network → block a `*.js` chunk → navigate → error card with Retry (not infinite blank).
3. **Portal:** `/portal/dashboard` — skeleton → dashboard; throttle network → timeout card with Retry after ~5s max.
4. **Auth:** Protected route with slow/offline Supabase — message after ~5s, not infinite spinner.
5. **Prefetch:** Hover “Reports” in portal nav → chunk request in Network before click.
6. **Build:** `npm run build` exit 0.

## Live audit (finelycred.com, Sep 2026)

Observed on production (launch-style `main.tsx` boot):

| Finding | Evidence | Fix on PR #28 |
|--------|----------|----------------|
| Public boot fans out to staff/automation tables | Network: `human_staff_*`, `social_autopilot_config`, `comms_send_logs`, `email_webhook_events`, `nurture_enrollments`, `staff_platform_state` (~0.9–1.1s each) | `bootSyncGate.ts` + `scheduleStaffAutomationSync()` only on workspace path + admin email; **no** sync in `main.tsx` |
| `automation_rules` upsert 401 “No API key” | REST without `apikey` / bad env → retry storm | `supabaseClient` global `fetch` always sets `apikey`; `supabaseAuthGuard` opens circuit on 401 (log once) |
| Service worker race | `index.html` unregisters all SW; `pwaRegister.ts` re-registers on load → `FetchEvent` rejections on navigations | `syncPwaServiceWorkerWithPath()` — **unregister on marketing**, register only on `/portal`, `/admin`, `/dashboard`, etc.; `public/sw.js` catches all fetch errors |
| Lazy route URL ahead of paint | Strategy CTA → `/enlightenment-session` shows prior page briefly | `publicPrefetch.ts` idle + hover prefetch; per-route `RouteSkeleton` |
| Auth/partner hang | Slow Supabase | 5s auth + partner timeouts (prior commit) |

**Merge note:** When combining with `launch/ready-sovereign-supreme`, **remove** eager `void ensureHumanStaffSyncedOnce()` (etc.) from `main.tsx` and register those functions in `src/lib/staffAutomationSyncRunners.ts` instead.

**Bluehost / Toshiba preview:** step-by-step deploy merge → `docs/BLUEHOST-LAUNCH-PERF-MERGE.md`. Entry point: `applyLaunchSafeBoot()` in `src/lib/launchMainBootPatch.ts` (replaces launch eager sync + conflicting PWA register).

### PR #28 completion pass (slow click / URL ahead of paint)

| Fix | Detail |
|-----|--------|
| Removed `Routes key={pathname}` | Full route tree remount on every click was adding delay after URL change |
| `startTransition` + `prefetchRoutePrefix` on public nav | `handleNavigate` in `App.tsx` warms chunk before navigate |
| `index.html` inline SW unregister | Marketing paths clear SW **before** JS bundle (stops launch HTML ↔ `pwaRegister` fight) |
| Favicon | Official medallion — see below |

## Favicon (browser tab)

| Asset | Path |
|-------|------|
| ICO | `/favicon.ico` (from `public/brand/finely-cred-mark.png`) |
| PNG 32 | `/favicon-32x32.png` |
| Apple touch | `/apple-touch-icon.png` (180) |
| SVG | `/brand/finely-cred-icon.svg` |
| Source medallion | `/public/brand/finely-cred-mark.png` |

`index.html` links all of the above. **Removed** `/vite.svg` default.

## Build

```bash
npm run build
```
