/** Dedicated dispute bureau / focus → specialist staff IDs (expansion roster). */

export const DISPUTE_BUREAU_COACH_IDS: Record<string, string> = {
  EQF: 'staff-latoya-james',
  equifax: 'staff-latoya-james',
  EXP: 'staff-derek-hughes',
  experian: 'staff-derek-hughes',
  TUC: 'staff-sharon-ivey',
  transunion: 'staff-sharon-ivey',
  Trans: 'staff-sharon-ivey',
};

export const DISPUTE_FOCUS_COACH_IDS: Record<string, string> = {
  ...DISPUTE_BUREAU_COACH_IDS,
  metro: 'staff-malcolm-grant',
  tradeline: 'staff-cedric-powell',
  identity_theft: 'staff-brittany-owens',
  collection: 'staff-cedric-powell',
  dispute: 'staff-donovan-price',
  bureau: 'staff-donovan-price',
};

export const DEBT_WORKSTATION_COACH_IDS: Record<string, string> = {
  validation: 'staff-monique-baker',
  court: 'staff-terrence-floyd',
  summons: 'staff-terrence-floyd',
  foreclosure: 'staff-darnell-price',
  repossession: 'staff-reginald-shaw',
  debt: 'staff-monique-baker',
  bankruptcy: 'staff-kenya-wells',
};

export const FUNDING_FOCUS_COACH_IDS: Record<string, string> = {
  lane_funding_readiness: 'staff-keisha-porter',
  funding_readiness: 'staff-keisha-porter',
  lane_business_credit: 'staff-gregory-simmons',
  business_credit: 'staff-gregory-simmons',
  vendor: 'staff-gregory-simmons',
  lane_capital_deployment: 'staff-antonio-vega',
  capital_deployment: 'staff-antonio-vega',
  commercial: 'staff-antonio-vega',
  lane_nora_capital: 'staff-rachel-stone',
  nora_capital: 'staff-rachel-stone',
  underwriting: 'staff-rachel-stone',
  funding: 'staff-keisha-porter',
};

export function resolveStaffIdForLaneFocus(focusId: string, lane?: string): string | null {
  const key = focusId.trim();
  const l = (lane ?? '').toLowerCase();
  if (l.includes('bankruptcy')) return null;
  if (
    l.includes('funding') ||
    l.includes('wealth') ||
    l.includes('business_credit') ||
    l.includes('vendor') ||
    key.startsWith('lane_')
  ) {
    return FUNDING_FOCUS_COACH_IDS[key] ?? FUNDING_FOCUS_COACH_IDS[key.toLowerCase()] ?? null;
  }
  if (l.includes('debt') || l.includes('validation') || l.includes('court') || l.includes('foreclosure') || l.includes('repossession')) {
    return DEBT_WORKSTATION_COACH_IDS[key] ?? DEBT_WORKSTATION_COACH_IDS[key.toLowerCase()] ?? null;
  }
  return DISPUTE_FOCUS_COACH_IDS[key] ?? DISPUTE_FOCUS_COACH_IDS[key.toLowerCase()] ?? null;
}
