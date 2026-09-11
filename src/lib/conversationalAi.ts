import { supabase, isSupabaseConfigured } from './supabaseClient';
import { callAiGateway, callPublicAiGateway, type AiGatewayMessage } from './aiClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { routeKnowledgeForQuery, routeKnowledgeForPath } from './knowledgeBaseRouter';
import { resolveAiProviderHint } from './aiTaskRouting';
import { guardAiChatOutput } from './complianceEngine';
import type { RetrievedKnowledgeChunk } from '../knowledge/retrieveKnowledge';
import { suggestFollowUps } from '../knowledge/retrieveKnowledge';
import type { AgentPersonaId } from '../domain/agentPersonas';
import type { ChatLocale } from './publicChatI18n';
import {
  HUMAN_I_DONT_KNOW,
  excerptAnswersQuery,
  humanSpokenReply,
  shouldSkipKnowledgeArticle,
  speakKnowledgeHit,
} from './finelyBrain/humanCreditTalk';

export type ConversationalAiSurface = 'communication_hub' | 'public_homepage' | 'public_widget' | 'lead_intel';

export type ConversationalAiContext = {
  surface: ConversationalAiSurface;
  partnerId?: string;
  lane?: string;
  journeyStage?: string;
  userName?: string;
  goal?: string;
  personaId?: AgentPersonaId;
  /** Current route for path-aware KB (Phase 34). */
  pathname?: string;
  locale?: ChatLocale;
  conversationalAddendum?: string;
};

export type ConversationalAiResult = {
  text: string;
  source: 'gateway' | 'knowledge_local';
  followUps: string[];
  knowledgeUsed: RetrievedKnowledgeChunk[];
};

const PUBLIC_SYSTEM_BASE = `You write as a named Finely Cred staff member in live chat. Talk like a specialist at a desk — short, plain, first person. Answer the question they asked first in 2–4 sentences.

If they ask how to find a credit score or free report, send them to AnnualCreditReport.com. Do not lecture about restore or wellbeing.

If they ask what a law or term is (FCRA, FDCPA, PAYDEX, CFPB), define it in two spoken sentences. Do not dump a numbered SOP, "Steps:" list, or Start Here checklist unless they asked what to do on this page.

If you do not know, say so in one sentence, then offer one door: the official site, the free guide, or a session. Do not fill silence with restore speech.

Never open with "Great question" or "I'd be happy to help." Do not sound like a brochure.

Use the FINELY CRED KNOWLEDGE BASE as facts, not as copy to recite.

Never guarantee score increases or deletions. For legal questions, give process guidance only — not legal advice.

If they want a live person, they can book a free strategy call or keep talking here.`;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('ai-timeout')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const PUBLIC_GATEWAY_MS = 8000;

const buildPublicGreeting = (name?: string) =>
  name?.trim()
    ? `Hey ${name.split(' ')[0]} — what is in front of you? A report, a collector letter, or a company file.`
    : `What is in front of you — a report, a collector letter, or a company file?`;

export { buildPublicGreeting };

