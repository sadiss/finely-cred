import type { DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import type { EvidenceItem } from '../domain/evidence';
import { callAiGateway } from './aiClient';
import { extractFirstJsonObject } from '../utils/jsonExtract';
import { buildEnrichedReasonsForCandidate } from './disputeLetterBuilder';
import { filterFactualDisputeReasons } from '../creditReports/disputeFactualReasons';
import { isFeatureEnabled } from '../data/settingsRepo';
import { guardLetterOutput } from './complianceEngine';
import { MAX_DISPUTE_REASONS } from '../letters/disputeLetterFormat';

export type DisputeAiReasonResult = {
  reasons: string[];
  usedAi: boolean;
  note?: string;
};

/** Rule-based baseline + optional AI ranking for Letter Studio. */
export async function buildDisputeReasonsWithAi(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  existing?: string[];
  evidence?: EvidenceItem | null;
  maxReasons?: number;
  preferAi?: boolean;
}): Promise<DisputeAiReasonResult> {
  const max = Math.min(MAX_DISPUTE_REASONS, args.maxReasons ?? MAX_DISPUTE_REASONS);
  const baseline = buildEnrichedReasonsForCandidate({
    candidate: args.candidate,
    parsed: args.parsed,
    existing: args.existing,
    evidence: args.evidence,
    maxReasons: max,
  });

  if (!args.preferAi || !isFeatureEnabled('aiGateway') || baseline.length < 1) {
    return { reasons: baseline, usedAi: false };
  }

  try {
    const res = await callAiGateway({
      taskType: 'dispute.reason_rank',
      responseFormat: 'json',
      providerHint: 'openai',
      context: {
        account: args.candidate.account,
        type: args.candidate.type,
        bureau: args.candidate.bureau,
      },
      messages: [
        {
          role: 'system',
          content:
            `You are a credit dispute analyst. Pick the strongest ${max} FACTUAL FINDINGS from the list. Each reason must state ONE clear fact visible on the bureau screenshot (dates wrong, balance contradicts limit, status contradicts payment history, cross-bureau difference). Use "As you can see here on [Bureau]," when referencing report data. NEVER pick generic lines like "reporting as a collection", field dumps with semicolons, Metro 2 jargon, statute demands, reinvestigation language, or "please verify/delete". Return ONLY JSON: { "reasons": string[], "note": string }. Keep reason text verbatim from input when possible. No legal advice.`,
        },
        {
          role: 'user',
          content: `Account: ${args.candidate.account}\nType: ${args.candidate.type}\nScreenshot creditor: ${args.evidence?.creditorName || '(not set)'}\n\nCandidate reasons:\n${baseline.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        },
      ],
    });

    const obj = extractFirstJsonObject(res.text) as { reasons?: string[]; note?: string };
    const picked = Array.isArray(obj?.reasons)
      ? filterFactualDisputeReasons(
          obj.reasons.map((r) => String(r).trim()).filter(Boolean),
        ).slice(0, max)
      : [];

    if (picked.length >= 1) {
      return {
        reasons: picked.map((r) => guardLetterOutput(r).split('\n\n')[0] ?? r),
        usedAi: true,
        note: obj?.note?.trim(),
      };
    }
  } catch {
    // fall through to baseline
  }

  return { reasons: baseline.slice(0, max), usedAi: false };
}
