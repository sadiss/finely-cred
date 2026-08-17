/**
 * Renders a persona's `PersonaPsychologyProfile` (agentPsychologyArchitectureRepo.ts)
 * into a compact instruction fragment suitable for appending to an LLM system
 * prompt — the bridge between the psychology data and `runAgentBrainStep()`.
 *
 * Kept deliberately short: per Cognitive Load Theory (Sweller) the fragment
 * itself must not overload the prompt it is injected into, so only the tone,
 * the load rule, the top 2-3 bias-mitigation rules, and a one-line
 * de-escalation summary are rendered — not the full profile.
 */
import { getPsychologyProfile } from '../../data/agentPsychologyArchitectureRepo';

const MAX_BIAS_RULES = 3;

/** Build a compact psychology-aware system prompt fragment for one persona. Never throws. */
export function buildPsychologyAwareSystemPromptFragment(personaId: string): string {
  try {
    const profile = getPsychologyProfile(personaId);
    const topBiasRules = profile.biasMitigationRules.slice(0, MAX_BIAS_RULES);

    const parts: string[] = [
      `Communication style: ${profile.communicationTone}`,
      `Cognitive load rule: ${profile.cognitiveLoadGuidance}`,
    ];

    if (topBiasRules.length > 0) {
      parts.push(`Watch for these biases in your own reasoning: ${topBiasRules.join(' | ')}`);
    }

    if (profile.deEscalationProtocol.length > 0) {
      parts.push(`If the situation reads frustrated or anxious: ${profile.deEscalationProtocol[0]}`);
    }

    const dr = buildMarketingDirectResponseRules();
    return `Psychology profile (${profile.displayName}): ${parts.join(' ')} ${dr}`;
  } catch {
    return buildMarketingDirectResponseRules();
  }
}

/** Direct-response copy rules for growth/marketing agents (AIDA + reciprocity + one CTA). */
export function buildMarketingDirectResponseRules(): string {
  return [
    'Marketing copy rules:',
    'Answer one clear question in the first sentence (hook-first).',
    'Give specific, factual proof — never guaranteed credit outcomes.',
    'Reciprocity before ask (free value, then soft CTA).',
    'One obvious next step only — guide link, book session, or reply.',
    'Sound human; avoid procedural command language.',
  ].join(' ');
}