export async function converseWithFinelyAi(args: {
  messages: AiGatewayMessage[];
  userMessage: string;
  systemPromptBase: string;
  taskType: string;
  context: ConversationalAiContext;
  providerHint?: 'openai' | 'gemini' | 'anthropic' | 'groq';
}): Promise<ConversationalAiResult> {
  const trimmed = args.userMessage.trim();
  const routed = args.context.pathname
    ? routeKnowledgeForPath(args.context.pathname, trimmed, args.context.personaId)
    : routeKnowledgeForQuery({
        query: trimmed,
        surface: args.context.surface,
        personaId: args.context.personaId,
        limit: 5,
        contextRoute: args.context.pathname,
      });
  const knowledge = routed.chunks;
  const kbBlock = routed.promptBlock;
  const contextLine = [
    args.context.userName ? `User name: ${args.context.userName}` : null,
    args.context.goal ? `Stated goal: ${args.context.goal}` : null,
    args.context.lane ? `Lane: ${args.context.lane}` : null,
    args.context.journeyStage ? `Journey stage: ${args.context.journeyStage}` : null,
    args.context.locale ? `Preferred locale: ${args.context.locale}` : null,
    `Surface: ${args.context.surface}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const system = `${args.systemPromptBase}\n\n${args.context.conversationalAddendum ?? ''}\n\n${kbBlock}\n\nSession context: ${contextLine}`.replace(/\n{3,}/g, '\n\n');

  const isPublicSurface =
    args.context.surface === 'public_homepage' ||
    args.context.surface === 'public_widget' ||
    args.taskType === 'public_chat';

  const canUsePublicGateway = isPublicSurface && isFeatureEnabled('aiGateway') && isSupabaseConfigured;

  const providerHint = resolveAiProviderHint(args.taskType, args.providerHint);

  if (canUsePublicGateway) {
    try {
      const prior = args.messages.filter((m) => m.role !== 'system');
      const last = prior[prior.length - 1];
      const withUser =
        last?.role === 'user' && last.content.trim() === trimmed
          ? prior
          : [...prior, { role: 'user' as const, content: trimmed }];
      const res = await withTimeout(
        callPublicAiGateway({
          taskType: 'public_chat',
          messages: [{ role: 'system', content: system }, ...withUser],
          context: args.context as Record<string, unknown>,
          providerHint,
        }),
        PUBLIC_GATEWAY_MS,
      );
      return {
        text: guardAiChatOutput(res.text || '—'),
        source: 'gateway',
        followUps: routed.followUps.length ? routed.followUps : suggestFollowUps(knowledge),
        knowledgeUsed: knowledge,
      };
    } catch {
      // fall through
    }
  }

  const canUseGateway =
    isFeatureEnabled('aiGateway') &&
    isSupabaseConfigured &&
    (await supabase.auth.getSession()).data.session?.access_token;

  if (canUseGateway) {
    try {
      const prior = args.messages.filter((m) => m.role !== 'system');
      const last = prior[prior.length - 1];
      const withUser =
        last?.role === 'user' && last.content.trim() === trimmed
          ? prior
          : [...prior, { role: 'user' as const, content: trimmed }];
      const res = await withTimeout(
        callAiGateway({
          taskType: args.taskType,
          messages: [{ role: 'system', content: system }, ...withUser],
          context: args.context as Record<string, unknown>,
          providerHint,
        }),
        PUBLIC_GATEWAY_MS,
      );
      return {
        text: guardAiChatOutput(res.text || '—'),
        source: 'gateway',
        followUps: routed.followUps.length ? routed.followUps : suggestFollowUps(knowledge),
        knowledgeUsed: knowledge,
      };
    } catch {
      // fall through to local KB
    }
  }

  return {
    text: guardAiChatOutput(buildLocalKnowledgeReply(args.userMessage, knowledge, args.context)),
    source: 'knowledge_local',
    followUps: routed.followUps.length ? routed.followUps : suggestFollowUps(knowledge),
    knowledgeUsed: knowledge,
  };
}

function buildLocalKnowledgeReply(query: string, chunks: RetrievedKnowledgeChunk[], ctx: ConversationalAiContext): string {
  const spokenDoor = humanSpokenReply(query);
  if (spokenDoor) return spokenDoor;

  const q = query.toLowerCase();
  const usable = chunks.filter((c) => {
    if (shouldSkipKnowledgeArticle(c.article.id)) return false;
    return excerptAnswersQuery(query, `${c.article.title} ${c.excerpt}`);
  });
  const topChunk = usable[0] ?? null;
  const top = topChunk?.article;
  if (!top || !topChunk) {
    return HUMAN_I_DONT_KNOW;
  }

  const spoken = speakKnowledgeHit(top.title, topChunk.excerpt);

  if (q.includes('price') || q.includes('cost') || q.includes('diy') || q.includes('dfy')) {
    return `${spoken}\n\nYou can start on your own or have the desk run the file with you. Which way are you leaning?`;
  }

  if (q.includes('letter') || q.includes('dispute') || q.includes('bureau')) {
    return `${spoken}\n\nWhich account is this — and do you have the report in front of you?`;
  }

  if (q.includes('id') || q.includes('ssn') || q.includes('scan') || q.includes('camera') || q.includes('document')) {
    return `${spoken}\n\nIf you have the card or the letter, you can drop a photo here and I will tell you what I see.`;
  }

  const name = ctx.userName?.split(' ')[0];
  const opener = name ? `${name} — ` : '';
  return `${opener}${spoken}\n\nIf that is not what you meant, say it in your own words.`;
}
