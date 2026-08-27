import type React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { WorkspaceProductAccent, WorkspaceProductStatus } from '../../workspaceProductTokens';
import type { ProductCollectionItem } from '../ProductCollectionSurface';

/**
 * Shared prop contract for all six archetype body layouts. Every layout reuses
 * `ProductCollectionItem` — the same shape `ProductCollectionSurface` already consumes — so the 13
 * existing `*ProductSurface.tsx` files can adopt an archetype without restructuring their data.
 */
export type ArchetypeCommonProps = {
  accent: WorkspaceProductAccent;
  items: ProductCollectionItem[];
  emptyState?: React.ReactNode;
  loading?: boolean;
  onOpenItem?: (item: ProductCollectionItem) => void;
};

/* ---------------------------------------------------------------------------
 * Focus — one dominant hero object + a narrow rail.
 * ------------------------------------------------------------------------- */
export type FocusHero = {
  id: string;
  title: string;
  description: string;
  meta?: string;
  status?: WorkspaceProductStatus;
  statusLabel?: string;
  accent?: WorkspaceProductAccent;
  icon?: LucideIcon;
  tags?: string[];
  actionLabel?: string;
  /** Custom visual for the hero stage (a gauge, a document preview, a chart). Falls back to a icon medallion. */
  figure?: React.ReactNode;
  onOpen?: () => void;
};

/* ---------------------------------------------------------------------------
 * Pipeline — ordered stage lanes with cards flowing between states.
 * ------------------------------------------------------------------------- */
export type PipelineStageDef = {
  id: string;
  label: string;
  /** Item statuses that fall into this lane. */
  statuses: WorkspaceProductStatus[];
  hint?: string;
};

export type PipelineLane = {
  stage: PipelineStageDef;
  items: ProductCollectionItem[];
  /** Highest lane count across the board — used to size the flow bars. */
  maxCount: number;
  /** True for the lane holding the most work — the bottleneck the layout must call out. */
  isBottleneck: boolean;
};

/* ---------------------------------------------------------------------------
 * Journey — numbered steps on a connected spine.
 * ------------------------------------------------------------------------- */
export type JourneyStepDef = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  current: boolean;
  meta?: string;
  tags?: string[];
  actionLabel?: string;
  onOpen?: () => void;
  sourceItem?: ProductCollectionItem;
};

/* ---------------------------------------------------------------------------
 * Ledger — strong header band + dense scannable rows.
 * ------------------------------------------------------------------------- */
export type LedgerColumnDef = {
  id: string;
  label: string;
  /** Defaults to a sensible read of the matching `ProductCollectionItem` field when omitted. */
  render?: (item: ProductCollectionItem) => React.ReactNode;
  /** Hidden below the tablet breakpoint when the row must shrink to two data columns. */
  hideOnCompact?: boolean;
};

export type LedgerHeaderStat = {
  label: string;
  value: React.ReactNode;
};

/* ---------------------------------------------------------------------------
 * Matrix — peer comparison grid, items as columns, attributes as rows.
 * ------------------------------------------------------------------------- */
export type MatrixAttributeDef = {
  id: string;
  label: string;
  /** Defaults to a sensible read of the matching `ProductCollectionItem` field when omitted. */
  render?: (item: ProductCollectionItem) => React.ReactNode;
};

/* ---------------------------------------------------------------------------
 * Feed — reverse-chronological stream with date dividers and actor avatars.
 * ------------------------------------------------------------------------- */
export type FeedActor = {
  initials: string;
  accent: WorkspaceProductAccent;
};

export type FeedGroupDef = {
  key: string;
  label: string;
  items: ProductCollectionItem[];
};

/* ---------------------------------------------------------------------------
 * Per-layout prop contracts.
 * ------------------------------------------------------------------------- */
export type ProductFocusLayoutProps = ArchetypeCommonProps & {
  /** Defaults to the highest-priority item in `items` when omitted. */
  hero?: FocusHero;
  railTitle?: string;
  railDescription?: string;
  /** Defaults to every remaining item, ranked by priority, when omitted. */
  rail?: ProductCollectionItem[];
};

export type ProductPipelineLayoutProps = ArchetypeCommonProps & {
  /** Defaults to a needs-action → in-progress → ready → complete flow when omitted. */
  stages?: PipelineStageDef[];
  laneTitle?: string;
};

export type ProductJourneyLayoutProps = ArchetypeCommonProps & {
  /** Defaults to items ranked by priority, with the first incomplete item marked current. */
  steps?: JourneyStepDef[];
};

export type ProductLedgerLayoutProps = ArchetypeCommonProps & {
  title?: string;
  /** Defaults to a Detail + Tags column pair when omitted. */
  columns?: LedgerColumnDef[];
  /** Defaults to counts per status derived from `items` when omitted. */
  headerStats?: LedgerHeaderStat[];
  onRowAction?: (item: ProductCollectionItem) => void;
  rowActionLabel?: string;
};

export type ProductMatrixLayoutProps = ArchetypeCommonProps & {
  title?: string;
  /** Peer columns to compare. Defaults to `items` capped at a readable count when omitted. */
  columns?: ProductCollectionItem[];
  /** Defaults to Status + Priority + Tags + Detail rows when omitted. */
  attributes?: MatrixAttributeDef[];
  /** Item id to visually highlight as the recommended column. Defaults to the top-priority item. */
  recommendedId?: string;
};

export type ProductFeedLayoutProps = ArchetypeCommonProps & {
  /** Groups reuse `item.meta` as the divider label by default (many callers already pass freshness copy there). */
  groupBy?: (item: ProductCollectionItem) => string;
  getActor?: (item: ProductCollectionItem) => FeedActor;
  composerLabel?: string;
  pinnedItemId?: string;
};
