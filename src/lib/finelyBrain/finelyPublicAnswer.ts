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
  | 'pricing_funding';

const DISPUTE_VS_DEBT_REPLY =
  'Credit dispute letters go to the bureaus and furnishers under the FCRA — they challenge inaccurate fields on your credit reports. ' +
  'Debt letters (validation, cease-contact, settlement) go to collectors or creditors on the debt track — different rules, different mail targets. ' +
  'In Finely Cred, use Disputes + Letter Studio for report inaccuracies; use Debt workflows for collections and validation. ' +
  'Pick one clean claim per letter and keep your evidence in the vault.';

const SITE_OVERVIEW_REPLY =
  'Finely Cred is an educational platform for partners fixing personal credit, handling debt the right way, and building fundability. ' +
  'You get guided disputes, document storage, letter tools, and optional done-for-you support — all in one portal. ' +
  'Start with a free guide or Ask Finely on any page for the next step.';

const FREE_GUIDE_REPLY =
  'The free guide is a step-by-step credit dispute field kit — rights cheat sheet, round-one letter sequence, and escalation ladder. ' +
  'Open Start free guide (/free-guide) — no payment required. Work DIY from there or book a session when you want hands-on help.';

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

/** Route public strip/chat/voice FAQ prompts through one brain for consistent copy. */
export function shouldUseFinelyPublicAnswer(message: string, pathname?: string): boolean {
  if (classifyFinelyPublicTopic(message) !== null) return true;
  return hasStrongPublicKnowledgeHit(message, pathname);
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

  if (
    /\b(dispute letters?|debt letters?|validation letters?).*(vs|versus|or|difference|different)\b/.test(msg) ||
    /\b(dispute|bureau).*(debt|collection|collector)\b/.test(msg) ||
    /\b(debt|collection).*(dispute|bureau|credit report)\b/.test(msg) ||
    /\bdispute vs debt\b/.test(msg)
  ) {
    return 'dispute_vs_debt';
  }

  if (/\b(credit restore|restore my credit|personal restore|fix my credit|repair my credit)\b/.test(msg)) {
    return 'credit_restore';
  }

  if (
    /\b(what should i do on this page|what is this page for|help on this page|what do i do here)\b/.test(msg)
  ) {
    return 'page_help';
  }

  if (
    /\b(price|pricing|cost|fund|funding|loan|underwrit|guarantee|legal advice|lawsuit|attorney|sue|fdcpa|fcra rights)\b/.test(
      msg,
    ) ||
    /\b(diy|dfy|done-for-you|done for you)\b/.test(msg)
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

  return null;
}

function needsComplianceFooter(message: string, topic: FinelyPublicTopic | 'general'): boolean {
  const msg = message.toLowerCase();
  if (topic === 'pricing_funding' || topic === 'credit_restore' || topic === 'dispute_vs_debt') return true;
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
  const msg = message.toLowerCase();

  if (PUBLIC_DEMO_VIDEOS_ENABLED && (msg.includes('video') || msg.includes('watch'))) {
    return ctx.tour
      ? `Tap "Watch how" to play: ${ctx.tour.title}. It walks through each step slowly with captions.`
      : 'Open Resources → Videos for guided tours, or use Start Here for an overview.';
  }

  if (msg.includes('video') || msg.includes('watch')) {
    return isPublicSafeSop(ctx.sop)
      ? `${ctx.sop.title}. ${ctx.sop.whenToUse} Follow the numbered steps on this page, or ask me to walk through one step at a time.`
      : 'Tell me what you are trying to do on this page and I will guide you step by step.';
  }

  if (isPublicSafeSop(ctx.sop)) {
    const steps = ctx.sop.steps.map((s) => `${s.order}. ${s.label}`).join('  ');
    const watch = PUBLIC_DEMO_VIDEOS_ENABLED && ctx.tour ? ' Want to watch a short video? Tap "Watch how".' : '';
    return `${ctx.sop.title}. ${ctx.sop.whenToUse}\nSteps: ${steps}.${watch}`;
  }

  const top = hits[0];
  if (top) {
    const watch =
      PUBLIC_DEMO_VIDEOS_ENABLED && ctx.tour ? ' Ask "watch how" for a video on this page.' : '';
    return `${top.title}: ${top.snippet}${watch}`;
  }

  return 'Tell me what you are trying to do — fix credit, upload a report, or refer someone — and I will guide you step by step.';
}

function buildTopicReply(
  topic: FinelyPublicTopic,
  ctx: ReturnType<typeof resolveFinelyPageContext>,
  hits: FinelyKnowledgeHit[],
  message: string,
): string {
  switch (topic) {
    case 'site_overview': {
      const page =
        (isPublicSafeSop(ctx.sop) ? ctx.sop.whenToUse : null) ??
        (hits[0]
          ? `${hits[0].title}: ${hits[0].snippet}`
          : 'Tell me your goal — restore credit, debt help, or business funding.');
      return `${SITE_OVERVIEW_REPLY}\n\nOn this page: ${page}`;
    }
    case 'dispute_vs_debt':
      return DISPUTE_VS_DEBT_REPLY;
    case 'credit_restore': {
      const hit = hits.find((h) => /restore|dispute|report/i.test(h.title + h.text)) ?? hits[0];
      return hit
        ? `Personal credit restore here means evidence-first disputes plus clean documentation — not quick-fix hype.\n\n${hit.title}: ${hit.snippet}`
        : 'Personal credit restore starts with a current report, then one inaccurate item at a time with proof in your vault. Open Start Here or your free guide for the first checklist.';
    }
    case 'page_help':
      return buildGeneralReply(ctx, hits, message);
    case 'pricing_funding': {
      const msg = message.toLowerCase();
      if (
        /\b(start (the )?free guide|free guide stack|how do i start (the )?free guide)\b/.test(msg) ||
        /\bstart free guide\b/.test(msg)
      ) {
        return FREE_GUIDE_REPLY;
      }
      return buildGeneralReply(ctx, hits, message);
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
      : buildGeneralReply(ctx, hits, input.message);

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
