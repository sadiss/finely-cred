import { canRunStaffAutomationSupabaseSync, type BootSyncContext } from './bootSyncGate';
import { isSupabaseCircuitOpen, noteSupabaseHttpStatus } from './supabaseAuthGuard';

export type StaffSyncRunner = () => Promise<void>;

const runners: StaffSyncRunner[] = [];
let ranForSession = false;
let idleHandle: number | null = null;

/** Launch branch: register ensureHumanStaffSyncedOnce, ensureOpsPersistenceSyncedOnce, etc. */
export function registerStaffAutomationSyncRunner(runner: StaffSyncRunner) {
  runners.push(runner);
}

function runWhenIdle(fn: () => void) {
  if (typeof window.requestIdleCallback === 'function') {
    idleHandle = window.requestIdleCallback(() => fn(), { timeout: 4000 });
  } else {
    idleHandle = window.setTimeout(fn, 1500);
  }
}

export async function runStaffAutomationSyncsOnce(ctx: BootSyncContext): Promise<void> {
  if (!canRunStaffAutomationSupabaseSync(ctx)) return;
  if (ranForSession) return;
  if (!runners.length) return;

  ranForSession = true;

  for (const runner of runners) {
    if (isSupabaseCircuitOpen()) break;
    try {
      await runner();
    } catch (err: unknown) {
      const status = (err as any)?.status ?? (err as any)?.code;
      if (status === 401 || String((err as any)?.message ?? '').includes('401')) {
        noteSupabaseHttpStatus(401, 'staffAutomationSync');
        break;
      }
    }
  }
}

export function scheduleStaffAutomationSync(ctx: BootSyncContext) {
  if (!canRunStaffAutomationSupabaseSync(ctx)) return;
  if (ranForSession) return;
  if (idleHandle != null) return;

  runWhenIdle(() => {
    idleHandle = null;
    void runStaffAutomationSyncsOnce(ctx);
  });
}

export function resetStaffAutomationSyncSchedule() {
  ranForSession = false;
  if (idleHandle != null) {
    if (typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleHandle);
    } else {
      window.clearTimeout(idleHandle);
    }
    idleHandle = null;
  }
}
