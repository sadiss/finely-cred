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

  const evidenceById = new Map(args.evidence.map((e) => [e.id, e]));
  const byCandidate = meta.evidenceByCandidateId ?? {};
  const missing: string[] = [];
  const reviewBlocked: string[] = [];

  for (const cid of meta.candidateIds) {
    const eid = byCandidate[cid];
    const item = eid ? evidenceById.get(eid) : undefined;
    if (!item) {
      missing.push(cid);
      continue;
    }
    const demoOnly = Boolean(item.source === 'demo_synthetic' || item.provenance?.demoOnly);
    const generatedOrCropped =
      item.source === 'source_report_crop' ||
      item.source === 'parsed_finely_exhibit' ||
      item.source === 'tradeline_screenshot' ||
      item.source === 'section_screenshot';
    if (
      demoOnly ||
      (generatedOrCropped &&
        (item.provenance?.mailEligible !== true || item.provenance?.humanVerified !== true))
    ) {
      reviewBlocked.push(cid);
    }
  }

  if (missing.length === 0 && reviewBlocked.length === 0) {
    return { ok: true, missingCandidateIds: [], message: 'Evidence linked for all disputed items.' };
  }

  const msg = reviewBlocked.length
    ? `Review and approve evidence for ${reviewBlocked.length} disputed item(s) before mailing. Demo evidence is never mail-eligible.`
    : missing.length === meta.candidateIds.length
      ? 'Attach source report crops or reviewed exhibits for each disputed item before mailing.'
      : `Missing evidence for ${missing.length} of ${meta.candidateIds.length} disputed item(s). Link evidence in Letter Studio first.`;

  return {
    ok: args.soft ? true : false,
    missingCandidateIds: [...new Set([...missing, ...reviewBlocked])],
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
    const linked = args.task.resultEvidenceIds
      .map((id) => args.evidence.find((item) => item.id === id))
      .filter((item): item is EvidenceItem => Boolean(item));
    const blocked = linked.some(
      (item) =>
        item.source === 'demo_synthetic' ||
        item.provenance?.demoOnly ||
        (item.provenance &&
          item.provenance.mailEligible !== true &&
          (item.provenance.kind === 'source_faithful_report_crop' ||
            item.provenance.kind === 'parsed_finely_exhibit')),
    );
    if (linked.length !== args.task.resultEvidenceIds.length || blocked) {
      return {
        ok: args.soft ? true : false,
        missingCandidateIds: [],
        message: 'One or more task attachments are missing, demo-only, or awaiting evidence review.',
      };
    }
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
