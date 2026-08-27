import type { KnowledgeCategory } from '../knowledge/finelyKnowledgeBase';
import type { AgentPersonaId } from '../domain/agentPersonas';
import type { SupportTopic } from '../domain/support';
import {
  formatKnowledgeForPrompt,
  retrieveKnowledge,
  suggestFollowUps,
  type RetrievedKnowledgeChunk,
} from '../knowledge/retrieveKnowledge';
import { resolveFinelyPageContext } from './finelyBrain/finelyBrainOrchestrate';
import {
  formatFinelyKnowledgeForPrompt,
  searchFinelyKnowledgePublic,
  type FinelyKnowledgeHit,
} from './finelyKnowledgeIndex';

export { resolveFinelyPageContext as launchOsHelpForPath };

type AiSurface = 'communication_hub' | 'public_homepage' | 'public_widget' | 'lead_intel';

const SURFACE_CATEGORY: Partial<Record<AiSurface, KnowledgeCategory>> = {
  public_homepage: 'onboarding',
  public_widget: 'onboarding',
  communication_hub: 'portal',
  lead_intel: 'onboarding',
};

const PERSONA_CATEGORY: Partial<Record<AgentPersonaId, KnowledgeCategory>> = {
  dispute_coach: 'disputes',
  debt_strategist: 'debt',
  funding_strategist: 'funding',
  sales_closer: 'pricing',
  support_specialist: 'portal',
};

const TOPIC_CATEGORY: Partial<Record<SupportTopic, KnowledgeCategory>> = {
  disputes: 'disputes',
  debt_summons: 'debt',
  business: 'funding',
  billing: 'pricing',
  documents: 'documents',
};

/** Route → KB category + owners guide anchor (Phase 34). */
const PATH_ROUTES: Array<{ test: RegExp; category: KnowledgeCategory; sectionId: string; label: string }> = [
  { test: /^\/portal\/(letters|disputes)/, category: 'disputes', sectionId: 'disputes', label: 'Disputes & letters' },
  { test: /^\/portal\/(reports|credit)/, category: 'documents', sectionId: 'credit', label: 'Credit reports' },
  { test: /^\/portal\/(messages|calendar|meeting)/, category: 'portal', sectionId: 'comms', label: 'Communication Hub' },
  { test: /^\/portal\/(billing|checkout)/, category: 'pricing', sectionId: 'billing', label: 'Billing' },
  { test: /^\/portal\/(wealth-paths|tradelines)/, category: 'funding', sectionId: 'wealth', label: 'Funding & tradelines' },
  { test: /^\/admin\/(leads|crm|funnel)/, category: 'onboarding', sectionId: 'leads', label: 'Leads & CRM' },
  { test: /^\/admin\/(support|comms|inbox)/, category: 'portal', sectionId: 'comms', label: 'Partner conversations' },
  { test: /^\/admin\/(automations|ops-agent)/, category: 'portal', sectionId: 'platform_os', label: 'Automations' },
  { test: /^\/admin\/(integrations|monitoring)/, category: 'portal', sectionId: 'platform_os', label: 'Integrations' },
  { test: /^\/(free-guide|free-debt-guide|free-business-guide|free-tradeline-guide|resources)/, category: 'onboarding', sectionId: 'leads', label: 'Lead magnets' },
  { test: /^\/(help-center|start-here)/, category: 'onboarding', sectionId: 'start', label: 'Help & start' },
  { test: /^\/(tradelines|enlightenment-session)/, category: 'funding', sectionId: 'wealth', label: 'Tradelines & sessions' },
  { test: /^\/(pricing|services)/, category: 'pricing', sectionId: 'pricing', label: 'Pricing' },
  { test: /^\/claim/, category: 'onboarding', sectionId: 'start', label: 'Claim profile' },
  { test: /^\/contact/, category: 'onboarding', sectionId: 'comms', label: 'Contact & support' },
  { test: /^\/faq/, category: 'onboarding', sectionId: 'start', label: 'FAQ' },
  { test: /^\/about/, category: 'onboarding', sectionId: 'start', label: 'About Finely Cred' },
  { test: /^\/$/, category: 'onboarding', sectionId: 'start', label: 'Finely Cred home' },
];

