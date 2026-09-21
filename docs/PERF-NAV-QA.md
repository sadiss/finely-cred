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

## Build

```bash
npm run build
```
