import { getCrmRecord } from '../../../data/crmRecordsRepo';
import { addProspectNote } from '../../../data/crmProspectsRepo';
import { addLeadNote } from '../../../data/leadOpsRepo';
import {
  enrollCrmRecordInSequence,
  listCrmEnrollmentsByRecord,
  listCrmSequences,
} from '../../../data/crmSequencesRepo';

export function autoEnrollCrmRecordInDefaultSequence(
  recordId: string,
  args?: { noteLabel?: string },
): boolean {
  try {
    const record = getCrmRecord(recordId);
    if (!record) return false;

    const hasActive = listCrmEnrollmentsByRecord(recordId).some((e) => !e.completedAt);
    if (hasActive) return false;

    const sequences = listCrmSequences().filter((s) => s.enabled && s.target === record.target);
    const seq = sequences.find((s) => s.id === 'seq_inbound_nurture') ?? sequences[0];
    if (!seq) return false;

    enrollCrmRecordInSequence({ recordId, sequenceId: seq.id });
    const note = args?.noteLabel ?? `[Sequence] Auto-enrolled in "${seq.name}"`;
    if (record.sourceRef?.type === 'lead') {
      addLeadNote(record.sourceRef.id, note);
    } else if (record.sourceRef?.type === 'prospect') {
      addProspectNote(record.sourceRef.id, note);
    }
    return true;
  } catch {
    return false;
  }
}
