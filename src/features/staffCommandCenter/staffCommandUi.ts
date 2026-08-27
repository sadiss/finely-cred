import type { StaffMember } from './types';
import { isHumanStaffKind } from './StaffKindBadge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsGlowKpi,
  finelyOsViewTab,
} from '../os/finelyOsLightUi';

/** Staff Command Center — violet + emerald (no brown/amber chrome). */
export const STAFF_CMD_PANEL = `${finelyOsCatalogCard('violet')} space-y-5`;
export const STAFF_CMD_EYEBROW = `${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`;
export const STAFF_CMD_TITLE = FINELY_OS_ENTITY_TITLE;
export const STAFF_CMD_BODY = FINELY_OS_ENTITY_BODY;
export const STAFF_CMD_KPI = finelyOsGlowKpi('violet');
export const STAFF_CMD_KPI_EMERALD = finelyOsGlowKpi('emerald');
export const STAFF_CMD_PRIMARY_BTN = FINELY_OS_PRIMARY_BTN;
export const STAFF_CMD_SECONDARY_BTN = FINELY_OS_SECONDARY_BTN;
export const STAFF_CMD_HERO =
  'rounded-[2rem] border border-violet-500/25 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(139,92,246,0.14)_0%,transparent_55%),radial-gradient(700px_280px_at_100%_0%,rgba(16,185,129,0.10)_0%,transparent_50%)] p-6';

export function staffCmdTab(active: boolean) {
  return finelyOsViewTab(active, 'violet');
}

export function staffCmdSelected(active: boolean) {
  return active
    ? 'border-violet-400/60 bg-violet-500/12 text-violet-100'
    : 'border-white/10 bg-black/20 text-white/70 hover:border-violet-500/30 hover:bg-white/[0.05]';
}

export function staffCmdCardBorder(staff: StaffMember, selected: boolean) {
  if (selected) {
    return isHumanStaffKind(staff.kind)
      ? 'border-rose-400/55 bg-rose-500/10'
      : 'border-violet-400/60 bg-violet-500/10';
  }
  if (staff.status === 'blocked') return 'border-rose-500/25 bg-rose-500/5';
  if (staff.status === 'needs_approval') return 'border-sky-500/25 bg-sky-500/5';
  if (staff.status === 'working') {
    return isHumanStaffKind(staff.kind)
      ? 'border-sky-500/25 bg-sky-500/5'
      : 'border-emerald-500/20 bg-emerald-500/5';
  }
  return isHumanStaffKind(staff.kind)
    ? 'border-sky-500/15 bg-sky-500/[0.03]'
    : 'border-white/10 bg-white/[0.03]';
}

export function staffCmdHighlightPanel() {
  return 'rounded-2xl border border-violet-500/25 bg-violet-500/10 text-violet-100';
}

export function staffCmdSelectedChip(kind: StaffMember['kind']) {
  if (isHumanStaffKind(kind)) return 'border-rose-400/55 bg-rose-500/10';
  if (kind === 'system_team') return 'border-white/20 bg-white/[0.06]';
  return 'border-violet-400/55 bg-violet-500/10';
}

export function staffCmdRecommendPanel() {
  return 'rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-100';
}
