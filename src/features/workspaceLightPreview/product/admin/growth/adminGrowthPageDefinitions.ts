import type { WorkspaceProductAccent } from '../../workspaceProductTokens';

export type AdminGrowthPageId =
  | 'crm-referrals'
  | 'crm-routing'
  | 'crm-sequences'
  | 'leads'
  | 'leads-os'
  | 'lead-acquisition'
  | 'lead-intel'
  | 'lead-magnets'
  | 'marketing-desk'
  | 'cmo'
  | 'growth-command'
  | 'growth-agents'
  | 'growth-automation'
  | 'funnel-experiments'
  | 'geo-war-room'
  | 'social-hub'
  | 'signup-ops'
  | 'testimonials';

export type AdminGrowthPageDefinition = {
  id: AdminGrowthPageId;
  title: string;
  purposeLine: string;
  primaryActionLabel: string;
  accent: WorkspaceProductAccent;
};

/** Section 8 — Batch 5a Growth page contract copy. */
export const ADMIN_GROWTH_PAGE_DEFINITIONS: Record<AdminGrowthPageId, AdminGrowthPageDefinition> = {
  'crm-referrals': {
    id: 'crm-referrals',
    title: 'Referrals',
    purposeLine: 'Who is sending you partners, and what they are owed.',
    primaryActionLabel: 'Pay the oldest unpaid referral',
    accent: 'emerald',
  },
  'crm-routing': {
    id: 'crm-routing',
    title: 'Lead routing',
    purposeLine: 'The rules that decide who owns an inbound lead.',
    primaryActionLabel: 'Add a routing rule',
    accent: 'violet',
  },
  'crm-sequences': {
    id: 'crm-sequences',
    title: 'Sequences',
    purposeLine: 'Automated follow-up that runs when nobody has time to chase.',
    primaryActionLabel: 'Create a sequence',
    accent: 'sky',
  },
  leads: {
    id: 'leads',
    title: 'Leads',
    purposeLine: 'Raw inbound leads, newest and unworked first.',
    primaryActionLabel: 'Work the oldest unworked lead',
    accent: 'rose',
  },
  'leads-os': {
    id: 'leads-os',
    title: 'Leads OS',
    purposeLine: 'Where leads come from, how good they are, and how fast they convert.',
    primaryActionLabel: 'Open your weakest source',
    accent: 'emerald',
  },
  'lead-acquisition': {
    id: 'lead-acquisition',
    title: 'Lead acquisition',
    purposeLine: 'What each channel costs and what it returns.',
    primaryActionLabel: 'Open your worst-performing channel',
    accent: 'violet',
  },
  'lead-intel': {
    id: 'lead-intel',
    title: 'Lead intel',
    purposeLine: 'Research on inbound prospects before you call them.',
    primaryActionLabel: 'Enrich the newest lead',
    accent: 'sky',
  },
  'lead-magnets': {
    id: 'lead-magnets',
    title: 'Lead magnets',
    purposeLine: 'The guides and funnels that capture new partners.',
    primaryActionLabel: 'Open your top-converting magnet',
    accent: 'emerald',
  },
  'marketing-desk': {
    id: 'marketing-desk',
    title: 'Marketing desk',
    purposeLine: "Today's campaign work, in order.",
    primaryActionLabel: 'Start the next scheduled task',
    accent: 'violet',
  },
  cmo: {
    id: 'cmo',
    title: 'Marketing Director',
    purposeLine: 'Positioning, spend, and pipeline at a strategy level.',
    primaryActionLabel: 'Open the biggest pipeline gap',
    accent: 'rose',
  },
  'growth-command': {
    id: 'growth-command',
    title: 'Growth command',
    purposeLine: "This week's growth targets and whether you are hitting them.",
    primaryActionLabel: 'Open the metric that is behind',
    accent: 'emerald',
  },
  'growth-agents': {
    id: 'growth-agents',
    title: 'Growth agents',
    purposeLine: 'Automated workers and what they are assigned to.',
    primaryActionLabel: 'Review the agent that is failing',
    accent: 'violet',
  },
  'growth-automation': {
    id: 'growth-automation',
    title: 'Growth automation',
    purposeLine: 'Triggered workflows across the partner lifecycle.',
    primaryActionLabel: 'Fix the workflow that is erroring',
    accent: 'sky',
  },
  'funnel-experiments': {
    id: 'funnel-experiments',
    title: 'Funnel experiments',
    purposeLine: 'Tests running against the signup funnel.',
    primaryActionLabel: 'Call the experiment that has a winner',
    accent: 'rose',
  },
  'geo-war-room': {
    id: 'geo-war-room',
    title: 'Geo war room',
    purposeLine: 'Performance market by market, and where to expand next.',
    primaryActionLabel: 'Open your weakest active market',
    accent: 'emerald',
  },
  'social-hub': {
    id: 'social-hub',
    title: 'Social hub',
    purposeLine: 'What is scheduled, what is published, and what is working.',
    primaryActionLabel: 'Approve the next scheduled post',
    accent: 'violet',
  },
  'signup-ops': {
    id: 'signup-ops',
    title: 'Signup ops',
    purposeLine: 'Where people drop out of registration.',
    primaryActionLabel: 'Open the step with the biggest drop-off',
    accent: 'sky',
  },
  testimonials: {
    id: 'testimonials',
    title: 'Testimonials',
    purposeLine: 'Partner wins, from submitted to published.',
    primaryActionLabel: 'Approve the oldest pending testimonial',
    accent: 'emerald',
  },
};

export const ADMIN_GROWTH_PAGE_IDS = Object.keys(ADMIN_GROWTH_PAGE_DEFINITIONS) as AdminGrowthPageId[];
