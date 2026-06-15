/** Part E4 — dispute letter agent chain before mail: coach → letter_ops → compliance. */
import type { LetterRecord } from '../domain/letters';
import type { EvidenceItem } from '../domain/evidence';
import { checkDisputeLetterEvidenceGate } from './evidenceGates';
import { checkIdentityDocumentGate } from './documentVaultGates';

export type LetterAgentChainStep = {
  id: 'coach' | 'letter_ops' | 'compliance';
  label: string;
  agent: string;
  status: 'done' | 'pending' | 'blocked';
  detail: string;
};

export type LetterAgentChainResult = {
  steps: LetterAgentChainStep[];
  readyToMail: boolean;
  blockingMessage?: string;
};

function disputeReasonsComplete(letter: LetterRecord): boolean {
  const meta = letter.meta;
  if (!meta || letter.type !== 'dispute' || !('candidateIds' in meta)) return true;
  const reasons = meta.reasonsByCandidateId ?? {};
  return meta.candidateIds.every((id) => (reasons[id]?.filter(Boolean).length ?? 0) > 0);
}

export function buildLetterAgentChain(args: {
  letter: LetterRecord;
  evidence?: EvidenceItem[];
}): LetterAgentChainResult {
  const { letter } = args;
  const evidence = args.evidence ?? [];
  const steps: LetterAgentChainStep[] = [];

  const coachDone = disputeReasonsComplete(letter);
  steps.push({
    id: 'coach',
    label: 'Dispute coach',
    agent: 'Dispute coach',
    status: coachDone ? 'done' : 'blocked',
    detail: coachDone
      ? 'Every disputed item has a reason selected.'
      : 'Pick a dispute reason for each item before mailing.',
  });

  const hasPdf = Boolean(letter.pdfBlobRef);
  steps.push({
    id: 'letter_ops',
    label: 'Letter operations',
    agent: 'Letter ops',
    status: hasPdf ? 'done' : 'blocked',
    detail: hasPdf ? 'PDF saved to your letter vault.' : 'Generate and save the letter PDF first.',
  });

  const evidenceGate = checkDisputeLetterEvidenceGate({ letter, evidence });
  const identityGate = checkIdentityDocumentGate(evidence);
  const complianceDone = evidenceGate.ok && identityGate.ok;
  steps.push({
    id: 'compliance',
    label: 'Compliance review',
    agent: 'Compliance',
    status: complianceDone ? 'done' : coachDone && hasPdf ? 'blocked' : 'pending',
    detail: complianceDone
      ? 'Evidence and ID documents linked.'
      : !identityGate.ok
        ? identityGate.message
        : evidenceGate.message || 'Link tradeline screenshots for each disputed item.',
  });

  const readyToMail = steps.every((s) => s.status === 'done');
  const blocking = steps.find((s) => s.status === 'blocked');

  return {
    steps,
    readyToMail,
    blockingMessage: readyToMail ? undefined : blocking?.detail,
  };
}
