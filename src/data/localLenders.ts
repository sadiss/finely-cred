export type LenderCategory = 'national' | 'credit_union' | 'local';

export type LenderPreset = {
  id: string;
  bank: string;
  product: string;
  projectedLimit: string;
  category: LenderCategory;
  relationshipFriendly?: boolean;
  noDocFriendly?: boolean;
  color: string;
  accent: string;
};

/**
 * Curated baseline list (10+). Local ZIP-based discovery can be layered later (FDIC/NCUA datasets).
 */
export const BASE_LENDER_PRESETS: LenderPreset[] = [
  {
    id: 'chase_ink_pref',
    bank: 'CHASE',
    product: 'Ink Business Preferred',
    projectedLimit: '$50k - $150k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-blue-900/40 to-slate-900/80',
    accent: 'text-blue-400',
  },
  {
    id: 'amex_biz_plat',
    bank: 'AMEX',
    product: 'Business Platinum',
    projectedLimit: 'No preset limit',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-neutral-800/40 to-stone-900/80',
    accent: 'text-slate-300',
  },
  {
    id: 'capone_spark_cash',
    bank: 'CAPITAL ONE',
    product: 'Spark Cash Plus',
    projectedLimit: 'No preset limit',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-red-900/20 to-slate-900/80',
    accent: 'text-red-300',
  },
  {
    id: 'boa_adv',
    bank: 'BANK OF AMERICA',
    product: 'Business Advantage',
    projectedLimit: '$20k - $50k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-red-900/20 to-slate-900/80',
    accent: 'text-red-400',
  },
  {
    id: 'wells_fargo_biz',
    bank: 'WELLS FARGO',
    product: 'Signify Business',
    projectedLimit: '$10k - $40k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-amber-900/15 to-slate-900/80',
    accent: 'text-amber-300',
  },
  {
    id: 'usbank_triplecash',
    bank: 'U.S. BANK',
    product: 'Triple Cash Rewards',
    projectedLimit: '$10k - $35k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-sky-900/20 to-slate-900/80',
    accent: 'text-sky-300',
  },
  {
    id: 'pnc_biz',
    bank: 'PNC',
    product: 'BusinessOptions',
    projectedLimit: '$10k - $35k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-orange-900/15 to-slate-900/80',
    accent: 'text-orange-300',
  },
  {
    id: 'td_biz',
    bank: 'TD BANK',
    product: 'Business Solutions',
    projectedLimit: '$10k - $30k',
    category: 'national',
    relationshipFriendly: true,
    color: 'from-emerald-900/15 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'nf_flagship',
    bank: 'NAVY FEDERAL',
    product: 'Flagship Rewards',
    projectedLimit: '$25k - $80k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    color: 'from-indigo-900/40 to-slate-900/80',
    accent: 'text-indigo-400',
  },
  {
    id: 'local_cu_1',
    bank: 'LOCAL CREDIT UNION',
    product: 'Business LOC / CC (relationship lane)',
    projectedLimit: '$10k - $75k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    color: 'from-emerald-900/20 to-slate-900/80',
    accent: 'text-emerald-300',
  },
  {
    id: 'local_bank_1',
    bank: 'LOCAL BANK',
    product: 'Relationship-based business line',
    projectedLimit: '$25k - $250k',
    category: 'local',
    relationshipFriendly: true,
    noDocFriendly: true,
    color: 'from-violet-900/20 to-slate-900/80',
    accent: 'text-violet-300',
  },
  {
    id: 'regional_cu_2',
    bank: 'REGIONAL CREDIT UNION',
    product: 'Business card + deposits lane',
    projectedLimit: '$10k - $60k',
    category: 'credit_union',
    relationshipFriendly: true,
    noDocFriendly: true,
    color: 'from-teal-900/20 to-slate-900/80',
    accent: 'text-teal-300',
  },
];

