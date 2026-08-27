import type { WlAccent } from './workspaceLightDesignTokens';
import type { FcAdminTone } from '../os/finelyOsAdminSurface';

/** Map preview accents → admin solid tone tokens (metallic gloss fills). */
export function wlAccentToAdminTone(accent: WlAccent): FcAdminTone {
  const map: Record<WlAccent, FcAdminTone> = {
    emerald: 'emerald',
    violet: 'violet',
    sky: 'sky',
    fuchsia: 'violet',
    rose: 'rose',
    navy: 'navy',
  };
  return map[accent];
}

export const WL_KPI_TONE_ROTATION: FcAdminTone[] = ['emerald', 'violet', 'sky', 'rose', 'navy', 'fuchsia'];
