import type { LetterRecord, DisputeLetterMeta } from '../domain/letters';
import type { EvidenceItem } from '../domain/evidence';
import type { TaskItem } from '../domain/tasks';
import { checkIdentityDocumentGate } from './documentVaultGates';

export type EvidenceGateResult = {
  ok: boolean;
  missingCandidateIds: string[];
  message: string;
};

/** Minimum evidence before mailing a bureau dispute letter. */
export function checkDisputeLetterEvidenceGate(args: {
  letter: LetterRecord;
  evidence: EvidenceItem[];
  /** When true, only warn — do not block (dev / admin override). */
  soft?: boolean;
}): EvidenceGateResult {
  const meta = args.letter.meta as DisputeLetterMeta | undefined;
  if (!meta || args.letter.type !== 'dispute' || !Array.isArray(meta.candidateIds)) {
    return { ok: true, missingCandidateIds: [], message: '' };
  }

  const evidenceIds = new Set(args.evidence.map((e) => e.id));
  const byCandidate = meta.evidenceByCandidateId ?? {};
  const missing: string[] = [];

  for (const cid of meta.candidateIds) {
    const eid = byCandidate[cid];
    if (!eid || !evidenceIds.has(eid)) missing.push(cid);
  }

  if (missing.length === 0) {
    return { ok: true, missingCandidateIds: [], message: 'Evidence linked for all disputed items.' };
  }

  const msg =
    missing.length === meta.candidateIds.length
      ? 'Attach tradeline screenshots for each disputed item before mailing — bureaus reject vague disputes without proof.'
      : `Missing evidence for ${missing.length} of ${meta.candidateIds.length} disputed item(s). Link screenshots in Letter Studio first.`;

  return {
    ok: args.soft ? true : false,
    missingCandidateIds: missing,
    message: msg,
  };
}

/** Block completing mail_letter tasks until evidence is linked on the related dispute letter. */
export function checkMailLetterTaskEvidenceGate(args: {
  task: TaskItem;
  letter?: LetterRecord | null;
  evidence: EvidenceItem[];
  soft?: boolean;
}): EvidenceGateResult {
  if (args.task.kind !== 'mail_letter') {
    return { ok: true, missingCandidateIds: [], message: '' };
  }

  const identityGate = checkIdentityDocumentGate(args.evidence);
  if (!identityGate.ok && !args.soft) {
    return {
      ok: false,
      missingCandidateIds: [],
      message: identityGate.message,
    };
  }

  if (args.task.resultEvidenceIds?.length) {
    return { ok: true, missingCandidateIds: [], message: 'Vault evidence attached on task.' };
  }

  if (args.letter) {
    return checkDisputeLetterEvidenceGate({ letter: args.letter, evidence: args.evidence, soft: args.soft });
  }

  if (args.task.relatedLetterId) {
    return {
      ok: args.soft ? true : false,
      missingCandidateIds: [],
      message: 'Link this task to a letter in Letter Studio, or attach vault evidence before marking mailed.',
    };
  }

  return {
    ok: args.soft ? true : false,
    missingCandidateIds: [],
    message: 'Attach certified-mail proof or link the dispute letter before completing this mail task.',
  };
}
