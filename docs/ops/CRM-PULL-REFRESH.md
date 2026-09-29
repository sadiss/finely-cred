# CRM-PULL-REFRESH

**Updated:** 2026-09-29 09:02 ET (America/New_York)
**Machine:** DESKTOP-GLNB7GM `43411104-b9fb-4408-8f20-1b6ca5955fe8`
**Repo:** `E:\Finely-Cred\Tishobe\finely-cred-main`
**Branch:** `sync/launch-521910f`
**Soft SEO:** HOLD (honored)

## Problem

`/admin/crm` live UI (`CrmWorkstation` inside `AdminOperationalWorkstationsSurface`) only called `listCrmRecords()` (localStorage). Empty browser store → empty board even when Supabase `crm_prospects` had rows. Legacy `AdminCrmWorkspacePage` had the same hole until pull-on-mount was started.

## Fix

1. **Confirm pull-on-mount (legacy):** `AdminCrmWorkspacePage.tsx` calls `pullCrmSnapshotFromSupabase()` then `runCrmServerBackfillOnce()` on mount.
2. **Live `/admin/crm` (product surface):** `CrmWorkstation` in `AdminOperationalWorkstationsSurface.tsx`:
   - Pull-on-mount from Supabase (non-demo), then `setRefreshCount` so `listCrmRecords()` reloads the board.
   - Visible **Refresh** button (hero secondary actions) calls `pullCrmSnapshotFromSupabase()`, shows loading (`Refreshing…` + spin), then status with counts (`added` / `updated` / `records cached`) or error text.
3. Legacy page also got the same Refresh control for `/admin/crm` fallback path.

## Local 5173 proof

| Check | Result |
|-------|--------|
| Vite `127.0.0.1:5173` | PASS (PID listening) |
| Module HTTP `AdminCrmWorkspacePage.tsx` | PASS — contains pull + Refresh |
| Signed-in Playwright `/admin/crm` | PASS — Refresh **visible**, click OK |
| Status after click | `Refresh failed: Supabase not configured` (expected: everyday `.env.local` blank Supabase for offline demo) |
| Auth wall | N/A — offline/dev auth used |

Artifacts (local only, not Desktop): `docs/ops/LOCAL-CRM-PULL-REFRESH-PROOF.json`, `docs/ops/LOCAL-CRM-PULL-REFRESH-PROOF.png`

## Typecheck

- **PASS (box)** `/workspace/finely-tc-check` `npx tsc --noEmit` EXITCODE=0 (~59s)
- Windows tsc not required (prior OOM)

## SHAs (fill after commit / push / deploy)

| Surface | SHA |
|---------|-----|
| Pre-change HEAD | `3c68092082064a3144aebf434325882f5ced6deb` |
| Feature commit | TBD |
| `origin/sync/launch-521910f` | TBD |
| Live `dist/RELEASE.json` | TBD |

## Deploy notes

- FULL push `sync/launch-521910f` only (no force).
- Prod-bake via temporary `.env.production.local` — **do not touch** everyday `.env.local`.
- Soft SEO HOLD.
- Verify live `/admin/crm` in RELEASE/bundle (can't sign in as user).
