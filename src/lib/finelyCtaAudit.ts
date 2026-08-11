/**
 * Dev helper — re-exports intent paths and documents audit entry point.
 * Run: npm run cta:bare-onboarding:audit
 */
import { resolveFinelyCtaPath, type FinelyCtaIntentId } from './finelyCtaIntent';

export const FINELY_CTA_INTENT_PATHS: Record<FinelyCtaIntentId, string> = {
  personal_free_guide: resolveFinelyCtaPath('personal_free_guide'),
  personal_intake: resolveFinelyCtaPath('personal_intake'),
  personal_package: '(requires packageId — use resolveFinelyCtaPath with options)',
  business_intake: resolveFinelyCtaPath('business_intake'),
  debt_intake: resolveFinelyCtaPath('debt_intake'),
  funding_intake: resolveFinelyCtaPath('funding_intake'),
  consultation: resolveFinelyCtaPath('consultation', { consultationLane: 'General' }),
  career_track: '(requires careerPath — use resolveFinelyCtaPath with options)',
  lead_magnet: resolveFinelyCtaPath('lead_magnet'),
};

export const FINELY_CTA_AUDIT_SCRIPT = 'scripts/audit-bare-onboarding.mjs';
