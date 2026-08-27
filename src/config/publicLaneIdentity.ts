/**
 * Public lane identity kit — Phase 1 of the page-identity plan.
 *
 * Each public "lane" (restore, debt, business, specialist, financing, careers,
 * resources, start, home) gets a distinct title position / size / card motif so
 * major public pages no longer look interchangeable. Consumed by
 * `PublicLaneTitle` (src/components/public/PublicLaneTitle.tsx).
 *
 * Keep this additive — do not fight existing luxury sell bands (Debt / Business /
 * CS guide landings already have strong bespoke heroes and are intentionally
 * left out of the apply pass).
 */
import type { FinelyOsPublicAccent } from '../features/os/finelyOsLightUi';

export type PublicLaneId =
  | 'restore'
  | 'debt'
  | 'business'
  | 'specialist'
  | 'financing'
  | 'careers'
  | 'resources'
  | 'start'
  | 'home';

/** Where the eyebrow + title block sits in the first viewport. */
export type PublicLaneTitlePosition = 'center' | 'left' | 'split' | 'stack';

/** Title type scale — `display` only on 1-2 primary sell bands per page. */
export type PublicLaneTitleSize = 'display' | 'xl' | 'lg';

/** Card shell silhouette for content below the title. */
export type PublicLaneCardMotif = 'soft' | 'panel' | 'rail' | 'deck';

export type PublicLaneEyebrowStyle = 'pill' | 'rule' | 'plain' | 'vertical';

export interface PublicLaneKit {
  id: PublicLaneId;
  label: string;
  accent: FinelyOsPublicAccent;
  titlePosition: PublicLaneTitlePosition;
  titleSize: PublicLaneTitleSize;
  cardMotif: PublicLaneCardMotif;
  eyebrowStyle: PublicLaneEyebrowStyle;
  /** Faint oversized mark stamped behind the title for extra silhouette (optional). */
  stamp?: string;
  /** Gold underline draw beneath a `rule` eyebrow (restore lane signature). */
  divider?: boolean;
}

export const PUBLIC_LANE_KITS: Record<PublicLaneId, PublicLaneKit> = {
  restore: {
    id: 'restore',
    label: 'Restore',
    accent: 'emerald',
    titlePosition: 'left',
    titleSize: 'xl',
    cardMotif: 'soft',
    eyebrowStyle: 'rule',
    divider: true,
  },
  debt: {
    id: 'debt',
    label: 'Debt',
    accent: 'fuchsia',
    titlePosition: 'center',
    titleSize: 'display',
    cardMotif: 'panel',
    eyebrowStyle: 'pill',
  },
  business: {
    id: 'business',
    label: 'Business',
    accent: 'emerald',
    titlePosition: 'split',
    titleSize: 'xl',
    cardMotif: 'rail',
    eyebrowStyle: 'plain',
  },
  specialist: {
    id: 'specialist',
    label: 'Credit Specialist',
    accent: 'violet',
    titlePosition: 'left',
    titleSize: 'xl',
    cardMotif: 'deck',
    eyebrowStyle: 'pill',
  },
  financing: {
    id: 'financing',
    label: 'Financing',
    accent: 'sky',
    titlePosition: 'left',
    titleSize: 'lg',
    cardMotif: 'rail',
    eyebrowStyle: 'plain',
    stamp: '$',
  },
  careers: {
    id: 'careers',
    label: 'Careers',
    accent: 'rose',
    titlePosition: 'stack',
    titleSize: 'display',
    cardMotif: 'soft',
    eyebrowStyle: 'vertical',
  },
  resources: {
    id: 'resources',
    label: 'Resources',
    accent: 'violet',
    titlePosition: 'left',
    titleSize: 'lg',
    cardMotif: 'deck',
    eyebrowStyle: 'plain',
  },
  start: {
    id: 'start',
    label: 'Start here',
    accent: 'violet',
    titlePosition: 'center',
    titleSize: 'display',
    cardMotif: 'panel',
    eyebrowStyle: 'pill',
  },
  home: {
    id: 'home',
    label: 'Home',
    accent: 'fuchsia',
    titlePosition: 'center',
    titleSize: 'display',
    cardMotif: 'panel',
    eyebrowStyle: 'pill',
  },
};

export function getPublicLaneKit(id: PublicLaneId): PublicLaneKit {
  return PUBLIC_LANE_KITS[id];
}
