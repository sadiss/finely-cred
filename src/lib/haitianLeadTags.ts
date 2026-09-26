import type { LeadCapture } from '../domain/leads';

/** Temperature tags stamped on a Haitian CSV row that has not opted in. */
export const HAITIAN_COLD_TEMPERATURE_TAGS = ['cold', 'temperature:cold'] as const;

/**
 * Tags added when a cold Haitian row opts in.
 * `temperature:warm` is the first consented band. `temperature:hot` is the
 * opted-in bucket Admin Leads OS filters on. `hot-opt-in` is the event marker.
 */
export const HAITIAN_HOT_OPT_IN_TAGS = [
  'hot-opt-in',
  'temperature:warm',
  'temperature:hot',
  'source:free_kreyol_opt_in',
] as const;

export type HaitianLeadLike = Pick<
  LeadCapture,
  'source' | 'offer' | 'funnelId' | 'funnelPath' | 'interest' | 'consentToContact' | 'consentEmailMarketing'
>;

export function leadHasHotOptInTag(tags: readonly string[]): boolean {
  return tags.some((t) => t === 'hot-opt-in' || t === 'temperature:hot' || t === 'source:free_kreyol_opt_in');
}

export function leadHasHaitianOrigin(lead: HaitianLeadLike, tags: readonly string[]): boolean {
  if (lead.source === 'haitian_csv_import') return true;
  if (lead.offer === 'haitian_credit_kit') return true;
  if (lead.funnelId === 'kreyol_companion') return true;
  const blob = `${lead.funnelPath ?? ''} ${lead.interest ?? ''}`.toLowerCase();
  if (/haitian|krey[oò]l/.test(blob)) return true;
  return tags.some(
    (t) =>
      t === 'haitian-community' ||
      t === 'audience:haitian_community' ||
      t === 'source:haitian_csv_import' ||
      t === 'source:free_kreyol_opt_in' ||
      t === 'hot-opt-in',
  );
}

/** Still-cold Haitian CSV row. Consented or hot-tagged rows are excluded. */
export function isColdHaitianCapture(lead: HaitianLeadLike, tags: readonly string[]): boolean {
  if (lead.consentToContact || lead.consentEmailMarketing) return false;
  if (leadHasHotOptInTag(tags)) return false;
  if (lead.source === 'haitian_csv_import') return true;
  const origin = tags.includes('source:haitian_csv_import') || tags.includes('audience:haitian_community');
  const cold = tags.includes('cold') || tags.includes('temperature:cold');
  return origin && cold;
}

/** Opted-in Haitian lead (CSV upgrade or organic /free-kreyol-guide capture). */
export function isOptedInHaitianCapture(lead: HaitianLeadLike, tags: readonly string[]): boolean {
  if (isColdHaitianCapture(lead, tags)) return false;
  if (leadHasHotOptInTag(tags)) return true;
  const consented = Boolean(lead.consentToContact || lead.consentEmailMarketing);
  return consented && leadHasHaitianOrigin(lead, tags) && lead.source !== 'haitian_csv_import';
}

export type HaitianCrmBucket = 'cold' | 'opted_in';

export function haitianCrmBucket(lead: HaitianLeadLike, tags: readonly string[]): HaitianCrmBucket | null {
  if (isColdHaitianCapture(lead, tags)) return 'cold';
  if (isOptedInHaitianCapture(lead, tags)) return 'opted_in';
  return null;
}
