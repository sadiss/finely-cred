/**
 * Single spine for public CTA routing — pages should not call bare `/onboarding`.
 *
 * @see scripts/audit-bare-onboarding.mjs
 */
import type { NavigateFunction } from 'react-router-dom';
import {
  resolvePackageSelectPath,
  type PackageCheckoutRail,
} from './packageCheckoutRouting';
import { signupUrlForCareerPath } from './onboardingRoleRouting';

export type FinelyCtaIntentId =
  | 'personal_free_guide'
  | 'personal_intake'
  | 'personal_package'
  | 'business_intake'
  | 'debt_intake'
  | 'funding_intake'
  | 'consultation'
  | 'career_track'
  | 'lead_magnet';

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
  /** lead_magnet */
  leadMagnetLane?: string;
  referralCode?: string;
  next?: string;
  email?: string;
  name?: string;
  phone?: string;
  leadId?: string;
};

const PERSONAL_INTAKE_PATH =
  '/onboarding?focus=personal_restore&lane=other&role=client&skipRole=1&next=/portal/dashboard';

const BUSINESS_INTAKE_PATH =
  '/onboarding?focus=business_credit&lane=business_credit&role=client&skipRole=1';

const DEBT_INTAKE_PATH =
  '/onboarding?focus=debt_kill&lane=debt_kill&role=client&skipRole=1';

const FUNDING_INTAKE_PATH =
  '/onboarding?lane=funding_readiness&focus=funding&role=client&skipRole=1';

/** Resolve a contextual path for a CTA intent (guest or authed). */
export function resolveFinelyCtaPath(
  intent: FinelyCtaIntentId,
  options: FinelyCtaIntentOptions = {},
): string {
  switch (intent) {
    case 'personal_free_guide':
      return '/free-guide';

    case 'personal_intake':
      return PERSONAL_INTAKE_PATH;

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
      return BUSINESS_INTAKE_PATH;

    case 'debt_intake':
      return DEBT_INTAKE_PATH;

    case 'funding_intake':
      return FUNDING_INTAKE_PATH;

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
      if (options.referralCode?.trim()) params.set('ref', options.referralCode.trim());
      params.set('next', (options.next || '/portal/dashboard').trim() || '/portal/dashboard');
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
