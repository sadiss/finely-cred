import type { Bureau } from '../domain/creditReports';
import type { DisputeLetterMeta, LetterRecord } from '../domain/letters';
import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { PartnerJourneyStage } from '../domain/partners';
import {
  parseLegacyPartnerNotesFromExport,
  titleForLegacyNoteEvent,
  type LegacyLetterEventKind,
  type LegacyLetterNoteEvent,
  type LegacyPartnerNotesIntel,
} from './legacyPartnerNotesIntel';
import { legacyStableId } from './legacyStableId';
import { newId } from '../utils/ids';
import { listLettersByPartner, upsertLetter } from '../data/lettersRepo';
import { listEvidenceByPartner } from '../data/evidenceRepo';
import {
  addRoundToCase,
  attachBureauResponseToDisputeCase,
  createDisputeCase,
  listCasesByPartner,
  markCaseRoundResponseReceived,
} from '../data/casesRepo';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { ensureDefaultProjectForPartner } from '../data/projectsRepo';
import { getPartnerSync, adminUpsertPartner } from '../data/partnersRepo';
import type { DisputeCaseRound } from '../domain/cases';
import { classifyLegacyFileName } from './classifyLegacyFileName';

export type LegacyStageSyncResult = {
  lettersCreated: number;
  lettersUpdated: number;
  casesCreated: number;
  casesUpdated: number;
  tasksCreated: number;
  evidenceLinked: number;
  journeyStageAdvanced?: PartnerJourneyStage;
  summary: string[];
};

function nowIso() {
  return new Date().toISOString();
}

function defaultBureauForKind(kind: LegacyLetterEventKind, event?: LegacyLetterNoteEvent): Bureau {
  if (event?.bureau) return event.bureau;
  if (kind === 'bureau_response') return 'TUC';
  return 'EXP';
}

function roundLabel(round: '1' | '2' | '3'): DisputeCaseRound['round'] {
  if (round === '2') return 'Round 2';
  if (round === '3') return 'Round 3';
  return 'Round 1';
}

function letterTypeForKind(kind: LegacyLetterEventKind): 'dispute' | 'validation' {
  if (kind === 'validation') return 'validation';
  return 'dispute';
}

function stableNoteLetterId(partnerId: string, externalId: string, event: LegacyLetterNoteEvent, round: string) {
  const key = [event.kind, event.action, event.creditor ?? '', event.mailedAt ?? event.receivedAt ?? '', round].join(':');
  return legacyStableId('legacy-note-letter', externalId, key);
}

function noteLetterBody(event: LegacyLetterNoteEvent): string {
  const lines = [
    'Legacy letter event reconstructed from staff notes during migration.',
    '',
    `Kind: ${event.kind}`,
    `Action: ${event.action}`,
    event.mailedAt ? `Mailed: ${new Date(event.mailedAt).toLocaleDateString()}` : null,
    event.receivedAt ? `Received: ${new Date(event.receivedAt).toLocaleDateString()}` : null,
    event.bureau ? `Bureau: ${event.bureau}` : null,
    event.creditor ? `Creditor: ${event.creditor}` : null,
    '',
    `Original note: ${event.raw}`,
    '',
    '[Re-upload the original PDF from the old server archive or regenerate the letter body in Letter Studio.]',
  ].filter(Boolean);
  return lines.join('\n');
}

function findNoteLetter(
  letters: LetterRecord[],
  partnerId: string,
  externalId: string,
  event: LegacyLetterNoteEvent,
  round: string,
): LetterRecord | undefined {
  const stableId = stableNoteLetterId(partnerId, externalId, event, round);
  return letters.find((l) => {
    if (l.id === stableId) return true;
    const meta = l.meta as DisputeLetterMeta & { legacyFromNotes?: boolean; legacyNoteKind?: string };
    return meta?.legacyFromNotes && meta.legacyNoteKind === event.kind && l.title.includes(event.creditor ?? '');
  });
}

function ensureDisputeCaseForBureau(args: {
  partnerId: string;
  bureau: Bureau;
  title: string;
  dryRun?: boolean;
}): { created: boolean; caseId?: string } {
  const existing = listCasesByPartner(args.partnerId).find((c) => c.bureau === args.bureau && c.status === 'open');
  if (existing) return { created: false, caseId: existing.id };
  if (args.dryRun) return { created: true };
  const project = ensureDefaultProjectForPartner({ partnerId: args.partnerId, scope: 'personal' });
  const created = createDisputeCase({
    partnerId: args.partnerId,
    bureau: args.bureau,
    title: args.title,
    items: [],
    projectId: project.id,
    initialRound: {
      round: 'Round 1',
      tone: 'formal',
      status: 'draft',
      createdAt: nowIso(),
    },
  });
  return { created: true, caseId: created.id };
}

