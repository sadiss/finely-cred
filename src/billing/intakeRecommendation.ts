import type { PartnerRouteIntake } from '../domain/partners';

export type RecommendedTier = {
  productId: string;
  productName: string;
  reason: string;
  urgencyMultiplier: number;
  estimatedTotalLow: number;
  estimatedTotalHigh: number;
};

/**
 * Rules-based suggested starting point engine (not a guarantee of results or pricing).
 * Maps intake data to a recommended product tier for onboarding checkout routing.
 */
export function computeRecommendation(intake: PartnerRouteIntake): RecommendedTier {
  const goal = intake.goal ?? 'funding';
  const liabilityTier = intake.liabilityTier ?? 'low';
  const urgency = intake.urgency ?? 'planned';
  const fractureCount = intake.fractures?.length ?? 0;

  // Urgency multiplier
  const urgencyMultiplier = urgency === 'rapid' ? 1.25 : urgency === 'build' ? 0.9 : 1.0;

  // Map goal to product
  if (goal === 'business') {
    return {
      productId: 'prod_business_foundation',
      productName: 'Business Credit Foundation',
      reason:
        'Your goal is corporate stacking. Business Credit Foundation covers entity setup, vendor sequencing, and fundability planning.',
      urgencyMultiplier,
      estimatedTotalLow: Math.round(2500 * urgencyMultiplier),
      estimatedTotalHigh: Math.round(7500 * urgencyMultiplier),
    };
  }

  if (goal === 'debt') {
    return {
      productId: 'prod_debt_legal',
      productName: 'Debt & Summons Resolution',
      reason:
        'Your goal is liability liquidation. Debt & Summons Resolution covers collection defense, summons response, and escalation tracking.',
      urgencyMultiplier,
      estimatedTotalLow: Math.round(1500 * urgencyMultiplier),
      estimatedTotalHigh: Math.round(6000 * urgencyMultiplier),
    };
  }

  // Default: Personal Credit Restore
  // Adjust range based on liability tier and fractures
  let baseLow = 1800;
  let baseHigh = 4500;

  if (liabilityTier === 'mid') {
    baseLow = 2500;
    baseHigh = 5500;
  } else if (liabilityTier === 'high') {
    baseLow = 3500;
    baseHigh = 8000;
  }

  // Add for fracture count
  if (fractureCount > 4) {
    baseLow += 500;
    baseHigh += 1500;
  }

  return {
    productId: 'prod_personal_restore',
    productName: 'Personal Credit Restore',
    reason:
      'Your goal is institutional funding. Personal Credit Restore covers disputes, evidence capture, bureau rounds, and compliance support.',
    urgencyMultiplier,
    estimatedTotalLow: Math.round(baseLow * urgencyMultiplier),
    estimatedTotalHigh: Math.round(baseHigh * urgencyMultiplier),
  };
}
