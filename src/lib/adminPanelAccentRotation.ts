import type { FcAdminTone } from '../features/os/finelyOsAdminSurface';

/** Rotate accent families for sibling tiles — no adjacent same tone in small grids. */
export function adminPanelAccentAt(index: number, pool: FcAdminTone[] = ['sky', 'violet', 'emerald', 'gold', 'rose', 'navy']): FcAdminTone {
  return pool[index % pool.length] ?? 'sky';
}

const SECTION_TONE: Record<string, FcAdminTone> = {
  identity: 'violet',
  mailing: 'gold',
  monitoring: 'sky',
  bureaus: 'emerald',
  business: 'navy',
  notes: 'rose',
  social: 'violet',
  main: 'sky',
};

export function adminPanelSectionTone(sectionId: string, index = 0): FcAdminTone {
  return SECTION_TONE[sectionId] ?? adminPanelAccentAt(index);
}
