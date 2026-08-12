/**
 * Single spine for public CTA routing — pages should not call bare `/onboarding`.
 *
 * @see scripts/audit-bare-onboarding.mjs
 */
import type { NavigateFunction } from 'react-router-dom';
import {
  buildPortalCheckoutPath,
  resolvePackageSelectPath,
  type PackageCheckoutRail,
} from './packageCheckoutRouting';
import { signupUrlForCareerPath, signupUrlForRole } from './onboardingRoleRouting';

/** Default package for sitewide "Start free trial" (personal credit restore DIY). */
export const PERSONAL_FREE_TRIAL_PACKAGE_ID = 'personal_free';

export type FinelyCtaIntentId =
  | 'personal_free_guide'
  | 'personal_free_trial'
  | 'personal_intake'
  | 'personal_package'
  | 'business_intake'
  | 'debt_intake'
  | 'funding_intake'
  | 'consultation'
  | 'career_track'
  | 'lead_magnet'
  | 'affiliate_intake'
  | 'au_seller_intake'
  | 'au_buyer_intake'
  | 'tradeline_intake'
  | 'agent_intake'
  | 'score_roadmap_intake'
  | 'heta_intake';

export type FinelyCtaIntentOptions = {
  /** personal_package */
  packageId?: string;
  rail?: PackageCheckoutRail | null;
  isAuthed?: boolean;
  guestEntry?: 'signup' | 'onboarding' | 'login';
  /** consultation */
  consultationLane?: string;
  /** career_track */
  careerPath?: string;
  /** lead_magnet + lane helpers */
  leadMagnetLane?: string;
  role?: string;
  skipRole?: string;
  focus?: string;
  referralCode?: string;
  next?: string;
  email?: string;
  name?: string;
  phone?: string;
  leadId?: string;
};

export type LaneOnboardingOpts = Pick<
  FinelyCtaIntentOptions,
  'referralCode' | 'next' | 'email' | 'name' | 'phone' | 'leadId'
>;

const PERSONAL_INTAKE_PATH =
  '/onboarding?focus=personal_restore&lane=other&role=client&skipRole=1&next=/portal/dashboard';

const BUSINESS_INTAKE_PATH =
  '/onboarding?focus=business_credit&lane=business_credit&role=client&skipRole=1';

const DEBT_INTAKE_PATH =
  '/onboarding?focus=debt_kill&lane=debt_kill&role=client&skipRole=1';

const FUNDING_INTAKE_PATH =
  '/onboarding?lane=funding_readiness&focus=funding&role=client&skipRole=1';

