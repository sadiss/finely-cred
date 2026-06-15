import type { DisputeCandidate, ParsedCreditReport } from '../domain/creditReports';
import { callAiGateway } from './aiClient';
import { extractFirstJsonObject } from '../utils/jsonExtract';
import { buildEnrichedReasonsForCandidate } from './disputeLetterBuilder';
import { filterFactualDisputeReasons } from '../creditReports/disputeFactualReasons';
import { isFeatureEnabled } from '../data/settingsRepo';
import { guardLetterOutput } from './complianceEngine';

export type DisputeAiReasonResult = {
  reasons: string[];
  usedAi: boolean;
  note?: string;
};

/** Rule-based baseline + optional AI ranking for Letter Studio (Phase 16). */
export async function buildDisputeReasonsWithAi(args: {
  candidate: DisputeCandidate;
  parsed?: ParsedCreditReport | null;
  existing?: string[];
  maxReasons?: number;
  preferAi?: boolean;
}): Promise<DisputeAiReasonResult> {
  const baseline = buildEnrichedReasonsForCandidate({
    candidate: args.candidate,
    parsed: args.parsed,
    existing: args.existing,
    maxReasons: args.maxReasons ?? 12,
  });

  if (!args.preferAi || !isFeatureEnabled('aiGateway') || baseline.length < 2) {
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
            'You are a credit dispute analyst. Pick the strongest 4-8 FACTUAL FINDINGS from the list — statements that describe what is reporting on the file and internal contradictions. Phrase findings as "As you can see here on [Bureau], …" when referencing report data (a screenshot accompanies the letter). NEVER pick statute demands, "please verify/delete", method-of-verification commands, or generic filler. Return ONLY JSON: { "reasons": string[], "note": string }. Keep reason text verbatim from input when possible. No legal advice.',
        },
        {
          role: 'user',
          content: `Account: ${args.candidate.account}\nType: ${args.candidate.type}\nSubtype: ${args.candidate.subtype ?? ''}\n\nCandidate reasons:\n${baseline.map((r, i) => `${i + 1}. ${r}`).join('\n')}`,
        },
      ],
    });

    const obj = extractFirstJsonObject(res.text) as { reasons?: string[]; note?: string };
    const picked = Array.isArray(obj?.reasons)
      ? filterFactualDisputeReasons(
          obj.reasons.map((r) => String(r).trim()).filter(Boolean),
        ).slice(0, args.maxReasons ?? 12)
      : [];

    if (picked.length >= 2) {
      return {
        reasons: picked.map((r) => guardLetterOutput(r).split('\n\n')[0] ?? r),
        usedAi: true,
        note: obj?.note?.trim(),
      };
    }
  } catch {
    // fall through to baseline
  }

  return { reasons: baseline.slice(0, args.maxReasons ?? 12), usedAi: false };
}
