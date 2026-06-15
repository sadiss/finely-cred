import type { Bureau, DisputeCandidate } from '../domain/creditReports';
import type { LetterRecord } from '../domain/letters';
import { listReportsByPartner } from '../data/reportsRepo';
import { deriveDisputeCandidates } from '../creditReports/disputeCandidates';
import { buildEnrichedReasonsForCandidate } from './disputeLetterBuilder';
import { upsertLetter } from '../data/lettersRepo';
import { pushAutopilotQueueItem } from '../data/automationOpsQueue';
import { bureauShortCode } from '../utils/bureaus';
import { newId } from '../utils/ids';
import {
  DISPUTE_STATEMENT_PER_ITEM,
  OPENING_PARAGRAPHS,
  REQUEST_FOR_RESULTS,
  REQUESTED_RESOLUTION_BULLETS,
} from '../letters/disputeLetterTemplate';

function buildLetterBody(args: {
  partnerName: string;
  bureau: Bureau;
  round: string;
  items: Array<{ candidate: DisputeCandidate; reasons: string[] }>;
}): string {
  const blocks: string[] = [OPENING_PARAGRAPHS, ''];
  for (const it of args.items) {
    blocks.push(`DISPUTED ITEM: ${it.candidate.account}`);
    blocks.push(`Type: ${it.candidate.type}${it.candidate.subtype ? ` · ${it.candidate.subtype}` : ''}`);
    if (it.candidate.status.trim()) blocks.push(`Status reported: ${it.candidate.status.trim()}`);
    blocks.push('');
    blocks.push(DISPUTE_STATEMENT_PER_ITEM);
    blocks.push('');
    blocks.push('Factual findings:');
    for (const r of it.reasons) blocks.push(`• ${r}`);
    blocks.push('');
  }
  blocks.push('Requested resolution:');
  for (const b of REQUESTED_RESOLUTION_BULLETS) blocks.push(`• ${b}`);
  blocks.push('');
  blocks.push(REQUEST_FOR_RESULTS);
  return blocks.join('\n');
}

export type AutoDraftResult = {
  letterIds: string[];
  drafted: number;
  skipped: number;
};

/** Hands-free dispute letter draft — factual reasons only, saved to vault + review queue. */
export function autoDraftDisputeLettersForPartner(args: {
  partnerId: string;
  partnerName: string;
  bureau?: Bureau;
  round?: string;
  maxCandidates?: number;
  enqueueReview?: boolean;
}): AutoDraftResult {
  const round = args.round ?? '1';
  const max = args.maxCandidates ?? 3;
  const reports = listReportsByPartner(args.partnerId).filter((r) => r.parsed);
  if (!reports.length) return { letterIds: [], drafted: 0, skipped: 0 };

  const report = reports[0]!;
  const parsed = report.parsed!;
  const candidates = deriveDisputeCandidates(parsed, report.id).filter(
    (c) => !args.bureau || c.bureau === args.bureau,
  );
  if (!candidates.length) return { letterIds: [], drafted: 0, skipped: 0 };

  const byBureau = new Map<Bureau, DisputeCandidate[]>();
  for (const c of candidates) {
    const list = byBureau.get(c.bureau) ?? [];
    list.push(c);
    byBureau.set(c.bureau, list);
  }

  const letterIds: string[] = [];
  let drafted = 0;
  let skipped = 0;

  const bureaus = args.bureau ? [args.bureau] : ([...byBureau.keys()] as Bureau[]);

  for (const bureau of bureaus) {
    const pool = (byBureau.get(bureau) ?? []).slice(0, max);
    if (!pool.length) continue;

    const items = pool.map((candidate) => ({
      candidate,
      reasons: buildEnrichedReasonsForCandidate({
        candidate,
        parsed,
        maxReasons: 8,
      }),
    }));

    if (!items.some((x) => x.reasons.length)) {
      skipped += pool.length;
      continue;
    }

    const body = buildLetterBody({
      partnerName: args.partnerName,
      bureau,
      round,
      items: items.filter((x) => x.reasons.length),
    });

    const letter: LetterRecord = {
      id: newId('letter'),
      partnerId: args.partnerId,
      type: 'dispute',
      title: `Auto-draft · ${bureauShortCode(bureau)} · Round ${round}`,
      createdAt: new Date().toISOString(),
      body,
      status: 'generated',
      relatedReportId: report.id,
      meta: {
        bureau,
        round,
        tone: 'neutral',
        candidateIds: items.map((x) => x.candidate.id),
        evidenceByCandidateId: {},
        reasonsByCandidateId: Object.fromEntries(
          items.map((x) => [x.candidate.id, x.reasons]),
        ),
        aiQuestions: [],
      },
    };

    upsertLetter(letter);
    letterIds.push(letter.id);
    drafted += 1;

    if (args.enqueueReview !== false) {
      pushAutopilotQueueItem({
        kind: 'draft_review',
        partnerId: args.partnerId,
        partnerName: args.partnerName,
        title: `Review auto-drafted letter · ${bureauShortCode(bureau)}`,
        body: `${items.length} item(s) with factual findings — confirm before mail.`,
        letterId: letter.id,
        bureau,
        meta: { round, candidateCount: items.length, auto: true },
      });
    }
  }

  return { letterIds, drafted, skipped };
}
