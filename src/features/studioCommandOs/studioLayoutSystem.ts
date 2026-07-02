import type { StudioLayoutRemedy, StudioUxKpi, StudioUxSurface } from './types';

export const STUDIO_SURFACE_LABELS: Record<StudioUxSurface, string> = {
  media_studio: 'Media Studio',
  comms_studio: 'Communication Hub',
  automation_studio: 'Automation Studio',
  lead_intel: 'Lead Intel',
  phone_hub: 'Phone Hub',
  leads_crm: 'Leads + CRM',
  global_admin: 'Global Admin',
};

export const SITE_WIDE_LAYOUT_REMEDIES: StudioLayoutRemedy[] = [
  {
    id: 'media-gemini-wide',
    surface: 'media_studio',
    problem: 'side_by_side_cramped',
    title: 'Replace narrow side rail with full-width command canvas',
    before: 'Projects, options, and scene settings compete in a two-column layout that feels cramped.',
    after: 'A wide prompt-first video command, KPI row, project deck, storyboard canvas, and export lane.',
    action: 'Use MediaStudioPremiumPage and GeminiStyleVideoCommand as the default /admin/media-studio experience.',
    priority: 'critical',
  },
  {
    id: 'media-real-prompt',
    surface: 'media_studio',
    problem: 'weak_primary_action',
    title: 'Gemini-style prompt-to-video workflow',
    before: 'Admin has to understand scenes before making anything useful.',
    after: 'Admin types “make a 28-second commercial for business credit in Dallas” and gets a complete storyboard, voiceover, image prompts, captions, and render plan.',
    action: 'Make Create 28-sec Video the primary button; keep scene builder as power-user controls.',
    priority: 'critical',
  },
  {
    id: 'comms-deck-library',
    surface: 'comms_studio',
    problem: 'side_by_side_cramped',
    title: 'Communication templates become a command deck',
    before: 'Template list on one side, editor on the other; long list grows forever.',
    after: 'KPI cards, channel filters, campaign groups, paged template cards, preview drawer style sections.',
    action: 'Use CommsStudioPremiumPage replacement.',
    priority: 'critical',
  },
  {
    id: 'automation-ghl-blueprints',
    surface: 'automation_studio',
    problem: 'long_list_fatigue',
    title: 'Automation Studio becomes blueprint gallery + stable grid',
    before: 'Template library is a long vertical list and the grid moves when touched.',
    after: 'Choose a nurture scenario, open a stable automation grid, lock pan by default, and only move when clicking grab/edit controls.',
    action: 'Use AutomationStudioPremiumPage with AutomationCommandGrid.',
    priority: 'critical',
  },
  {
    id: 'leads-trash-controls',
    surface: 'leads_crm',
    problem: 'no_trash_flow',
    title: 'Lead cards get trash, restore, and visible stage controls',
    before: 'Leads can be staged but not deleted or moved to a visible trash system from the card workflow.',
    after: 'Lead card actions include Trash, Restore, Disqualify, Convert, Stage, Note, and owner routing.',
    action: 'Use LeadTrashPanel and leadTrashRepo; optional patch adds trash controls to AdminLeadsPage.',
    priority: 'high',
  },
  {
    id: 'global-long-list-buster',
    surface: 'global_admin',
    problem: 'long_list_fatigue',
    title: 'Site-wide long list replacement system',
    before: 'Admin pages become long stacked lists requiring endless scroll.',
    after: 'Replace long lists with KPI rows, horizontal decks, paginated sections, search/filter pills, and detail drawers.',
    action: 'Use StudioActionDeck, StudioKpiCards, and page-specific command panels.',
    priority: 'high',
  },
];

export function buildSurfaceKpis(surface: StudioUxSurface): StudioUxKpi[] {
  const remedies = SITE_WIDE_LAYOUT_REMEDIES.filter((r) => r.surface === surface || r.surface === 'global_admin');
  const critical = remedies.filter((r) => r.priority === 'critical').length;
  return [
    { label: 'UX risks fixed', value: remedies.length, hint: 'Layout problems addressed', tone: 'amber' },
    { label: 'Critical upgrades', value: critical, hint: 'Must ship first', tone: critical ? 'rose' : 'emerald' },
    { label: 'Primary action', value: '1 clear CTA', hint: 'No more “what do I click?”', tone: 'sky' },
    { label: 'Scroll burden', value: 'Reduced', hint: 'Decks + paged cards', tone: 'violet' },
  ];
}

export const LONG_LIST_REPLACEMENT_RULES = [
  'Never show more than 8 dense records in one vertical stack without pagination, grouping, or a deck view.',
  'Every admin page should start with 3–5 KPI cards and one obvious primary action.',
  'Template libraries should open as categories, scenario cards, and preview drawers, not giant walls of text.',
  'Automation canvases should have locked pan by default. Dragging requires a visible grab handle or edit mode toggle.',
  'Project galleries should use cards, carousels, and detail panels — not narrow side-by-side settings rails.',
  'Every destructive action needs trash/restore where practical; delete is a second-step confirmation.',
];

export const PRIMARY_ADMIN_ACTIONS = [
  { surface: 'media_studio', action: 'Generate video from prompt', owner: 'Content Director + Goldframe', output: '28-sec storyboard + scene visuals + render plan' },
  { surface: 'comms_studio', action: 'Build campaign from scenario', owner: 'Liora Lifecycle + CMO Prime', output: 'Email/SMS/portal draft deck' },
  { surface: 'automation_studio', action: 'Install automation blueprint', owner: 'Switchboard + Velvet Hammer', output: 'Draft automation rule set with approval gates' },
  { surface: 'lead_intel', action: 'Start swarm mission', owner: 'Scout Supreme + Pipeline Titan', output: 'Action-center candidates with short links' },
  { surface: 'leads_crm', action: 'Triage pipeline', owner: 'Revenue Captain + Appointment Architect', output: 'Stage, convert, trash, restore, follow-up' },
] as const;
