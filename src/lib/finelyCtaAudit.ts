/**
 * Dev helper — re-exports intent paths and documents audit entry point.
 * Run: npm run cta:bare-onboarding:audit
 */
import { resolveFinelyCtaPath, type FinelyCtaIntentId } from './finelyCtaIntent';

export const FINELY_CTA_INTENT_PATHS: Record<FinelyCtaIntentId, string> = {
  personal_free_guide: resolveFinelyCtaPath('personal_free_guide'),
  personal_free_trial: resolveFinelyCtaPath('personal_free_trial'),
  personal_intake: resolveFinelyCtaPath('personal_intake'),
  personal_package: '(requires packageId — use resolveFinelyCtaPath with options)',
  business_intake: resolveFinelyCtaPath('business_intake'),
  debt_intake: resolveFinelyCtaPath('debt_intake'),
  funding_intake: resolveFinelyCtaPath('funding_intake'),
  consultation: resolveFinelyCtaPath('consultation', { consultationLane: 'General' }),
  career_track: '(requires careerPath — use resolveFinelyCtaPath with options)',
  lead_magnet: resolveFinelyCtaPath('lead_magnet'),
  affiliate_intake: resolveFinelyCtaPath('affiliate_intake'),
  au_seller_intake: resolveFinelyCtaPath('au_seller_intake'),
  au_buyer_intake: resolveFinelyCtaPath('au_buyer_intake'),
  tradeline_intake: resolveFinelyCtaPath('tradeline_intake'),
  agent_intake: resolveFinelyCtaPath('agent_intake'),
  score_roadmap_intake: resolveFinelyCtaPath('score_roadmap_intake'),
  heta_intake: resolveFinelyCtaPath('heta_intake'),
};

export const FINELY_CTA_AUDIT_SCRIPT = 'scripts/audit-bare-onboarding.mjs';
