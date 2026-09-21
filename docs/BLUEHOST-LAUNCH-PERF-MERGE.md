# Bluehost / launch branch — navigation perf merge (PR #28)

Production (`finelycred.com`) may still run **launch** `src/main.tsx` until this PR is merged and deployed.

## Symptoms if not merged

- URL changes on click; long blank/spinner before paint
- Network: many Supabase calls on `/` (`human_staff_*`, `nurture_enrollments`, `automation_rules` 401s)
- Service worker fetch errors on navigation

## Merge checklist (launch → PR #28 or vice versa)

### 1. `src/main.tsx`

**Remove** (launch):

```ts
registerPwaServiceWorker()
void ensureStaffRosterSyncedOnce()
void ensureHumanStaffSyncedOnce()
// … all other void ensure*SyncedOnce / syncEmailWebhooksFromSupabase / ensureOpsPersistenceSyncedOnce
```

**Use instead:**

```ts
import { applyLaunchSafeBoot } from './lib/launchMainBootPatch'
applyLaunchSafeBoot()
```

Register staff sync functions in `src/lib/staffAutomationSyncRunners.ts` after data modules exist.

### 2. `index.html`

- Keep **inline marketing SW unregister** script (before module bundle).
- Favicon links → `/favicon.ico`, `/brand/finely-cred-icon.svg`, `/apple-touch-icon.png`.
- **Remove** `index.html` block that unregisters SW **and** still calls `registerPwaServiceWorker()` on every load (pick one strategy — PR #28 uses unregister-on-marketing + register-on-workspace only).

### 3. Deploy artifacts

- Upload full `dist/` after `npm run build`
- Include `public/sw.js`, `favicon.ico`, `apple-touch-icon.png`, `brand/*`

### 4. Verify (incognito)

1. Open `/` — no staff table XHR for 10s
2. Click Resources — skeleton within ~100ms, page within 1–2s
3. Application tab — no service worker on `/` (marketing)
