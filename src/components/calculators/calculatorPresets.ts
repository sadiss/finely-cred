/** Preset packages for commission calculators — amounts in dollars for UI. */
export const COMMISSION_PACKAGE_PRESETS = [
  { id: 'restore_starter', label: 'Restore Starter', sale: 497, recurring: 49, recurringMonths: 12 },
  { id: 'restore_pro', label: 'Restore Pro', sale: 1497, recurring: 49, recurringMonths: 12 },
  { id: 'restore_platinum', label: 'Restore Platinum', sale: 2997, recurring: 79, recurringMonths: 12 },
  { id: 'build_pro', label: 'Build Pro', sale: 1997, recurring: 49, recurringMonths: 12 },
  { id: 'business_builder', label: 'Business Builder', sale: 1997, recurring: 0, recurringMonths: 0 },
  { id: 'custom', label: 'Custom amount', sale: 497, recurring: 49, recurringMonths: 12 },
] as const;

export const DENEFITS_CONTRACT_PRESETS = [
  { id: 'standard', label: 'Standard ($3k / 5yr)', value: 3000, monthly: 109, years: 5 },
  { id: 'premium', label: 'Premium ($5k / 5yr)', value: 5000, monthly: 149, years: 5 },
  { id: 'elite', label: 'Elite ($7.5k / 6yr)', value: 7500, monthly: 189, years: 6 },
  { id: 'custom', label: 'Custom', value: 3000, monthly: 109, years: 5 },
] as const;
