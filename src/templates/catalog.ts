import type { TemplateBase, TemplateTone, TemplateVariantRecipe } from '../domain/templates';

export const US_STATE_CODES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
] as const;

export type GeneratedTemplateKey = {
  baseId: string;
  variantId: string;
  tone: TemplateTone;
  version: number;
  /** Optional: state-specific specialization (state-aware per partner). */
  jurisdictionState?: string;
};

export function countGeneratedTemplates(args: {
  bases: TemplateBase[];
  variants: TemplateVariantRecipe[];
  tones: TemplateTone[];
  /**
   * If true, count each state as a separate specialization in the “library size” number.
   * This is useful to express how the generator yields thousands without storing them as files.
   */
  includeStates?: boolean;
  stateCount?: number;
}): number {
  const perBase = (b: TemplateBase) => {
    const versions = Math.max(1, b.versions || 1);
    return versions * args.variants.length * args.tones.length;
  };
  const baseTotal = args.bases.reduce((sum, b) => sum + perBase(b), 0);
  if (!args.includeStates) return baseTotal;
  const sc = Math.max(1, Math.round(args.stateCount ?? US_STATE_CODES.length));
  return baseTotal * sc;
}

