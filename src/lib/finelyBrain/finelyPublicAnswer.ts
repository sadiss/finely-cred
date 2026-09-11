import { PUBLIC_DEMO_VIDEOS_ENABLED } from '../../config/publicMediaPolicy';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import type { PlatformSop } from '../../domain/platformSops';
import {
  searchFinelyKnowledgePublic,
  type FinelyKnowledgeHit,
} from '../finelyKnowledgeIndex';
import {
  resolveFinelyPageContext,
  type FinelyBrainCitation,
} from './finelyBrainOrchestrate';
import {
  HUMAN_CREDIT_RESTORE,
  HUMAN_DISPUTE_VS_DEBT,
  HUMAN_FREE_GUIDE,
  HUMAN_GENERIC_NEXT,
  HUMAN_I_DONT_KNOW,
  HUMAN_PRICING,
  HUMAN_SITE_OVERVIEW,
  excerptAnswersQuery,
  humanSpokenReply,
  shouldSkipKnowledgeArticle,
  speakKnowledgeHit,
  speakPageHelp,
} from './humanCreditTalk';

export type FinelyPublicAnswerChannel = 'strip' | 'chat' | 'voice';

export type FinelyPublicAnswerInput = {
  pathname: string;
  message: string;
  channel: FinelyPublicAnswerChannel;
  /** Strip and voice default to senior-friendly phrasing. */
  seniorMode?: boolean;
};

export type FinelyPublicAnswerResult = {
  reply: string;
  personaId: AgentPersonaId;
  citations: FinelyBrainCitation[];
  tourId?: string;
  sopId?: string;
  topic: FinelyPublicTopic | 'general';
  complianceAppended: boolean;
};

export const FINELY_PUBLIC_COMPLIANCE_LINE =
  'Results vary · not legal advice · funding subject to underwriting';

export type FinelyPublicTopic =
  | 'site_overview'
  | 'credit_restore'
  | 'dispute_vs_debt'
  | 'page_help'
  | 'pricing_funding'
  | 'term_explain';

const INTERNAL_ROUTE_PATTERN = /\/(?:admin|portal)(?:\/[^\s)]*)?/gi;
const INTERNAL_LEAK_TERMS =
  /\b(SOP|standard operating procedure|ops co-?pilot|workflow queue|admin panel|internal ops|CRM intake|automation monitoring)\b/i;

function isPublicSafeSop(sop: PlatformSop | null | undefined): sop is PlatformSop {
  if (!sop) return false;
  return sop.audience === 'visitor' || sop.audience === 'all';
}

/** Strip admin/portal paths and internal ops language from public-facing replies. */
export function sanitizeFinelyPublicReply(text: string): string {
  let out = text.replace(INTERNAL_ROUTE_PATTERN, '[partner portal]');
  if (INTERNAL_LEAK_TERMS.test(out)) {
    out = out.replace(INTERNAL_LEAK_TERMS, 'partner guide');
  }
  return out;
}

/** True when unified public RAG has a strong eGuide/article hit for this query. */
export function hasStrongPublicKnowledgeHit(message: string, pathname?: string, minScore = 3): boolean {
  const hits = searchFinelyKnowledgePublic(message, { limit: 2, contextRoute: pathname, minScore });
  return hits.length > 0;
}

/**
 * Only intercept when we classified a real FAQ — not every knowledge hit.
 * A KB hit used to dump the homepage SOP ("Steps: 1. 2. 3.") for questions
 * like "what is FCRA". Those go to the live specialist path instead.
 */
export function shouldUseFinelyPublicAnswer(message: string, _pathname?: string): boolean {
  return classifyFinelyPublicTopic(message) !== null;
}

/**
 * True when the message reads like the visitor is describing their own
 * specific situation (a dollar amount, a credit-score-style number, or a
 * long multi-clause narrative) rather than asking a short, generic FAQ.
 *
 * G1: several `classifyFinelyPublicTopic()` buckets used single, broad
 * keywords (e.g. "cost", "fund", "fix my credit") that matched anywhere in
 * a message — including inside a long, personal narrative that happens to
 * mention one of those words. This guard keeps those buckets narrow: a
 * question this specific gets real, adaptive LLM reasoning instead of a
 * generic canned/local-knowledge snippet, even if it contains an
 * FAQ-shaped keyword.
 */
function looksLikeSpecificSituation(msg: string): boolean {
  if (/\$\s?\d/.test(msg)) return true;
  if (/\b\d{3}\s*(score|fico)\b/.test(msg)) return true;
  if (/\b\d{4,}\b/.test(msg)) return true;
  const wordCount = msg.split(/\s+/).filter(Boolean).length;
  return wordCount > 22;
}

