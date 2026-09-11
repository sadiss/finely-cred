import { findPlatformSopForRoute } from '../../domain/platformSops';
import { findTourForPath, getTourById } from '../../config/tourManifest';
import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import {
  searchFinelyKnowledge,
  formatFinelyKnowledgeForPrompt,
  type FinelyKnowledgeHit,
} from '../finelyKnowledgeIndex';
import {
  HUMAN_I_DONT_KNOW,
  excerptAnswersQuery,
  humanSpokenReply,
  shouldSkipKnowledgeArticle,
  speakKnowledgeHit,
  speakPageHelp,
} from './humanCreditTalk';

export type FinelyPageContext = {
  pathname: string;
  sop: ReturnType<typeof findPlatformSopForRoute>;
  tour: ReturnType<typeof findTourForPath>;
  personaId: AgentPersonaId;
  suggestedPrompts: string[];
};

/** Pick the most relevant staffed persona for the current route. */
export function pickPersonaForRoute(pathname: string): AgentPersonaId {
  const p = pathname.split('?')[0];
  if (/^\/portal\/(letters|templates)/.test(p)) return 'letter_ops_agent';
  if (/^\/portal\/(disputes|reports|credit)/.test(p)) return 'dispute_coach';
  if (/^\/portal\/(debt)/.test(p)) return 'debt_strategist';
  if (/^\/portal\/(billing|checkout)/.test(p)) return 'support_specialist';
  if (/^\/portal\/(education|courses)/.test(p)) return 'education_coach';
  if (/^\/affiliate/.test(p)) return 'affiliate_specialist';
  if (/^\/business/.test(p)) return 'funding_strategist';
  if (/^\/fundability-readiness/.test(p)) return 'funding_strategist';
  if (/^\/admin\/(ops-agent|phone-hub)/.test(p)) return 'finely_coowner';
  if (/^\/admin\/(workflow|ops-autopilot|monitoring|automations)/.test(p)) return 'ops_copilot';
  if (/^\/admin\/(crm|leads|funnel)/.test(p)) return 'crm_intake_specialist';
  if (/^\/(haitian|kreyol)/.test(p)) return 'haitian_companion';
  if (/personal-credit-restore|\/personal-credit$/.test(p)) return 'dispute_coach';
  if (/business-credit/.test(p)) return 'funding_strategist';
  if (/debt-legal|\/free-debt/.test(p)) return 'debt_strategist';
  if (/credit-building|build-my-credit|personal-credit-building/.test(p)) return 'finely_advisor';
  if (/^\/(pricing|services|personal-credit)/.test(p)) return 'sales_closer';
  return 'finely_advisor';
}

export function resolveFinelyPageContext(pathname: string): FinelyPageContext {
  const sop = findPlatformSopForRoute(pathname);
  const tour = sop?.relatedTourId ? getTourById(sop.relatedTourId) : findTourForPath(pathname);
  const prompts = [
    sop ? `How do I: ${sop.title}?` : 'What is this page for?',
    PUBLIC_DEMO_VIDEOS_ENABLED && tour ? `Play video: ${tour.title}` : 'Explain step by step in plain English',
    'Explain step by step in plain English',
  ];
  return { pathname, sop, tour, personaId: pickPersonaForRoute(pathname), suggestedPrompts: prompts };
}

/** @deprecated use searchFinelyKnowledge — kept for backward compatibility. */
export function listKnowledgeChunksForRag(): Array<{ id: string; title: string; text: string; route?: string }> {
  return searchFinelyKnowledge('', { limit: 12 }).map((h) => ({ id: h.id, title: h.title, text: h.text, route: h.route }));
}

/** @deprecated use searchFinelyKnowledge — kept for backward compatibility. */
export function searchKnowledgeLocal(query: string, limit = 5): Array<{ id: string; title: string; snippet: string }> {
  return searchFinelyKnowledge(query, { limit }).map((h) => ({ id: h.id, title: h.title, snippet: h.snippet }));
}

export type FinelyBrainCitation = { id: string; title: string; route?: string; source?: FinelyKnowledgeHit['source'] };

export type FinelyBrainInput = {
  pathname: string;
  userMessage: string;
  partnerId?: string;
  /** Senior mode → shorter, slower, always offer the tour (Part E5) */
  seniorMode?: boolean;
};

export type FinelyBrainResult = {
  reply: string;
  personaId: AgentPersonaId;
  citations: FinelyBrainCitation[];
  tourId?: string;
  sopId?: string;
};

/**
 * Build the system prompt for an ai-gateway call. Used when the unified edge
 * call ships; the client stub below answers offline from the same context.
 */
export function buildFinelyBrainPrompt(input: FinelyBrainInput, hits: FinelyKnowledgeHit[]): string {
  const senior = input.seniorMode
    ? 'Audience may be a non-technical senior. Use grade-6 language, short sentences, one idea per sentence, and name the single next button to tap.'
    : 'Be concise, warm, and action-first.';
  return [
    'You are Finely, the unified concierge for Finely Cred. Educational only — never legal advice.',
    senior,
    'Always prefer the operating knowledge below and cite it by name.',
    PUBLIC_DEMO_VIDEOS_ENABLED ? 'If a video tour exists, offer "Watch how".' : 'Do not mention video tours — they are not public yet.',
    '',
    formatFinelyKnowledgeForPrompt(hits),
    '',
    `Current page: ${input.pathname}`,
    `User asked: ${input.userMessage}`,
  ].join('\n');
}

/**
 * Client-side orchestration stub — routes the request to page context + the
 * unified knowledge index and returns a senior-friendly answer with citations.
 * Swap the body for an ai-gateway edge call without changing callers.
 */
export function finelyBrainOrchestrate(input: FinelyBrainInput): FinelyBrainResult {
  const ctx = resolveFinelyPageContext(input.pathname);
  const hits = searchFinelyKnowledge(input.userMessage, { limit: 3, contextRoute: input.pathname });
  const citations: FinelyBrainCitation[] = hits.map((h) => ({ id: h.id, title: h.title, route: h.route, source: h.source }));
  const msg = input.userMessage.toLowerCase();

  const term = humanSpokenReply(input.userMessage);
  if (term) {
    return {
      reply: term,
      personaId: ctx.personaId,
      citations,
      tourId: ctx.tour?.id,
      sopId: ctx.sop?.id,
    };
  }

  if (PUBLIC_DEMO_VIDEOS_ENABLED && (msg.includes('video') || msg.includes('watch'))) {
    return {
      reply: ctx.tour
        ? `There is a short walkthrough for this page: ${ctx.tour.title}. Tap Watch how if you want to see it.`
        : 'Tell me what you want to see and I will walk you through it.',
      personaId: ctx.personaId,
      citations,
      tourId: ctx.tour?.id,
      sopId: ctx.sop?.id,
    };
  }

  const askingPageHelp = /\b(what should i do on this page|what is this page for|help on this page|what do i do here)\b/.test(msg);
  if (askingPageHelp && ctx.sop) {
    return {
      reply: speakPageHelp(ctx.sop.whenToUse, ctx.sop.steps[0]?.label),
      personaId: ctx.personaId,
      citations,
      tourId: ctx.tour?.id,
      sopId: ctx.sop.id,
    };
  }

  const top = hits.find(
    (h) => !shouldSkipKnowledgeArticle(h.id) && excerptAnswersQuery(input.userMessage, `${h.title} ${h.snippet}`),
  );
  return {
    reply: top ? speakKnowledgeHit(top.title, top.snippet) : HUMAN_I_DONT_KNOW,
    personaId: ctx.personaId,
    citations,
    tourId: ctx.tour?.id,
  };
}
