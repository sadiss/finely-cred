import { initPwaServiceWorkerStrategy } from './pwaRegister';
import './staffAutomationSyncRunners';

/** Side-effect boot (no staff Supabase sync here — deferred until workspace + auth). */
export function initFinelyBoot() {
  if (typeof window === 'undefined') return;
  initPwaServiceWorkerStrategy();
}