function linkBureauResponseEvidence(args: {
  partnerId: string;
  exportPartner: LegacyPartnerExportV1['partners'][0];
  bureau: Bureau;
  receivedAt?: string;
  dryRun?: boolean;
}): { evidenceId?: string; linked: boolean } {
  const evidence = listEvidenceByPartner(args.partnerId);
  for (const doc of args.exportPartner.legacyDocuments ?? []) {
    const fileName = String(doc.fileName || '').trim();
    if (!fileName) continue;
    const cls = classifyLegacyFileName(fileName);
    if (cls.kind !== 'bureau_response') continue;
    const bureau = inferBureauFromFileName(fileName) ?? args.bureau;
    if (bureau !== args.bureau) continue;
    const existing = evidence.find((e) => e.filename === fileName);
    if (existing) return { evidenceId: existing.id, linked: true };
    if (args.dryRun) return { linked: true };
  }
  return { linked: false };
}

function inferBureauFromFileName(fileName: string): Bureau | undefined {
  const n = fileName.toLowerCase();
  if (n.includes('exp') || n.includes('experian')) return 'EXP';
  if (n.includes('eqf') || n.includes('equifax')) return 'EQF';
  if (n.includes('tuc') || n.includes('transunion') || n.includes('trans union')) return 'TUC';
  return undefined;
}

