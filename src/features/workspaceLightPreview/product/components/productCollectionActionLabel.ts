import type { WorkspaceProductStatus } from '../workspaceProductTokens';

/** Verb family for collection-row CTAs — never render a bare "Open" without a destination name. */
export type ProductCollectionActionKind =
  | 'open'
  | 'review'
  | 'upload'
  | 'start'
  | 'continue'
  | 'complete'
  | 'browse'
  | 'schedule';

const VERB_BY_KIND: Record<ProductCollectionActionKind, string> = {
  open: 'Open',
  review: 'Review',
  upload: 'Upload',
  start: 'Start',
  continue: 'Continue',
  complete: 'Complete',
  browse: 'Browse',
  schedule: 'Schedule',
};

const KIND_BY_STATUS: Partial<Record<WorkspaceProductStatus, ProductCollectionActionKind>> = {
  needs_action: 'review',
  blocked: 'review',
  ready: 'review',
  in_progress: 'continue',
  waiting: 'review',
  complete: 'review',
};

export type ProductCollectionActionInput = {
  title: string;
  /** Explicit label wins — use when the verb must be exact. */
  actionLabel?: string;
  /** When set, derives "{verb} {title}" so rows never fall back to a bare verb. */
  actionKind?: ProductCollectionActionKind;
  status?: WorkspaceProductStatus;
};

/**
 * Builds a row action label from item facts. Returns null when there is not enough
 * information to describe a meaningful destination (caller should hide the CTA).
 */
export function deriveProductCollectionActionLabel(input: ProductCollectionActionInput): string | null {
  const explicit = input.actionLabel?.trim();
  if (explicit) return explicit;

  const title = input.title?.trim();
  if (!title) return null;

  const kind = input.actionKind ?? (input.status ? KIND_BY_STATUS[input.status] : undefined) ?? 'open';
  return `${VERB_BY_KIND[kind]} ${title}`;
}
