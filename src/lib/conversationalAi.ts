import { supabase, isSupabaseConfigured } from './supabaseClient';
import { callAiGateway, callPublicAiGateway, type AiGatewayMessage } from './aiClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { routeKnowledgeForQuery, routeKnowledgeForPath } from './knowledgeBaseRouter';
import { guardAiChatOutput } from './complianceEngine';
import type { RetrievedKnowledgeChunk } from '../knowledge/retrieveKnowledge';
import { suggestFollowUps } from '../knowledge/retrieveKnowledge';
import type { AgentPersonaId } from '../domain/agentPersonas';

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
  locale?: 'en' | 'ht' | 'fr';
  conversationalAddendum?: string;
};

export type ConversationalAiResult = {
  text: string;
  source: 'gateway' | 'knowledge_local';
  followUps: string[];
  knowledgeUsed: RetrievedKnowledgeChunk[];
};

const PUBLIC_SYSTEM_BASE = `You write as a named Finely Cred staff member in live chat — warm, human, and concise. Use first person ("I'm Morgan…", "Let me walk you through…"). Make the visitor feel welcomed, educated, and already part of the team.

Use the FINELY CRED KNOWLEDGE BASE below as your primary source. Ask one clarifying question when helpful. Suggest specific next steps (free guide, strategy call, pricing, onboarding) when appropriate.

Never guarantee score increases or deletions. For legal questions, give process guidance only — not legal advice.

If the user wants human help, mention they can book a free strategy call or continue chatting here.`;

const buildPublicGreeting = (name?: string) =>
  name?.trim()
    ? `Hey ${name.split(' ')[0]} — I'm Finely AI. Ask me anything about credit restore, disputes, DIY vs DFY, or how the portal works.`
    : `Hey — I'm Finely AI. Ask me anything about credit restore, disputes, funding, or how Finely Cred works. What's on your mind?`;

export { buildPublicGreeting };

export async function converseWithFinelyAi(args: {
  messages: AiGatewayMessage[];
  userMessage: string;
  systemPromptBase: string;
  taskType: string;
  context: ConversationalAiContext;
  providerHint?: 'openai' | 'gemini' | 'anthropic';
}): Promise<ConversationalAiResult> {
  const trimmed = args.userMessage.trim();
  const routed = args.context.pathname
    ? routeKnowledgeForPath(args.context.pathname, trimmed)
    : routeKnowledgeForQuery({
        query: trimmed,
        surface: args.context.surface,
        personaId: args.context.personaId,
        limit: 5,
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

  if (canUsePublicGateway) {
    try {
      const prior = args.messages.filter((m) => m.role !== 'system');
      const last = prior[prior.length - 1];
      const withUser =
        last?.role === 'user' && last.content.trim() === trimmed
          ? prior
          : [...prior, { role: 'user' as const, content: trimmed }];
      const res = await callPublicAiGateway({
        taskType: 'public_chat',
        messages: [{ role: 'system', content: system }, ...withUser],
        context: args.context as Record<string, unknown>,
        providerHint: args.providerHint ?? 'openai',
      });
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
      const res = await callAiGateway({
        taskType: args.taskType,
        messages: [{ role: 'system', content: system }, ...withUser],
        context: args.context as Record<string, unknown>,
        providerHint: args.providerHint ?? 'openai',
      });
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
  const q = query.toLowerCase();
  const topChunk = chunks[0];
  const top = topChunk?.article;
  if (!top || !topChunk) {
    return "I'm here to help with credit restore, disputes, documents, and funding. What are you trying to accomplish — personal restore, business credit, debt help, or tradelines?";
  }

  const linkHint = top.links?.[0] ? `\n\n→ You can open **${top.links[0].label}** in the portal when you're ready.` : '';

  if (q.includes('video') || q.includes('call') || q.includes('meeting')) {
    const vid = chunks.find((c) => c.article.category === 'video');
    return `${vid?.excerpt ?? topChunk.excerpt}\n\nFrom Team chat or Calendar you can start or join a video room with your specialist, affiliate manager, or Finely team.${linkHint}`;
  }

  if (q.includes('price') || q.includes('cost') || q.includes('diy') || q.includes('dfy')) {
    const pricing = chunks.find((c) => c.article.id === 'diy-vs-dfy');
    return `${pricing?.excerpt ?? topChunk.excerpt}${linkHint}\n\nWant me to walk through DIY trial vs full DFY execution?`;
  }

  if (q.includes('letter') || q.includes('dispute') || q.includes('bureau')) {
    return `${topChunk.excerpt}${linkHint}\n\nTell me which round you're on or what type of account you're targeting — I'll narrow the steps.`;
  }

  if (q.includes('id') || q.includes('ssn') || q.includes('scan') || q.includes('camera') || q.includes('document')) {
    const doc = chunks.find((c) => c.article.category === 'documents') ?? topChunk;
    return `${doc.excerpt}\n\nUse the camera scan with the ID or SSN profile — it auto-focuses on the card even if your hand is in frame.${linkHint}`;
  }

  const name = ctx.userName?.split(' ')[0];
  const opener = name ? `${name}, ` : '';
  return `${opener}here's what I know:\n\n${topChunk.excerpt}${linkHint}\n\nAsk a follow-up or tap a suggestion below.`;
}
