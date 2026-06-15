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
  { test: /^\/admin\/(support|comms|inbox)/, category: 'portal', sectionId: 'comms', label: 'Support inbox' },
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

export function routeKnowledgeForQuery(args: {
  query: string;
  surface?: AiSurface;
  personaId?: AgentPersonaId;
  supportTopic?: SupportTopic;
  limit?: number;
}): { chunks: RetrievedKnowledgeChunk[]; promptBlock: string; followUps: string[] } {
  const categoryBoost =
    (args.personaId && PERSONA_CATEGORY[args.personaId]) ||
    (args.supportTopic && TOPIC_CATEGORY[args.supportTopic]) ||
    (args.surface && SURFACE_CATEGORY[args.surface]);

  const chunks = retrieveKnowledge({
    query: args.query,
    limit: args.limit ?? 5,
    categoryBoost,
  });

  return {
    chunks,
    promptBlock: formatKnowledgeForPrompt(chunks),
    followUps: suggestFollowUps(chunks),
  };
}
