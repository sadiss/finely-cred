import React from 'react';
import type { WorkspaceProductArchetype } from '../../workspaceProductArchetypes';
import { ProductFocusLayout } from './ProductFocusLayout';
import { ProductPipelineLayout } from './ProductPipelineLayout';
import { ProductJourneyLayout } from './ProductJourneyLayout';
import { ProductLedgerLayout } from './ProductLedgerLayout';
import { ProductMatrixLayout } from './ProductMatrixLayout';
import { ProductFeedLayout } from './ProductFeedLayout';
import type {
  ArchetypeCommonProps,
  ProductFeedLayoutProps,
  ProductFocusLayoutProps,
  ProductJourneyLayoutProps,
  ProductLedgerLayoutProps,
  ProductMatrixLayoutProps,
  ProductPipelineLayoutProps,
} from './archetypeTypes';

export { ProductFocusLayout } from './ProductFocusLayout';
export { ProductPipelineLayout } from './ProductPipelineLayout';
export { ProductJourneyLayout } from './ProductJourneyLayout';
export { ProductLedgerLayout } from './ProductLedgerLayout';
export { ProductMatrixLayout } from './ProductMatrixLayout';
export { ProductFeedLayout } from './ProductFeedLayout';

export type {
  ArchetypeCommonProps,
  FeedActor,
  FeedGroupDef,
  FocusHero,
  JourneyStepDef,
  LedgerColumnDef,
  LedgerHeaderStat,
  MatrixAttributeDef,
  PipelineLane,
  PipelineStageDef,
  ProductFeedLayoutProps,
  ProductFocusLayoutProps,
  ProductJourneyLayoutProps,
  ProductLedgerLayoutProps,
  ProductMatrixLayoutProps,
  ProductPipelineLayoutProps,
} from './archetypeTypes';

export {
  DEFAULT_PIPELINE_STAGES,
  deriveFeedActor,
  deriveFeedGroups,
  deriveFocusHero,
  deriveFocusRail,
  deriveJourneySteps,
  deriveLedgerHeaderStats,
  deriveMatrixColumns,
  derivePipelineLanes,
  deriveRecommendedId,
  sortByPriority,
} from './archetypeDerive';

/** Archetypes that render through one of the six generic body layouts (`command` is bespoke). */
export type RenderableArchetype = Exclude<WorkspaceProductArchetype, 'command'>;

type RenderArchetypeProps = ArchetypeCommonProps &
  Partial<
    Omit<ProductFocusLayoutProps, keyof ArchetypeCommonProps> &
      Omit<ProductPipelineLayoutProps, keyof ArchetypeCommonProps> &
      Omit<ProductJourneyLayoutProps, keyof ArchetypeCommonProps> &
      Omit<ProductLedgerLayoutProps, keyof ArchetypeCommonProps> &
      Omit<ProductMatrixLayoutProps, keyof ArchetypeCommonProps> &
      Omit<ProductFeedLayoutProps, keyof ArchetypeCommonProps>
  >;

/**
 * Maps an archetype id to its body layout component so `WorkspaceProductModuleSurface` can switch
 * layouts generically instead of a per-page if/else. Returns `null` for `command` — those two
 * dashboards are bespoke and never route through a generic archetype body.
 */
export function renderArchetype(
  archetype: WorkspaceProductArchetype,
  props: RenderArchetypeProps,
): React.ReactElement | null {
  switch (archetype) {
    case 'focus':
      return React.createElement(ProductFocusLayout, props as ProductFocusLayoutProps);
    case 'pipeline':
      return React.createElement(ProductPipelineLayout, props as ProductPipelineLayoutProps);
    case 'journey':
      return React.createElement(ProductJourneyLayout, props as ProductJourneyLayoutProps);
    case 'ledger':
      return React.createElement(ProductLedgerLayout, props as ProductLedgerLayoutProps);
    case 'matrix':
      return React.createElement(ProductMatrixLayout, props as ProductMatrixLayoutProps);
    case 'feed':
      return React.createElement(ProductFeedLayout, props as ProductFeedLayoutProps);
    case 'command':
    default:
      return null;
  }
}
