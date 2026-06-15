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
  /** Impression + conversion counters (local demo) */
  stats: Partial<Record<FunnelExperimentVariant, { impressions: number; conversions: number }>>;
  updatedAt: string;
};