export function classifyFinelyPublicTopic(message: string): FinelyPublicTopic | null {
  const msg = message.toLowerCase().trim();
  if (!msg) return null;

  if (
    /\b(what is this (site|page|website)|what('s| is) (this|finely)|what does finely cred do|who is finely)\b/.test(msg) ||
    /\bwhat does (this )?(site|page|website) do\b/.test(msg) ||
    /\bwhat is finely cred\b/.test(msg)
  ) {
    return 'site_overview';
  }

  if (
    /\b(start (the )?free guide|free guide stack|how do i start (the )?free guide)\b/.test(msg) ||
    /\bstart free guide\b/.test(msg)
  ) {
    return 'pricing_funding';
  }

  // Narrowed (G1): the old rule also matched any message that merely
  // mentioned a dispute-ish word and a debt-ish word anywhere
  // (`/\b(dispute|bureau).*(debt|collection|collector)\b/` and its
  // mirror), which caught genuinely personal, situation-specific questions
  // ("I disputed a $4,200 collection with the bureau, why won't the
  // collector remove it?") and gave them a generic explainer instead of
  // real reasoning about the visitor's actual case. Kept only messages
  // that are explicitly *asking to compare* the two letter types.
  if (
    /\b(dispute letters?|debt letters?|validation letters?).*(vs|versus|or|difference|different)\b/.test(msg) ||
    /\bdispute vs debt\b/.test(msg) ||
    /\bwhat('s| is) the difference between (a |an )?(dispute|debt|validation) letter/.test(msg)
  ) {
    return 'dispute_vs_debt';
  }

  // Narrowed (G1): dropped "fix my credit" / "repair my credit" — those are
  // generic enough phrases that they routinely show up inside long,
  // situation-specific questions (a bankruptcy, several collections, a
  // specific balance) that deserve real reasoning, not a canned snippet.
  // Also gated on `looksLikeSpecificSituation` so a detailed version of the
  // remaining phrases still reaches the LLM.
  if (
    !looksLikeSpecificSituation(msg) &&
    /\b(credit restore|restore my credit|personal restore|how does (personal )?credit restore work)\b/.test(msg)
  ) {
    return 'credit_restore';
  }

  if (
    /\b(what should i do on this page|what is this page for|help on this page|what do i do here)\b/.test(msg)
  ) {
    return 'page_help';
  }

  // Narrowed (G1): this used to be one giant single-keyword bucket —
  // `price|pricing|cost|fund|funding|loan|underwrit|guarantee|legal
  // advice|lawsuit|attorney|sue|fdcpa|fcra rights` — where a single word
  // appearing anywhere in the message (e.g. "attorney", "sue", "lawsuit",
  // "guarantee", "underwrit*") short-circuited to a canned reply. Those
  // words are exactly the signal that a visitor is asking about their own
  // legal/financial situation, which real LLM reasoning (guarded by the
  // "never legal advice" system prompt already on the public persona)
  // serves far better than a local-knowledge snippet. Kept only pure
  // pricing/service-navigation keywords, and gated on
  // `looksLikeSpecificSituation` so a long, detailed question that happens
  // to mention "cost" still reaches real reasoning.
  if (
    !looksLikeSpecificSituation(msg) &&
    (/\b(price|pricing|cost|fund|funding)\b/.test(msg) || /\b(diy|dfy|done-for-you|done for you)\b/.test(msg))
  ) {
    return 'pricing_funding';
  }

  if (
    /\bhow do credit disputes\b/.test(msg) ||
    /\bfree (credit )?dispute guide\b/.test(msg) ||
    /\bhow does finely cred help with (collections|debt)/.test(msg) ||
    /\bhow do i build business credit\b/.test(msg) ||
    /\bhow do i upload a credit report\b/.test(msg)
  ) {
    return 'pricing_funding';
  }

  if (humanSpokenReply(message)) {
    return 'term_explain';
  }

  return null;
}

function needsComplianceFooter(message: string, topic: FinelyPublicTopic | 'general'): boolean {
  const msg = message.toLowerCase();
  if (topic === 'pricing_funding' || topic === 'credit_restore' || topic === 'dispute_vs_debt' || topic === 'term_explain') {
    return true;
  }
  return /\b(fund|funding|loan|credit score|delete|removal|guarantee|legal|lawsuit|attorney|fdcpa|fcra)\b/.test(msg);
}

function appendCompliance(reply: string, message: string, topic: FinelyPublicTopic | 'general'): { text: string; appended: boolean } {
  if (!needsComplianceFooter(message, topic)) return { text: reply, appended: false };
  if (reply.includes(FINELY_PUBLIC_COMPLIANCE_LINE)) return { text: reply, appended: false };
  return { text: `${reply.trim()}\n\n${FINELY_PUBLIC_COMPLIANCE_LINE}`, appended: true };
}

function formatForChannel(text: string, channel: FinelyPublicAnswerChannel, seniorMode: boolean): string {
  if (channel === 'voice') {
    return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (seniorMode || channel === 'strip') {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');
  }
  return text;
}

function buildGeneralReply(
  ctx: ReturnType<typeof resolveFinelyPageContext>,
  hits: FinelyKnowledgeHit[],
  message: string,
): string {
  const spoken = humanSpokenReply(message);
  if (spoken) return spoken;

  const msg = message.toLowerCase();
  const askingPageHelp = /\b(what should i do on this page|what is this page for|help on this page|what do i do here)\b/.test(msg);

  if (PUBLIC_DEMO_VIDEOS_ENABLED && (msg.includes('video') || msg.includes('watch'))) {
    return ctx.tour
      ? `There is a short walkthrough for this page: ${ctx.tour.title}. Tap Watch how if you want to see it.`
      : 'Tell me what you want to see and I will walk you through it.';
  }

  if (askingPageHelp && isPublicSafeSop(ctx.sop)) {
    return speakPageHelp(ctx.sop.whenToUse, ctx.sop.steps[0]?.label);
  }

  const top = hits.find(
    (h) => !shouldSkipKnowledgeArticle(h.id) && excerptAnswersQuery(message, `${h.title} ${h.snippet}`),
  );
  if (top) {
    return speakKnowledgeHit(top.title, top.snippet);
  }

  return HUMAN_I_DONT_KNOW;
}

function buildTopicReply(
  topic: FinelyPublicTopic,
  ctx: ReturnType<typeof resolveFinelyPageContext>,
  hits: FinelyKnowledgeHit[],
  message: string,
): string {
  switch (topic) {
    case 'site_overview':
      return HUMAN_SITE_OVERVIEW;
    case 'dispute_vs_debt':
      return HUMAN_DISPUTE_VS_DEBT;
    case 'credit_restore':
      return HUMAN_CREDIT_RESTORE;
    case 'term_explain':
      return humanSpokenReply(message) ?? HUMAN_GENERIC_NEXT;
    case 'page_help':
      return isPublicSafeSop(ctx.sop)
        ? speakPageHelp(ctx.sop.whenToUse, ctx.sop.steps[0]?.label)
        : HUMAN_GENERIC_NEXT;
    case 'pricing_funding': {
      const msg = message.toLowerCase();
      if (
        /\b(start (the )?free guide|free guide stack|how do i start (the )?free guide)\b/.test(msg) ||
        /\bstart free guide\b/.test(msg)
      ) {
        return HUMAN_FREE_GUIDE;
      }
      return HUMAN_PRICING;
    }
    default:
      return buildGeneralReply(ctx, hits, message);
  }
}

/**
 * Unified public Q&A entry for Ask Finely strip, public chat, and voice read-back.
 * Uses the same knowledge index + page context as the brain orchestrator.
 */
export function finelyPublicAnswer(input: FinelyPublicAnswerInput): FinelyPublicAnswerResult {
  const seniorMode = input.seniorMode ?? (input.channel === 'strip' || input.channel === 'voice');
  const ctx = resolveFinelyPageContext(input.pathname);
  const hits = searchFinelyKnowledgePublic(input.message, { limit: 4, contextRoute: input.pathname });
  const citations: FinelyBrainCitation[] = hits.map((h) => ({
    id: h.id,
    title: h.title,
    route: h.route,
    source: h.source,
  }));

  const classified = classifyFinelyPublicTopic(input.message);
  const effectiveTopic: FinelyPublicTopic | 'general' = classified ?? 'general';

  let replyBody =
    classified != null
      ? buildTopicReply(classified, ctx, hits, input.message)
      : humanSpokenReply(input.message) ?? buildGeneralReply(ctx, hits, input.message);

  replyBody = sanitizeFinelyPublicReply(replyBody);

  const { text: withCompliance, appended } = appendCompliance(replyBody, input.message, effectiveTopic);
  const channelReply = formatForChannel(withCompliance, input.channel, seniorMode);

  return {
    reply: channelReply,
    personaId: ctx.personaId,
    citations,
    tourId: ctx.tour?.id,
    sopId: ctx.sop?.id,
    topic: effectiveTopic,
    complianceAppended: appended,
  };
}
