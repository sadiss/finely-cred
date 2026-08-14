import type { FunnelExperimentVariant } from '../domain/funnelExperiments';
import { recordFunnelConversion } from '../data/funnelExperimentsRepo';

/**
 * Cross-page A/B conversion bridge.
 *
 * `assignFunnelVariant()`/`recordFunnelConversion()` in `funnelExperimentsRepo.ts`
 * are same-page primitives — every existing caller (`LeadMagnetFunnelShell.tsx`,
 * `submitLeadMagnetCapture.ts`) assigns a variant and records its conversion on
 * the same page view. A CTA-*destination* test breaks that assumption: the
 * visitor is assigned a variant on the homepage, then navigates away, and the
 * real "conversion" (checkout start, intake submit) happens on a *different*
 * page/route entirely, after the homepage's own React tree has unmounted.
 *
 * This module persists the assigned variant to `sessionStorage` at the moment
 * of navigation so a conversion event firing later, on any other page in the
 * same browser tab/session, can still be reconciled back to the correct
 * variant and funnel.
 */

const BRIDGE_KEY_PREFIX = 'finely.ctaBridge.';

function bridgeKey(funnelId: string): string {
  return `${BRIDGE_KEY_PREFIX}${funnelId}`;
}

function isValidVariant(value: string | null): value is FunnelExperimentVariant {
  return value === 'control' || value === 'variant_a' || value === 'variant_b';
}

/** Call at the moment of CTA navigation — persists the variant for later reconciliation. */
export function persistCtaBridgeVariant(funnelId: string, variant: FunnelExperimentVariant): void {
  try {
    sessionStorage.setItem(bridgeKey(funnelId), variant);
  } catch {
    // sessionStorage unavailable (privacy mode, SSR, etc.) — non-fatal, just means
    // a downstream conversion on another page won't be attributable to a variant.
  }
}

/** Peek the persisted variant without clearing it (for read-only display/debug). */
export function peekCtaBridgeVariant(funnelId: string): FunnelExperimentVariant | null {
  try {
    const raw = sessionStorage.getItem(bridgeKey(funnelId));
    return isValidVariant(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Call from a destination page's real conversion event (checkout start, intake
 * submit, etc.). Reads back the bridged variant, records the conversion against
 * the *originating* funnel (e.g. `homepage_hero`), then clears the key so a
 * second, unrelated conversion later in the same session isn't double-counted.
 * Safe to call speculatively — no-ops if no bridge value is present.
 */
export function reconcileCtaBridgeConversion(funnelId: string): void {
  try {
    const key = bridgeKey(funnelId);
    const raw = sessionStorage.getItem(key);
    if (!isValidVariant(raw)) return;
    recordFunnelConversion(funnelId, raw);
    sessionStorage.removeItem(key);
  } catch {
    // ignore — best-effort attribution only, must never block the real conversion flow
  }
}
