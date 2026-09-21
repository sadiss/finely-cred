/**
 * Drop-in replacement for launch `main.tsx` eager Supabase fan-out (lines ~53–59 on
 * `launch/ready-sovereign-supreme`). Import this instead of calling ensure*SyncedOnce at module load.
 *
 * Bluehost / production merge:
 * 1. Remove from launch main.tsx: registerPwaServiceWorker() at top, and ALL void ensure*SyncedOnce / syncEmailWebhooks / ensureOpsPersistenceSyncedOnce
 * 2. Add: `import { applyLaunchSafeBoot } from './lib/launchMainBootPatch'` then `applyLaunchSafeBoot()`
 * 3. Keep template seeds local-only if desired; staff Supabase sync runs via App.tsx scheduleStaffAutomationSync (idle + admin workspace only)
 * 4. Ensure index.html includes marketing SW unregister inline script (see index.html)
 * 5. Deploy dist/ + public/sw.js; verify Network tab on `/` has NO human_staff_* on first paint
 */
import { initFinelyBoot } from './finelyBoot';

export function applyLaunchSafeBoot() {
  initFinelyBoot();
}
