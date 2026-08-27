import { WORKSPACE_PRODUCT_STATUS, type WorkspaceProductStatus } from '../../workspaceProductTokens';
import type { ProductCollectionItem } from '../ProductCollectionSurface';
import type {
  FeedActor,
  FeedGroupDef,
  FocusHero,
  JourneyStepDef,
  LedgerHeaderStat,
  PipelineLane,
  PipelineStageDef,
} from './archetypeTypes';

export function sortByPriority(items: ProductCollectionItem[]): ProductCollectionItem[] {
  return [...items].sort((left, right) => {
    const byPriority = (right.priority ?? 0) - (left.priority ?? 0);
    return byPriority || left.title.localeCompare(right.title);
  });
}

/* ---------------------------------------------------------------------------
 * Focus
 * ------------------------------------------------------------------------- */
export function deriveFocusHero(items: ProductCollectionItem[]): FocusHero | null {
  const [top] = sortByPriority(items);
  if (!top) return null;
  return {
    id: top.id,
    title: top.title,
    description: top.description,
    meta: top.meta,
    status: top.status,
    statusLabel: top.statusLabel,
    accent: top.accent,
    icon: top.icon,
    tags: top.tags,
    actionLabel: top.actionLabel,
    onOpen: top.onOpen,
  };
}

export function deriveFocusRail(items: ProductCollectionItem[], heroId?: string): ProductCollectionItem[] {
  return sortByPriority(items).filter((item) => item.id !== heroId);
}

/* ---------------------------------------------------------------------------
 * Pipeline
 * ------------------------------------------------------------------------- */
export const DEFAULT_PIPELINE_STAGES: PipelineStageDef[] = [
  { id: 'needs_action', label: 'Needs action', statuses: ['needs_action', 'blocked'] },
  { id: 'in_progress', label: 'In progress', statuses: ['in_progress', 'waiting'] },
  { id: 'ready', label: 'Ready', statuses: ['ready'] },
  { id: 'complete', label: 'Complete', statuses: ['complete'] },
];

export function derivePipelineLanes(
  items: ProductCollectionItem[],
  stages: PipelineStageDef[] = DEFAULT_PIPELINE_STAGES,
): PipelineLane[] {
  const raw = stages.map((stage) => ({
    stage,
    laneItems: sortByPriority(items.filter((item) => stage.statuses.includes(item.status))),
  }));
  const maxCount = Math.max(1, ...raw.map((lane) => lane.laneItems.length));
  const bottleneckCount = Math.max(0, ...raw.map((lane) => lane.laneItems.length));
  let bottleneckAssigned = false;
  return raw.map((lane) => {
    const isBottleneck = !bottleneckAssigned && bottleneckCount > 0 && lane.laneItems.length === bottleneckCount;
    if (isBottleneck) bottleneckAssigned = true;
    return { stage: lane.stage, items: lane.laneItems, maxCount, isBottleneck };
  });
}

/* ---------------------------------------------------------------------------
 * Journey
 * ------------------------------------------------------------------------- */
export function deriveJourneySteps(items: ProductCollectionItem[]): JourneyStepDef[] {
  const sorted = sortByPriority(items);
  let currentAssigned = false;
  return sorted.map((item) => {
    const complete = item.status === 'complete';
    const current = !complete && !currentAssigned;
    if (current) currentAssigned = true;
    return {
      id: item.id,
      label: item.title,
      description: item.description,
      complete,
      current,
      meta: item.meta,
      tags: item.tags,
      actionLabel: item.actionLabel,
      onOpen: item.onOpen,
      sourceItem: item,
    };
  });
}

/* ---------------------------------------------------------------------------
 * Ledger
 * ------------------------------------------------------------------------- */
export function deriveLedgerHeaderStats(items: ProductCollectionItem[]): LedgerHeaderStat[] {
  const counts = new Map<WorkspaceProductStatus, number>();
  for (const item of items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  return (Object.keys(WORKSPACE_PRODUCT_STATUS) as WorkspaceProductStatus[])
    .filter((status) => counts.get(status))
    .map((status) => ({ label: WORKSPACE_PRODUCT_STATUS[status].label, value: counts.get(status) ?? 0 }));
}

/* ---------------------------------------------------------------------------
 * Matrix
 * ------------------------------------------------------------------------- */
export function deriveMatrixColumns(items: ProductCollectionItem[], max = 5): ProductCollectionItem[] {
  return sortByPriority(items).slice(0, max);
}

export function deriveRecommendedId(columns: ProductCollectionItem[]): string | undefined {
  return sortByPriority(columns)[0]?.id;
}

/* ---------------------------------------------------------------------------
 * Feed
 * ------------------------------------------------------------------------- */
export function defaultFeedGroupBy(item: ProductCollectionItem): string {
  return item.meta || 'Recent activity';
}

export function deriveFeedActor(item: ProductCollectionItem): FeedActor {
  const words = item.title.trim().split(/\s+/).filter(Boolean);
  const initials = `${words[0]?.[0] ?? 'F'}${words[1]?.[0] ?? ''}`.toUpperCase();
  return { initials, accent: item.accent };
}

export function deriveFeedGroups(
  items: ProductCollectionItem[],
  groupBy: (item: ProductCollectionItem) => string = defaultFeedGroupBy,
): FeedGroupDef[] {
  const order: string[] = [];
  const buckets = new Map<string, ProductCollectionItem[]>();
  for (const item of sortByPriority(items)) {
    const key = groupBy(item) || 'Recent activity';
    if (!buckets.has(key)) {
      buckets.set(key, []);
      order.push(key);
    }
    buckets.get(key)!.push(item);
  }
  return order.map((key) => ({ key, label: key, items: buckets.get(key) ?? [] }));
}