export function contextHelpForPath(pathname: string): {
  sectionId: string;
  label: string;
  category: KnowledgeCategory;
  ownersGuideHref: string;
} {
  const path = pathname.split('?')[0] ?? pathname;
  const hit = PATH_ROUTES.find((r) => r.test.test(path));
  if (hit) {
    return {
      sectionId: hit.sectionId,
      label: hit.label,
      category: hit.category,
      ownersGuideHref: `/owners-guide#${hit.sectionId}`,
    };
  }
  return {
    sectionId: 'start',
    label: 'Owner\'s guide',
    category: 'onboarding',
    ownersGuideHref: '/owners-guide#start',
  };
}

export function routeKnowledgeForPath(pathname: string, query?: string) {
  const ctx = contextHelpForPath(pathname);
  const q = (query ?? ctx.label).trim();
  return routeKnowledgeForQuery({
    query: q,
    surface: pathname.startsWith('/admin') ? 'lead_intel' : 'public_homepage',
    limit: 4,
  });
}

/** Partner-facing surfaces must never inject admin SOPs into AI prompts. */
const PARTNER_SAFE_SURFACES: ReadonlySet<AiSurface> = new Set(['communication_hub']);

function publicHitsToChunks(hits: FinelyKnowledgeHit[]): RetrievedKnowledgeChunk[] {
  return hits.map((h) => ({
    article: {
      id: h.id,
      title: h.title,
      category: 'portal' as KnowledgeCategory,
      tags: [],
      content: h.text,
      links: h.route ? [{ label: h.title, path: h.route }] : undefined,
    },
    score: h.score,
    excerpt: h.snippet,
  }));
}

export function routeKnowledgeForQuery(args: {
  query: string;
  surface?: AiSurface;
  personaId?: AgentPersonaId;
  supportTopic?: SupportTopic;
  limit?: number;
  /** Current route for public-safe RAG affinity (portal coach). */
  contextRoute?: string;
}): { chunks: RetrievedKnowledgeChunk[]; promptBlock: string; followUps: string[] } {
  if (args.surface && PARTNER_SAFE_SURFACES.has(args.surface)) {
    const hits = searchFinelyKnowledgePublic(args.query, {
      limit: args.limit ?? 5,
      contextRoute: args.contextRoute,
    });
    const chunks = publicHitsToChunks(hits);
    return {
      chunks,
      promptBlock: formatFinelyKnowledgeForPrompt(hits),
      followUps: suggestFollowUps(chunks),
    };
  }

  const categoryBoost =
    (args.personaId && PERSONA_CATEGORY[args.personaId]) ||
    (args.supportTopic && TOPIC_CATEGORY[args.supportTopic]) ||
    (args.surface && SURFACE_CATEGORY[args.surface]);

  const chunks = retrieveKnowledge({
    query: args.query,
    limit: args.limit ?? 5,
    categoryBoost,
  });

  // Phase 5: public/lead surfaces also pull from the deepened, public-safe
  // finelyKnowledgeIndex (letters/Letter Studio, validation doctrine, funding
  // readiness, affiliate payouts, CRM/pricing) — merged alongside the original
  // scripted-article KB rather than replacing it, so answers go beyond a shallow
  // welcome + basic Q&A. Compliance guard downstream in conversationalAi.ts is untouched.
  const deepHits = searchFinelyKnowledgePublic(args.query, {
    limit: Math.min(6, (args.limit ?? 5) + 1),
    contextRoute: args.contextRoute,
  });
  const deepChunks = publicHitsToChunks(deepHits);
  const mergedChunks = [...chunks, ...deepChunks];
  const deepBlock = formatFinelyKnowledgeForPrompt(deepHits);

  return {
    chunks: mergedChunks,
    promptBlock: [formatKnowledgeForPrompt(chunks), deepBlock].filter(Boolean).join('\n\n'),
    followUps: suggestFollowUps(mergedChunks),
  };
}