function appendCtaExtras(base: string, options: FinelyCtaIntentOptions = {}): string {
  const [path, existingQs] = base.split('?');
  const qs = new URLSearchParams(existingQs ?? '');
  if (options.referralCode?.trim()) qs.set('ref', options.referralCode.trim());
  if (options.next?.trim()) qs.set('next', options.next.trim());
  if (options.email?.trim()) qs.set('email', options.email.trim());
  if (options.name?.trim()) qs.set('name', options.name.trim());
  if (options.phone?.trim()) qs.set('phone', options.phone.trim());
  if (options.leadId?.trim()) qs.set('leadId', options.leadId.trim());
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** Resolve funnel / magnet lane tokens → contextual onboarding or signup path. */
export function resolveLaneOnboardingPath(lane: string, opts: LaneOnboardingOpts = {}): string {
  const normalized = lane.trim().toLowerCase().replace(/-/g, '_');
  const extras: Record<string, string> = {};
  if (opts.referralCode?.trim()) extras.ref = opts.referralCode.trim();
  if (opts.email?.trim()) extras.email = opts.email.trim();
  if (opts.name?.trim()) extras.name = opts.name.trim();
  if (opts.phone?.trim()) extras.phone = opts.phone.trim();
  if (opts.leadId?.trim()) extras.leadId = opts.leadId.trim();

  switch (normalized) {
    case 'affiliate':
      return signupUrlForRole('affiliate', {
        next: opts.next?.trim() || '/affiliate/hub',
        ...extras,
      });
    case 'au_seller':
      return signupUrlForRole('au_seller', {
        next: opts.next?.trim() || '/seller/hub',
        ...extras,
      });
    case 'agent':
      return signupUrlForRole('agent', {
        next: opts.next?.trim() || '/credit-specialist/hub',
        ...extras,
      });
    case 'heta_society':
    case 'heta':
      return resolveFinelyCtaPath('heta_intake', opts);
    case 'score_roadmap':
      return resolveFinelyCtaPath('score_roadmap_intake', opts);
    case 'debt_relief':
    case 'debt_kill':
      return appendCtaExtras(DEBT_INTAKE_PATH, {
        next: opts.next,
        ...opts,
      });
    case 'business_credit':
      return appendCtaExtras(BUSINESS_INTAKE_PATH, opts);
    case 'funding_readiness':
      return appendCtaExtras(FUNDING_INTAKE_PATH, opts);
    case 'au_tradelines':
    case 'tradeline':
    case 'tradelines':
      return resolveFinelyCtaPath('tradeline_intake', opts);
    case 'personal_restore':
    default:
      return resolveFinelyCtaPath('lead_magnet', {
        leadMagnetLane: 'other',
        focus: 'personal_restore',
        role: 'client',
        skipRole: '1',
        next: opts.next ?? '/portal/dashboard',
        ...opts,
      });
  }
}

/** Resolve a contextual path for a CTA intent (guest or authed). */
export function resolveFinelyCtaPath(
  intent: FinelyCtaIntentId,
  options: FinelyCtaIntentOptions = {},
): string {
  switch (intent) {
    case 'personal_free_guide':
      return '/free-guide';

    case 'personal_free_trial': {
      const isAuthed = Boolean(options.isAuthed);
      if (isAuthed) {
        return buildPortalCheckoutPath(PERSONAL_FREE_TRIAL_PACKAGE_ID, 'stripe');
      }
      const checkoutNext = buildPortalCheckoutPath(PERSONAL_FREE_TRIAL_PACKAGE_ID, 'stripe');
      const qs = new URLSearchParams();
      qs.set('package', PERSONAL_FREE_TRIAL_PACKAGE_ID);
      qs.set('rail', 'stripe');
      qs.set('focus', 'personal_restore');
      qs.set('lane', 'other');
      qs.set('role', 'client');
      qs.set('skipRole', '1');
      qs.set('next', checkoutNext);
      qs.set('auth', 'signup');
      return `/onboarding?${qs.toString()}`;
    }

    case 'personal_intake':
      return appendCtaExtras(PERSONAL_INTAKE_PATH, options);

    case 'personal_package': {
      const packageId = (options.packageId || '').trim();
      if (!packageId) {
        throw new Error('finelyCtaIntent: personal_package requires packageId');
      }
      return resolvePackageSelectPath({
        packageId,
        rail: options.rail,
        isAuthed: Boolean(options.isAuthed),
        guestEntry: options.guestEntry,
      });
    }

    case 'business_intake':
      return appendCtaExtras(BUSINESS_INTAKE_PATH, options);

    case 'debt_intake':
      return appendCtaExtras(DEBT_INTAKE_PATH, options);

    case 'funding_intake':
      return appendCtaExtras(FUNDING_INTAKE_PATH, options);

    case 'consultation': {
      const lane = (options.consultationLane || 'General').trim() || 'General';
      return `/consultation?lane=${encodeURIComponent(lane)}`;
    }

    case 'career_track': {
      const careerPath = (options.careerPath || '').trim();
      if (!careerPath) {
        throw new Error('finelyCtaIntent: career_track requires careerPath');
      }
      return signupUrlForCareerPath(careerPath) ?? PERSONAL_INTAKE_PATH;
    }

    case 'lead_magnet': {
      const params = new URLSearchParams();
      params.set('lane', (options.leadMagnetLane || 'other').trim() || 'other');
      params.set('role', (options.role || 'client').trim() || 'client');
      params.set('skipRole', (options.skipRole ?? '1').trim() || '1');
      if (options.focus?.trim()) params.set('focus', options.focus.trim());
      if (options.referralCode?.trim()) params.set('ref', options.referralCode.trim());
      params.set('next', (options.next || '/portal/dashboard').trim() || '/portal/dashboard');
      if (options.email?.trim()) params.set('email', options.email.trim());
      if (options.name?.trim()) params.set('name', options.name.trim());
      if (options.phone?.trim()) params.set('phone', options.phone.trim());
      if (options.leadId?.trim()) params.set('leadId', options.leadId.trim());
      return `/onboarding?${params.toString()}`;
    }

    case 'affiliate_intake':
      return signupUrlForRole('affiliate', {
        next: options.next?.trim() || '/affiliate/hub',
        ...(options.referralCode?.trim() ? { ref: options.referralCode.trim() } : {}),
        ...(options.email?.trim() ? { email: options.email.trim() } : {}),
        ...(options.name?.trim() ? { name: options.name.trim() } : {}),
        ...(options.phone?.trim() ? { phone: options.phone.trim() } : {}),
        ...(options.leadId?.trim() ? { leadId: options.leadId.trim() } : {}),
      });

    case 'au_seller_intake':
      return signupUrlForRole('au_seller', {
        next: options.next?.trim() || '/seller/hub',
        ...(options.referralCode?.trim() ? { ref: options.referralCode.trim() } : {}),
        ...(options.email?.trim() ? { email: options.email.trim() } : {}),
        ...(options.name?.trim() ? { name: options.name.trim() } : {}),
        ...(options.phone?.trim() ? { phone: options.phone.trim() } : {}),
        ...(options.leadId?.trim() ? { leadId: options.leadId.trim() } : {}),
      });

    case 'au_buyer_intake': {
      const params = new URLSearchParams();
      params.set('lane', 'au_tradelines');
      params.set('focus', 'tradelines');
      params.set('role', 'client');
      params.set('skipRole', '1');
      params.set('next', (options.next || '/au/request').trim() || '/au/request');
      if (options.referralCode?.trim()) params.set('ref', options.referralCode.trim());
      if (options.email?.trim()) params.set('email', options.email.trim());
      if (options.name?.trim()) params.set('name', options.name.trim());
      if (options.phone?.trim()) params.set('phone', options.phone.trim());
      if (options.leadId?.trim()) params.set('leadId', options.leadId.trim());
      return `/onboarding?${params.toString()}`;
    }

    case 'tradeline_intake': {
      const params = new URLSearchParams();
      params.set('lane', 'au_tradelines');
      params.set('focus', 'tradelines');
      params.set('role', 'client');
      params.set('skipRole', '1');
      params.set('next', (options.next || '/portal/dashboard').trim() || '/portal/dashboard');
      if (options.referralCode?.trim()) params.set('ref', options.referralCode.trim());
      if (options.email?.trim()) params.set('email', options.email.trim());
      if (options.name?.trim()) params.set('name', options.name.trim());
      if (options.phone?.trim()) params.set('phone', options.phone.trim());
      if (options.leadId?.trim()) params.set('leadId', options.leadId.trim());
      return `/onboarding?${params.toString()}`;
    }

    case 'agent_intake':
      return signupUrlForRole('agent', {
        next: options.next?.trim() || '/credit-specialist/hub',
        ...(options.referralCode?.trim() ? { ref: options.referralCode.trim() } : {}),
        ...(options.email?.trim() ? { email: options.email.trim() } : {}),
        ...(options.name?.trim() ? { name: options.name.trim() } : {}),
        ...(options.phone?.trim() ? { phone: options.phone.trim() } : {}),
        ...(options.leadId?.trim() ? { leadId: options.leadId.trim() } : {}),
      });

    case 'score_roadmap_intake':
      return resolveFinelyCtaPath('lead_magnet', {
        leadMagnetLane: 'other',
        focus: 'personal_restore',
        role: 'client',
        skipRole: '1',
        next: options.next ?? '/portal/dashboard',
        ...options,
      });

    case 'heta_intake': {
      const params = new URLSearchParams();
      params.set('lane', 'heta_society');
      params.set('role', 'client');
      params.set('skipRole', '1');
      params.set('next', (options.next || '/portal/hos').trim() || '/portal/hos');
      if (options.referralCode?.trim()) params.set('ref', options.referralCode.trim());
      if (options.email?.trim()) params.set('email', options.email.trim());
      if (options.name?.trim()) params.set('name', options.name.trim());
      if (options.phone?.trim()) params.set('phone', options.phone.trim());
      if (options.leadId?.trim()) params.set('leadId', options.leadId.trim());
      return `/onboarding?${params.toString()}`;
    }

    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

/** Navigate helper — prefer this over raw `navigate('/onboarding')`. */
export function finelyCtaNavigate(
  navigate: NavigateFunction,
  intent: FinelyCtaIntentId,
  options?: FinelyCtaIntentOptions,
): void {
  navigate(resolveFinelyCtaPath(intent, options));
}
