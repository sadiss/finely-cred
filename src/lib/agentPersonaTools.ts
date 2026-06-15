import type { AgentPersonaId } from '../domain/agentPersonas';

export type AgentPersonaToolId =
  | 'book_session'
  | 'open_funnel'
  | 'open_portal'
  | 'browse_bookstore'
  | 'open_calendar'
  | 'view_tasks';

export type AgentPersonaTool = {
  id: AgentPersonaToolId;
  label: string;
  /** Static path or resolver from context */
  path: string | ((ctx: AgentToolContext) => string);
};

export type AgentToolContext = {
  goal?: string | null;
  funnelPath?: string;
  partnerId?: string;
};

export const AGENT_PERSONA_TOOLS: Record<AgentPersonaToolId, AgentPersonaTool> = {
  book_session: {
    id: 'book_session',
    label: 'Book free session',
    path: '/enlightenment-session',
  },
  open_funnel: {
    id: 'open_funnel',
    label: 'Free guide stack',
    path: (ctx) => {
      const g = (ctx.goal ?? '').toLowerCase();
      if (g.includes('debt')) return '/free-debt-guide';
      if (g.includes('business') || g.includes('agency')) return '/free-business-guide';
      if (g.includes('tradeline')) return '/free-tradeline-guide';
      if (g.includes('affiliate')) return '/affiliate-toolkit';
      return ctx.funnelPath ?? '/free-guide';
    },
  },
  open_portal: {
    id: 'open_portal',
    label: 'Open portal',
    path: '/portal/dashboard',
  },
  browse_bookstore: {
    id: 'browse_bookstore',
    label: 'Browse playbooks',
    path: '/bookstore',
  },
  open_calendar: {
    id: 'open_calendar',
    label: 'Calendar',
    path: '/portal/calendar',
  },
  view_tasks: {
    id: 'view_tasks',
    label: 'My tasks',
    path: '/portal/work',
  },
};

/** Default executable tools per persona (Phase 6). */
export const PERSONA_DEFAULT_TOOLS: Partial<Record<AgentPersonaId, AgentPersonaToolId[]>> = {
  finely_advisor: ['open_funnel', 'book_session', 'open_portal'],
  dispute_coach: ['view_tasks', 'open_portal', 'book_session'],
  funding_strategist: ['browse_bookstore', 'book_session', 'open_portal'],
  nurture_concierge: ['open_funnel', 'book_session'],
  support_specialist: ['view_tasks', 'open_portal'],
  appointment_setter: ['book_session', 'open_calendar'],
  sales_closer: ['browse_bookstore', 'book_session', 'open_funnel'],
  lead_converter: ['open_portal', 'open_funnel', 'view_tasks'],
  debt_strategist: ['open_funnel', 'book_session', 'view_tasks'],
  ops_copilot: ['open_portal'],
  letter_ops_agent: ['open_portal', 'view_tasks'],
  compliance_agent: ['open_portal'],
  education_coach: ['open_portal', 'browse_bookstore', 'view_tasks'],
  affiliate_specialist: ['open_funnel', 'open_portal'],
  processing_agent: ['view_tasks', 'open_portal', 'book_session'],
  evidence_specialist: ['view_tasks', 'open_portal'],
  crm_intake_specialist: ['open_funnel', 'book_session', 'open_portal'],
  underwriting_analyst: ['browse_bookstore', 'book_session', 'open_portal'],
};

export function toolsForPersona(personaId: AgentPersonaId): AgentPersonaTool[] {
  const ids = PERSONA_DEFAULT_TOOLS[personaId] ?? ['book_session', 'open_funnel'];
  return ids.map((id) => AGENT_PERSONA_TOOLS[id]).filter(Boolean);
}

export function resolveToolPath(tool: AgentPersonaTool, ctx: AgentToolContext): string {
  return typeof tool.path === 'function' ? tool.path(ctx) : tool.path;
}
