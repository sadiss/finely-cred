import { loadSettings } from '../data/settingsRepo';

/** Default public promise when `site.leadMagnetCallSlaHours` is unset. */
export const DEFAULT_LEAD_MAGNET_CALL_SLA = 'We’ll call within 1 business day';

export function resolveLeadMagnetCallSlaHours(hoursOverride?: number | null): number | undefined {
  if (typeof hoursOverride === 'number' && Number.isFinite(hoursOverride) && hoursOverride > 0) {
    return Math.round(hoursOverride);
  }
  const fromSettings = loadSettings().site.leadMagnetCallSlaHours;
  if (typeof fromSettings === 'number' && Number.isFinite(fromSettings) && fromSettings > 0) {
    return Math.round(fromSettings);
  }
  return undefined;
}

/** English call-SLA line for funnel thank-you panels. */
export function leadMagnetCallSlaLabel(hoursOverride?: number | null): string {
  const hours = resolveLeadMagnetCallSlaHours(hoursOverride);
  if (!hours) return DEFAULT_LEAD_MAGNET_CALL_SLA;
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? DEFAULT_LEAD_MAGNET_CALL_SLA : `We’ll call within ${days} business days`;
  }
  return `We’ll call within ${hours} hour${hours === 1 ? '' : 's'}`;
}

/** Kreyòl call-SLA line for `/free-kreyol-guide`. */
export function leadMagnetCallSlaLabelHt(hoursOverride?: number | null): string {
  const hours = resolveLeadMagnetCallSlaHours(hoursOverride);
  if (!hours || hours === 24 || hours % 24 === 0) {
    const days = hours && hours % 24 === 0 ? hours / 24 : 1;
    return days === 1 ? 'Nou pral rele w nan 1 jou ouvrab' : `Nou pral rele w nan ${days} jou ouvrab`;
  }
  return `Nou pral rele w nan ${hours} èdtan`;
}
