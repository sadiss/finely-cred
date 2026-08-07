/**
 * Auth-aware package Select / Start free / Join routing.
 *
 * Guest  → /onboarding with package + rail + next preserved → checkout after auth
 * Authed → /portal/checkout immediately (never sticky onboarding flash)
 */

export type PackageCheckoutRail = 'stripe' | 'in_house';

export function buildPortalCheckoutPath(
  packageId: string,
  rail?: PackageCheckoutRail | null,
  extras?: Record<string, string | undefined | null>,
): string {
  const qs = new URLSearchParams();
  qs.set('package', packageId);
  if (rail) qs.set('rail', rail);
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v != null && String(v).trim()) qs.set(k, String(v));
    }
  }
  return `/portal/checkout?${qs.toString()}`;
}

/** Query keys that must survive login ↔ signup ↔ onboarding switches. */
export const PACKAGE_ROUTING_PRESERVE_KEYS = [
  'package',
  'rail',
  'next',
  'lane',
  'tier',
  'role',
  'skipRole',
  'goal',
  'email',
  'invite',
  'partnerId',
  'focus',
] as const;

export function pickPreservedAuthSearch(search: string | URLSearchParams): URLSearchParams {
  const src = typeof search === 'string' ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search) : search;
  const out = new URLSearchParams();
  for (const key of PACKAGE_ROUTING_PRESERVE_KEYS) {
    const v = src.get(key);
    if (v != null && v !== '') out.set(key, v);
  }
  return out;
}

export function buildPackageGuestEntryPath(args: {
  packageId: string;
  rail?: PackageCheckoutRail | null;
  /** Default onboarding preserves package/rail/next through signup ↔ login. */
  entry?: 'signup' | 'onboarding' | 'login';
}): string {
  const checkout = buildPortalCheckoutPath(args.packageId, args.rail);
  const qs = new URLSearchParams();
  qs.set('package', args.packageId);
  if (args.rail) qs.set('rail', args.rail);
  qs.set('next', checkout);
  const entry = args.entry ?? 'onboarding';
  if (entry === 'login') {
    qs.set('auth', 'login');
    return `/login?${qs.toString()}`;
  }
  if (entry === 'signup') {
    qs.set('auth', 'signup');
    return `/signup?${qs.toString()}`;
  }
  return `/onboarding?${qs.toString()}`;
}

/** Resolve path for Start free / Select / Join package CTAs. */
export function resolvePackageSelectPath(args: {
  packageId: string;
  rail?: PackageCheckoutRail | null;
  isAuthed: boolean;
  guestEntry?: 'signup' | 'onboarding' | 'login';
}): string {
  if (args.isAuthed) {
    return buildPortalCheckoutPath(args.packageId, args.rail);
  }
  return buildPackageGuestEntryPath({
    packageId: args.packageId,
    rail: args.rail,
    entry: args.guestEntry ?? 'onboarding',
  });
}

/** If authed and URL carries a package (or checkout next), bounce target. */
export function resolveAuthedOnboardingBouncePath(search: string): string | null {
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const nextRaw = (sp.get('next') || '').trim();
  if (nextRaw.startsWith('/') && !nextRaw.startsWith('/onboarding') && !nextRaw.startsWith('/login') && !nextRaw.startsWith('/signup')) {
    return nextRaw;
  }
  const packageId = (sp.get('package') || '').trim();
  if (!packageId) return null;
  const rail = sp.get('rail') as PackageCheckoutRail | null;
  return buildPortalCheckoutPath(packageId, rail === 'stripe' || rail === 'in_house' ? rail : null);
}

export function searchHasPackageCheckoutIntent(search: string): boolean {
  const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (sp.get('package')) return true;
  const next = sp.get('next') || '';
  return next.includes('/portal/checkout');
}