/** Upsert note-derived letters + advance dispute rounds / tasks from parsed legacy notes. */
export function syncLegacyLetterStageFromNotes(args: {
  partnerId: string;
  exportPartner: LegacyPartnerExportV1['partners'][0];
  intel?: LegacyPartnerNotesIntel;
  dryRun?: boolean;
}): LegacyStageSyncResult {
  const intel = args.intel ?? parseLegacyPartnerNotesFromExport(args.exportPartner);
  const externalId = String(args.exportPartner.externalId || args.partnerId).trim();
  const round = intel.suggestedRound;
  const result: LegacyStageSyncResult = {
    lettersCreated: 0,
    lettersUpdated: 0,
    casesCreated: 0,
    casesUpdated: 0,
    tasksCreated: 0,
    evidenceLinked: 0,
    summary: [],
  };

  if (!intel.events.length) {
    result.summary.push('No letter events found in legacy notes.');
    return result;
  }

  let letters = listLettersByPartner(args.partnerId);
  const mailedKinds = new Set<LegacyLetterEventKind>();

  for (const event of intel.events) {
    if (event.action === 'mailed') mailedKinds.add(event.kind);
    if (!['mailed', 'created', 'received'].includes(event.action)) continue;
    if (event.kind === 'unknown' && !event.creditor) continue;

    const existing = findNoteLetter(letters, args.partnerId, externalId, event, round);
    const letterId = existing?.id ?? stableNoteLetterId(args.partnerId, externalId, event, round);
    const bureau = defaultBureauForKind(event.kind, event);
    const status =
      event.action === 'mailed'
        ? 'mailed'
        : event.action === 'received'
          ? 'waiting_response'
          : 'generated';

    if (existing) {
      if (!args.dryRun && (existing.status !== status || event.mailedAt || event.receivedAt)) {
        upsertLetter({
          ...existing,
          status,
          meta: {
            ...(existing.meta as DisputeLetterMeta),
            bureau,
            round,
            legacyFromNotes: true,
            legacyNoteKind: event.kind,
            legacyNoteAction: event.action,
            legacyCreditor: event.creditor,
          } as DisputeLetterMeta & {
            legacyFromNotes: boolean;
            legacyNoteKind: string;
            legacyNoteAction: string;
            legacyCreditor?: string;
          },
        });
        result.lettersUpdated += 1;
      }
      continue;
    }

    if (args.dryRun) {
      result.lettersCreated += 1;
      result.summary.push(`Would create letter: ${titleForLegacyNoteEvent(event, round)} (${status})`);
      continue;
    }

    const created: LetterRecord = {
      id: letterId,
      partnerId: args.partnerId,
      type: letterTypeForKind(event.kind),
      title: titleForLegacyNoteEvent(event, round),
      createdAt: event.mailedAt ?? event.receivedAt ?? nowIso(),
      body: noteLetterBody(event),
      status,
      meta: {
        bureau,
        round,
        tone: 'formal',
        candidateIds: [],
        evidenceByCandidateId: {},
        reasonsByCandidateId: {},
        introOverride: `[legacy-notes:${externalId}:${event.kind}:${event.action}]`,
        legacyFromNotes: true,
        legacyNoteKind: event.kind,
        legacyNoteAction: event.action,
        legacyCreditor: event.creditor,
      } as DisputeLetterMeta & {
        legacyFromNotes: boolean;
        legacyNoteKind: string;
        legacyNoteAction: string;
        legacyCreditor?: string;
      },
    };
    upsertLetter(created);
    letters = [...letters, created];
    result.lettersCreated += 1;
    result.summary.push(`Created letter from notes: ${created.title}`);
  }

  const bureauForCase = intel.events.find((e) => e.bureau)?.bureau ?? 'TUC';
  const caseTitle = `Legacy restore — ${bureauForCase}`;
  const caseEnsure = ensureDisputeCaseForBureau({
    partnerId: args.partnerId,
    bureau: bureauForCase,
    title: caseTitle,
    dryRun: args.dryRun,
  });
  if (caseEnsure.created) {
    result.casesCreated += 1;
    result.summary.push(`Opened dispute case for ${bureauForCase}`);
  }

  if (intel.hasMailedRound1 && caseEnsure.caseId) {
    const nextRound = roundLabel(round);
    if (!args.dryRun) {
      addRoundToCase({
        caseId: caseEnsure.caseId,
        round: {
          round: nextRound,
          tone: 'formal',
          status: intel.hasBureauResponse ? 'response_received' : 'mailed',
          mailedAt: intel.events.find((e) => e.mailedAt)?.mailedAt,
          notes: 'Advanced from legacy staff notes during migration repair.',
          createdAt: nowIso(),
        },
        replaceIfSameRound: true,
      });
      result.casesUpdated += 1;
    } else {
      result.summary.push(`Would advance case to ${nextRound}`);
    }
  }

  if (intel.hasBureauResponse && caseEnsure.caseId) {
    const responseEvent = intel.events.find((e) => e.kind === 'bureau_response' && e.action === 'received');
    const link = linkBureauResponseEvidence({
      partnerId: args.partnerId,
      exportPartner: args.exportPartner,
      bureau: responseEvent?.bureau ?? bureauForCase,
      receivedAt: responseEvent?.receivedAt,
      dryRun: args.dryRun,
    });
    if (link.linked) {
      result.evidenceLinked += 1;
      if (!args.dryRun && link.evidenceId && caseEnsure.caseId) {
        attachBureauResponseToDisputeCase({
          caseId: caseEnsure.caseId,
          evidenceId: link.evidenceId,
          notes: responseEvent?.raw,
          round: 'Round 1',
        });
        markCaseRoundResponseReceived({
          caseId: caseEnsure.caseId,
          round: 'Round 1',
          responseReceivedAt: responseEvent?.receivedAt,
          notes: responseEvent?.raw,
          createdBy: 'admin',
        });
        result.casesUpdated += 1;
      }
      result.summary.push('Linked bureau / 3rd-party response evidence to dispute case');
    }
  }

  const existingTasks = listTasksByPartner(args.partnerId);
  const hasFollowUpTask = existingTasks.some((t) => (t.tags ?? []).includes('legacy-notes-followup'));
  if (intel.needsFollowUpResponse && !hasFollowUpTask) {
    if (args.dryRun) {
      result.tasksCreated += 1;
      result.summary.push('Would create follow-up task: respond to bureau / 3rd-party letter');
    } else {
      const project = ensureDefaultProjectForPartner({ partnerId: args.partnerId, scope: 'personal' });
      createTask({
        partnerId: args.partnerId,
        projectId: project.id,
        scope: 'personal',
        title: 'Respond to bureau / 3rd-party letter (legacy notes)',
        kind: 'follow_up',
        stage: 'disputes',
        priority: 'high',
        status: 'pending',
        notes: intel.nextActions.join('\n'),
        tags: ['legacy-import', 'legacy-notes-followup'],
        assignedTo: 'admin',
      });
      result.tasksCreated += 1;
      result.summary.push('Created follow-up task for bureau response');
    }
  }

  if (intel.suggestedStage && !args.dryRun) {
    const partner = getPartnerSync(args.partnerId);
    if (partner) {
      const stageOrder: PartnerJourneyStage[] = ['intake', 'report_upload', 'analysis', 'evidence', 'letters', 'mailing', 'funding', 'complete'];
      const currentIdx = stageOrder.indexOf(partner.journeyStage ?? 'intake');
      const targetIdx = stageOrder.indexOf(intel.suggestedStage);
      if (targetIdx > currentIdx) {
        void adminUpsertPartner({ ...partner, journeyStage: intel.suggestedStage });
        result.journeyStageAdvanced = intel.suggestedStage;
        result.summary.push(`Advanced journey stage → ${intel.suggestedStage}`);
      }
    }
  } else if (intel.suggestedStage && args.dryRun) {
    result.summary.push(`Would advance journey stage → ${intel.suggestedStage}`);
  }

  return result;
}
