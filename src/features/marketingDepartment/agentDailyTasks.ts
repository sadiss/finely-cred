/**
 * Daily task definitions per growth agent — drives AgentTaskHierarchyPanel.
 */
import type { GrowthAgentDef } from '../growthAgents/growthAgentRegistry';

export type AgentDailyTaskFrequency = 'daily' | 'weekly' | 'on_demand';

export type AgentDailyTask = {
  id: string;
  label: string;
  description: string;
  frequency: AgentDailyTaskFrequency;
  href?: string;
  runKey?: string;
};

const CALEB_DAILY: AgentDailyTask[] = [
  { id: 'find', label: 'Find new people', description: 'Live metro search across restore lane.', frequency: 'daily', href: '/admin/marketing?tab=desk&helper=find' },
  { id: 'review', label: 'Review staging queue', description: 'Approve or skip mid-score matches.', frequency: 'daily', href: '/admin/marketing?tab=desk&helper=find#exceptions' },
  { id: 'today10', label: "Today's 10 to contact", description: 'Best prospects ranked by talk score.', frequency: 'daily', runKey: 'today_ten' },
  { id: 'mission', label: "Run today's mission", description: 'Balanced daily quota across pipeline buckets.', frequency: 'daily', href: '/admin/growth-agents/lead-discovery' },
];

const HANNAH_DAILY: AgentDailyTask[] = [
  { id: 'links', label: 'Copy tracked guide link', description: 'UTM + QR for active campaign.', frequency: 'daily', href: '/admin/lead-acquisition' },
  { id: 'syndication', label: 'Approve syndication jobs', description: 'Draft/queued distribution before webhooks fire.', frequency: 'daily', href: '/admin/lead-acquisition' },
  { id: 'channel', label: 'Review channel performance', description: 'Which sources convert vs volume-only.', frequency: 'weekly', runKey: 'hannah_syndication_watcher' },
];

const ESTHER_DAILY: AgentDailyTask[] = [
  { id: 'focus', label: "Set this week's focus", description: 'Lane, city, pillar video, CTA path.', frequency: 'weekly', href: '/admin/growth-agents/marketing-director' },
  { id: 'strategy', label: 'Weekly strategy review', description: 'CRM trends → shift focus or nudge Caleb/Hannah.', frequency: 'weekly', runKey: 'esther_strategy_review' },
];

const ALEX_DAILY: AgentDailyTask[] = [
  { id: 'warm', label: 'Warm lead outreach', description: 'Self-book links for contacted CRM leads.', frequency: 'daily', runKey: 'alex_outreach' },
  { id: 'calendar', label: 'Confirm sessions', description: 'Calendar + meeting invites.', frequency: 'daily', href: '/admin/calendar' },
  { id: 'noshow', label: 'No-show recovery', description: 'Reschedule invites for missed sessions.', frequency: 'daily', runKey: 'alex_no_show_recovery' },
];

const MIRIAM_DAILY: AgentDailyTask[] = [
  { id: 'review_social', label: 'Review social drafts', description: 'Posts and clips waiting for publish.', frequency: 'daily', href: '/admin/marketing?tab=content' },
  { id: 'content_priority', label: 'Content priority review', description: 'Oldest waiting draft gets a publish task.', frequency: 'daily', runKey: 'miriam_content_priority_review' },
  { id: 'community', label: 'Community listen & draft', description: 'Scan forums, draft helpful replies ($0).', frequency: 'daily', href: '/admin/marketing?tab=start' },
  { id: 'shorts', label: 'Shorts pack from pillar', description: 'Hooks + captions with tracked links.', frequency: 'on_demand', runKey: 'shorts_pack' },
];

const JORDAN_DAILY: AgentDailyTask[] = [
  { id: 'pipeline', label: 'Video pipeline review', description: 'Stalled pillar lifecycle → next action.', frequency: 'daily', runKey: 'jordan_video_pipeline_review' },
  { id: 'promote', label: 'Promote pillar video', description: 'Content Studio publish/repurpose step.', frequency: 'daily', href: '/admin/marketing?tab=content&room=video' },
];

const LYDIA_DAILY: AgentDailyTask[] = [
  { id: 'seo', label: 'SEO health check', description: 'Public route title/meta/schema audit.', frequency: 'daily', runKey: 'lydia_seo_health_check' },
];

const BENJAMIN_DAILY: AgentDailyTask[] = [
  { id: 'partnership', label: 'Affiliate check-in', description: 'Stale or high-performing partner outreach.', frequency: 'daily', runKey: 'benjamin_partnership_review' },
  { id: 'affiliate', label: 'Affiliate toolkit', description: 'Program links and partner kit.', frequency: 'weekly', href: '/admin/lead-acquisition' },
];

const REBECCA_DAILY: AgentDailyTask[] = [
  { id: 'recruiting', label: 'Applicant follow-up', description: 'Open specialist applications before they go stale.', frequency: 'daily', runKey: 'rebecca_recruiting_review' },
];

const EZRA_DAILY: AgentDailyTask[] = [
  { id: 'brief', label: 'Brief Ruth', description: 'Handoff health + one decision today.', frequency: 'daily', runKey: 'agent_architect_brief' },
  { id: 'trail', label: 'Team trail', description: 'Cross-agent handoff feed.', frequency: 'daily', href: '/admin/growth-agents?view=trail' },
];

const DAILY_BY_AGENT: Record<string, AgentDailyTask[]> = {
  'lead-discovery': CALEB_DAILY,
  'capture-links': HANNAH_DAILY,
  'marketing-director': ESTHER_DAILY,
  'appointment-setter': ALEX_DAILY,
  social: MIRIAM_DAILY,
  media: JORDAN_DAILY,
  'seo-local': LYDIA_DAILY,
  partnerships: BENJAMIN_DAILY,
  'specialist-recruit': REBECCA_DAILY,
  'agent-architect': EZRA_DAILY,
};

export function listAgentDailyTasks(agentId: string, scope: 'daily' | 'all' = 'all'): AgentDailyTask[] {
  const tasks = DAILY_BY_AGENT[agentId] ?? [];
  if (scope === 'daily') return tasks.filter((t) => t.frequency === 'daily');
  return tasks;
}

export function listCalebWorkerDailyTasks(): AgentDailyTask[] {
  return [
    { id: 'geo', label: 'Geo Scanner', description: 'Rotate US metros for city-queue hunts.', frequency: 'daily' },
    { id: 'qualify', label: 'Qualifier', description: 'AI reasoning on mid-band hits.', frequency: 'daily' },
    { id: 'enrich', label: 'Enricher', description: 'Emails, phones, intent from Serper hits.', frequency: 'daily' },
    { id: 'handoff', label: 'Handoff Router', description: 'Route qualified leads to Alex or review.', frequency: 'daily' },
  ];
}

export function agentWorkroomHref(agent: GrowthAgentDef): string {
  return `/admin/growth-agents/${agent.id}`;
}
