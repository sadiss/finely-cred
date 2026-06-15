import type { AgentPersonaId } from '../domain/agentPersonas';

export type MessageIntent =
  | 'support'
  | 'processing'
  | 'disputes'
  | 'debt'
  | 'funding'
  | 'sales'
  | 'scheduling'
  | 'complaint'
  | 'general';

export type IntentClassification = {
  intent: MessageIntent;
  confidence: number;
  suggestedPersonaId: AgentPersonaId;
  suggestedAction?: string;
};

const RULES: Array<{ intent: MessageIntent; persona: AgentPersonaId; patterns: RegExp[] }> = [
  {
    intent: 'debt',
    persona: 'debt_strategist',
    patterns: [/debt/i, /collection/i, /summons/i, /fdcpa/i, /validation/i, /creditor call/i],
  },
  {
    intent: 'funding',
    persona: 'funding_strategist',
    patterns: [/business credit/i, /funding/i, /loan/i, /d-u-n-s/i, /vendor/i, /entity/i],
  },
  {
    intent: 'disputes',
    persona: 'dispute_coach',
    patterns: [/dispute/i, /bureau/i, /letter/i, /fcra/i, /tradeline/i, /metro/i],
  },
  {
    intent: 'scheduling',
    persona: 'appointment_setter',
    patterns: [/book/i, /schedule/i, /call/i, /session/i, /calendar/i, /appointment/i],
  },
  {
    intent: 'sales',
    persona: 'sales_closer',
    patterns: [/price/i, /cost/i, /diy/i, /dfy/i, /upgrade/i, /tradeline/i, /buy/i],
  },
  {
    intent: 'processing',
    persona: 'processing_agent',
    patterns: [/credit report/i, /report upload/i, /uploaded my report/i, /parsed report/i, /my report/i, /bureau response/i, /round 2/i, /round 3/i],
  },
  {
    intent: 'support',
    persona: 'support_specialist',
    patterns: [/upload/i, /portal/i, /login/i, /document/i, /help/i, /how do i/i],
  },
  {
    intent: 'complaint',
    persona: 'compliance_agent',
    patterns: [/cfpb/i, /\bftc\b/i, /attorney general/i, /bbb/i, /lawsuit/i, /\bsue\b/i, /legal action/i, /escalat/i, /regulator/i, /complaint/i],
  },
];

export function classifyMessageIntent(text: string): IntentClassification {
  const t = text.trim();
  let best: IntentClassification = {
    intent: 'general',
    confidence: 0.35,
    suggestedPersonaId: 'support_specialist',
    suggestedAction: 'Answer clearly and ask one clarifying question.',
  };

  for (const rule of RULES) {
    const hits = rule.patterns.filter((p) => p.test(t)).length;
    if (hits === 0) continue;
    const confidence = Math.min(0.95, 0.45 + hits * 0.18);
    if (confidence > best.confidence) {
      best = {
        intent: rule.intent,
        confidence,
        suggestedPersonaId: rule.persona,
        suggestedAction:
          rule.intent === 'scheduling'
            ? 'Offer calendar booking link.'
            : rule.intent === 'sales'
              ? 'Explain options without guarantees; suggest next step.'
              : rule.intent === 'complaint'
                ? 'Route to compliance review — educational guidance only, no legal advice.'
                : undefined,
      };
    }
  }

  return best;
}
