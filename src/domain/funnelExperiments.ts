export type FunnelExperimentVariant = 'control' | 'variant_a' | 'variant_b';

export type FunnelExperiment = {
  id: string;
  funnelId: string;
  name: string;
  enabled: boolean;
  /** Headline override per variant */
  headlines: Partial<Record<FunnelExperimentVariant, string>>;
  /** CTA label override */
  ctaLabels: Partial<Record<FunnelExperimentVariant, string>>;
  /**
   * Destination route override per variant — used for CTA-destination tests
   * (e.g. the homepage hero's primary button routing to different funnels)
   * rather than same-page copy tests. Optional/additive so existing
   * headline/CTA-label-only experiments are unaffected.
   */
  ctaDestinations?: Partial<Record<FunnelExperimentVariant, string>>;
  /** Impression + conversion counters (local demo) */
  stats: Partial<Record<FunnelExperimentVariant, { impressions: number; conversions: number }>>;
  updatedAt: string;
};
