/**
 * Co-owner environment mode + testing doctrine — isolated from runtime context graph.
 */

import { isSupabaseConfigured } from './supabaseClient';
import { buildCoOwnerDeepReasoningPrompt } from './coOwnerDeepIntelligence';

const ENV_KEY = 'finely.coowner.environment.v1';

export type CoOwnerEnvironmentMode = 'testing' | 'staging' | 'production';

export function getCoOwnerEnvironmentMode(): CoOwnerEnvironmentMode {
  try {
    const stored = localStorage.getItem(ENV_KEY);
    if (stored === 'production' || stored === 'staging' || stored === 'testing') return stored;
  } catch {
    /* ignore */
  }
  if (import.meta.env.DEV) return 'testing';
  if (!isSupabaseConfigured) return 'testing';
  return 'staging';
}

export function setCoOwnerEnvironmentMode(mode: CoOwnerEnvironmentMode) {
  try {
    localStorage.setItem(ENV_KEY, mode);
    window.dispatchEvent(new CustomEvent('finely:store'));
  } catch {
    /* ignore */
  }
}

export function isCoOwnerTestingMode(): boolean {
  return getCoOwnerEnvironmentMode() === 'testing';
}

export const CO_OWNER_TESTING_DOCTRINE = `
ENVIRONMENT — TESTING / QA MODE (critical):
- Finely Cred is in ACTIVE TESTING. The owner is validating the platform, automations, and co-owner ops — NOT reporting business failure.
- Low or zero partners, leads, revenue, cases, and tasks are EXPECTED in this environment. Do NOT interpret them as "the company is struggling," "we are failing," or "panic hiring/fire drills."
- Empty queues, blank Supabase keys, marketing-only mode, and simulated phone/SMS are normal test signals.
- Frame status as: "test environment healthy" vs "production launch blockers" — separate QA progress from live P&L.
- Tone: calm, confident steward. Celebrate passing launch gates and completed test flows. Never shame the owner for sparse data.
- When hiring autonomously in testing, treat hires as roster/executive org drills unless owner says production is live.
- If owner asks "how are we doing?" — lead with: code track, launch gates, test coverage, then optional production checklist — NOT doom from empty CRM.
`.trim();

export function buildCoOwnerTestingPromptBlock(): string {
  const deep = buildCoOwnerDeepReasoningPrompt();
  if (!isCoOwnerTestingMode()) {
    return [`Environment: ${getCoOwnerEnvironmentMode().toUpperCase()} — interpret metrics for live operations.`, deep].join('\n\n');
  }
  return [CO_OWNER_TESTING_DOCTRINE, deep].join('\n\n');
}
