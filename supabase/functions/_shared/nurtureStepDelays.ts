/** @deprecated Use nurtureSequencesCatalog.ts — kept for backward-compatible imports. */
import { NURTURE_SEQUENCE_CATALOG, getSequenceStepDelays } from './nurtureSequencesCatalog.ts';

export const NURTURE_SEQUENCE_STEP_DELAYS: Record<string, number[]> = Object.fromEntries(
  NURTURE_SEQUENCE_CATALOG.map((s) => [s.id, s.steps.map((step) => step.delayHours)]),
);

export { getSequenceStepDelays };
