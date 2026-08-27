import type { LettersCommandCenterDraft } from '../data/lettersCommandCenterDraftRepo';

export type DisputeBuildStepId = 'disputes' | 'screenshots' | 'reasons' | 'laws' | 'identity' | 'generate';

const DISPUTE_STEP_ORDER: DisputeBuildStepId[] = [
  'disputes',
  'screenshots',
  'reasons',
  'laws',
  'identity',
  'generate',
];

export function nextIncompleteDisputeStep(draft: LettersCommandCenterDraft): DisputeBuildStepId {
  const selected = Array.isArray(draft.selectedDisputes) ? draft.selectedDisputes : [];
  if (!selected.length) return 'disputes';

  const evidenceBy = draft.evidenceByCandidateId ?? {};
  const reasonsBy = draft.reasonsByCandidateId ?? {};
  const lawsBy = draft.lawsByCandidateId ?? {};
  const identityIds = draft.identityEvidenceIds ?? [];

  const missingEvidence = selected.some((s) => !evidenceBy[s.key]);
  if (missingEvidence) return 'screenshots';

  const missingReasons = selected.some((s) => !(reasonsBy[s.key] ?? []).filter(Boolean).length);
  if (missingReasons) return 'reasons';

  const missingLaws = selected.some((s) => !(lawsBy[s.key] ?? []).length);
  if (missingLaws) return 'laws';

  if (identityIds.filter(Boolean).length < 2) return 'identity';

  return 'generate';
}

export function letterStudioResumeUrl(
  draft: LettersCommandCenterDraft,
  basePath = '/portal/letters',
): string {
  const step = nextIncompleteDisputeStep(draft);
  const path = basePath.split('?')[0] || '/portal/letters';
  return `${path}?tab=dispute&step=${step}`;
}

export function isValidDisputeBuildStep(step: string | null): step is DisputeBuildStepId {
  return Boolean(step && DISPUTE_STEP_ORDER.includes(step as DisputeBuildStepId));
}
