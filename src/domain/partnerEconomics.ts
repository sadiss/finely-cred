/** Shared economics models for Denefit in-house contracts, credit specialists, and affiliates. */

export type DenefitsContractInput = {
  contractValueCents: number;
  termMonths: number;
  monthlyPaymentCents: number;
  specialistSharePct: number;
  /** Optional platform / Finely share on the contract stream */
  platformSharePct?: number;
};

export type DenefitsContractProjection = {
  contractValueCents: number;
  termMonths: number;
  monthlyPaymentCents: number;
  totalCollectedCents: number;
  specialistSharePct: number;
  specialistTotalCents: number;
  specialistMonthlyCents: number;
  platformSharePct: number;
  platformTotalCents: number;
  yearlySpecialistCents: number[];
};

/** @deprecated Wrong legacy name — use DenefitsContractInput. Brand is Denefit, not Benefits. */
export type BenefitsContractInput = DenefitsContractInput;
/** @deprecated Wrong legacy name — use DenefitsContractProjection. Brand is Denefit, not Benefits. */
export type BenefitsContractProjection = DenefitsContractProjection;

export function computeDenefitsContractProjection(input: DenefitsContractInput): DenefitsContractProjection {
  const termMonths = Math.max(1, Math.round(input.termMonths));
  const monthlyPaymentCents = Math.max(0, Math.round(input.monthlyPaymentCents));
  const contractValueCents = Math.max(0, Math.round(input.contractValueCents));
  const totalCollectedCents = monthlyPaymentCents * termMonths || contractValueCents;
  const specialistSharePct = Math.min(100, Math.max(0, input.specialistSharePct));
  const platformSharePct = Math.min(100, Math.max(0, input.platformSharePct ?? 100 - specialistSharePct));
  const specialistTotalCents = Math.round((totalCollectedCents * specialistSharePct) / 100);
  const platformTotalCents = Math.round((totalCollectedCents * platformSharePct) / 100);
  const specialistMonthlyCents = Math.round(specialistTotalCents / termMonths);

  const years = Math.ceil(termMonths / 12);
  const yearlySpecialistCents: number[] = [];
  for (let y = 0; y < years; y += 1) {
    const start = y * 12;
    const monthsInYear = Math.min(12, termMonths - start);
    yearlySpecialistCents.push(Math.round((specialistTotalCents * monthsInYear) / termMonths));
  }

  return {
    contractValueCents,
    termMonths,
    monthlyPaymentCents,
    totalCollectedCents,
    specialistSharePct,
    specialistTotalCents,
    specialistMonthlyCents,
    platformSharePct,
    platformTotalCents,
    yearlySpecialistCents,
  };
}

/** @deprecated Wrong legacy name — use computeDenefitsContractProjection. Brand is Denefit, not Benefits. */
export const computeBenefitsContractProjection = computeDenefitsContractProjection;

export type AffiliateCommissionInput = {
  saleAmountCents: number;
  commissionPct: number;
  recurringMonths?: number;
  recurringAmountCents?: number;
};

export type AffiliateCommissionProjection = {
  upfrontCents: number;
  recurringMonthlyCents: number;
  recurringTotalCents: number;
  grandTotalCents: number;
  commissionPct: number;
};

export function computeAffiliateCommission(input: AffiliateCommissionInput): AffiliateCommissionProjection {
  const commissionPct = Math.min(100, Math.max(0, input.commissionPct));
  const upfrontCents = Math.round((Math.max(0, input.saleAmountCents) * commissionPct) / 100);
  const recurringMonths = Math.max(0, Math.round(input.recurringMonths ?? 0));
  const recurringMonthlyCents = Math.round(
    ((Math.max(0, input.recurringAmountCents ?? 0) * commissionPct) / 100),
  );
  const recurringTotalCents = recurringMonthlyCents * recurringMonths;
  return {
    upfrontCents,
    recurringMonthlyCents,
    recurringTotalCents,
    grandTotalCents: upfrontCents + recurringTotalCents,
    commissionPct,
  };
}

export type AffiliateVolumeProjection = {
  referralsPerMonth: number;
  months: number;
  perReferralCents: number;
  monthlyTotalsCents: number[];
  cumulativeCents: number[];
  yearTotalCents: number;
};

export function computeAffiliateVolumeProjection(args: {
  referralsPerMonth: number;
  months: number;
  perReferralGrandTotalCents: number;
}): AffiliateVolumeProjection {
  const referralsPerMonth = Math.max(0, Math.round(args.referralsPerMonth));
  const months = Math.max(1, Math.min(36, Math.round(args.months)));
  const perReferralCents = Math.max(0, Math.round(args.perReferralGrandTotalCents));
  const monthlyTotalsCents: number[] = [];
  const cumulativeCents: number[] = [];
  let running = 0;
  for (let m = 0; m < months; m += 1) {
    const monthTotal = referralsPerMonth * perReferralCents;
    monthlyTotalsCents.push(monthTotal);
    running += monthTotal;
    cumulativeCents.push(running);
  }
  return {
    referralsPerMonth,
    months,
    perReferralCents,
    monthlyTotalsCents,
    cumulativeCents,
    yearTotalCents: running,
  };
}

export type DenefitsMonthlyAccrual = {
  month: number;
  specialistCents: number;
  platformCents: number;
  cumulativeSpecialistCents: number;
};

export function computeDenefitsMonthlyAccrual(input: DenefitsContractInput): DenefitsMonthlyAccrual[] {
  const projection = computeDenefitsContractProjection(input);
  const rows: DenefitsMonthlyAccrual[] = [];
  let cumulative = 0;
  for (let m = 1; m <= projection.termMonths; m += 1) {
    const specialistCents = projection.specialistMonthlyCents;
    const platformCents = Math.round(projection.platformTotalCents / projection.termMonths);
    cumulative += specialistCents;
    rows.push({ month: m, specialistCents, platformCents, cumulativeSpecialistCents: cumulative });
  }
  return rows;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatUsdFromCentsPrecise(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
