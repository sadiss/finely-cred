# Navigation & route paint QA (P0 fix)

## Symptom (before)

- Clicking internal links updated the URL but the screen often stayed **blank** until a manual refresh.
- After refresh, pages could sit on a spinner for a long time.
- Affected **public marketing pages** and **dashboard / portal / admin** navigation (finelycred.com and local dev).

## Root cause

Several issues compounded:

1. **Single global `<Suspense>`** wrapped the entire `<Routes>` tree in `App.tsx`. Any lazy route chunk load suspended **all** routes at once. The fallback (`FullPageLoader`, `min-h-[60vh]`) sat **under** the fixed top nav (`z-50`), so users perceived a **blank page** even though React was waiting on a chunk.

2. **Heavy synchronous imports** in the main bundle (notably `MasteryOSDashboard`) blocked the main thread on first load and enlarged the entry chunk, slowing every navigation that touched the router shell.

3. **`Reveal` animations** started at `opacity-0` and only flipped visible on `IntersectionObserver`. After SPA navigations, observers sometimes did not fire promptly, leaving **invisible but mounted** content.

4. **Auth bootstrap** waited indefinitely on `supabase.auth.getSession()` with no timeout. `ProtectedRoute` / `ProtectedAdminRoute` showed a full-screen spinner while `isLoading` stayed true, which felt like a hung navigation on protected URLs.

## Fix (after)

| Change | File(s) | User-visible effect |
|--------|---------|---------------------|
| Per-route `lazyRoute()` + `RouteSkeleton` | `src/routing/lazyRoute.tsx`, `src/routing/RouteSkeleton.tsx`, all lazy pages in `App.tsx` | Each link shows an immediate skeleton in the content area; chunk load no longer blanks the whole app. |
| Removed outer `<Suspense>` | `App.tsx` | Nav/header stay visible; only the route body suspends. |
| `Routes key={location.pathname}` | `App.tsx` | Route outlet remounts on path change so stale UI does not linger. |
| `ScrollToTop` on pathname | `src/routing/ScrollToTop.tsx` | New pages start at the top without odd scroll positions. |
| Lazy `MasteryOSDashboard` | `App.tsx` | Smaller initial JS; dashboard loads on demand. |
| Auth session timeout (4s) | `AuthProvider.tsx` | Protected routes unblock even if Supabase is slow/unreachable. |
| `Reveal` IO fallback + 900ms timeout | `components/ui/index.tsx` | Marketing sections become visible after navigation. |
| Guards use `RouteSkeleton` | `ProtectedRoute.tsx`, `ProtectedAdminRoute.tsx` | Consistent loading chrome instead of empty spinners. |

## Manual QA checklist

1. **Public:** `/` → `/resources` → `/pricing` → `/bookstore` — URL and content change without refresh; skeleton briefly then page.
2. **Auth:** `/dashboard` while logged in — skeleton → dashboard (not infinite spinner).
3. **Portal:** `/portal/dashboard` — same; admin partner override flow still redirects to select-partner when needed.
4. **Admin:** `/admin` — skeleton → admin shell.
5. **Hard refresh** on any of the above — still loads (no worse than before).
6. **Console:** no uncaught chunk errors; no repeated auth loops on onboarding paths.

## Build

```bash
npm run build
```

Must complete with exit code 0 before merge.

## Notes for future perf work

- Further split landing sync imports in `App.tsx` if TTI on `/` is still heavy.
- Consider `React.startTransition` for navigations that trigger large data fetches.
- Audit portal pages that `return null` while partner context loads — prefer skeletons.
