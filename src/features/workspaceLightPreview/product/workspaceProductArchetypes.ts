/**
 * Workspace product archetypes decide BODY LAYOUT for each destination.
 *
 * Every page previously rendered through one generic scaffold, so destinations differed only by
 * copy and fixture data. The archetype picks how the page body is composed (focus hero, pipeline
 * lanes, ledger rows, etc.); the nav accent picks the lead colour family. Together they make each
 * of the 36 workspace destinations recognisable on sight without bespoke CSS per page.
 */
import { getWorkspaceProductNav } from './workspaceProductNav';
import type { WorkspaceProductAccent, WorkspaceProductRole } from './workspaceProductTokens';

export type WorkspaceProductArchetype =
  | 'command' // the two dashboards; bespoke, already built
  | 'focus' // one dominant hero object + a narrow supporting rail
  | 'pipeline' // staged lanes showing flow between states
  | 'journey' // sequenced steps on a connected spine
  | 'ledger' // dense scannable rows under a strong header
  | 'matrix' // comparison grid of peer items
  | 'feed'; // reverse-chronological stream

export type WorkspaceProductArchetypeMeta = {
  id: WorkspaceProductArchetype;
  label: string;
  /** One sentence on when to use this body layout. */
  intent: string;
  /** Short description of the desktop body composition. */
  desktopLayout: string;
  /**
   * How the archetype stays visually distinct at 375px — all six non-command layouts collapse to
   * one column on mobile, so each needs an explicit signature rather than a generic stack.
   */
  mobileSignature: string;
  /** Exactly two page regions that render on the dark glass bed. */
  darkMoments: [string, string];
};

export type WorkspaceProductArchetypeAssignment = {
  pageId: string;
  archetype: WorkspaceProductArchetype;
  accent: WorkspaceProductAccent;
};

const ARCHETYPE_META: Record<WorkspaceProductArchetype, WorkspaceProductArchetypeMeta> = {
  command: {
    id: 'command',
    label: 'Command center',
    intent: 'Use for role-specific dashboards where KPIs, alerts, and module launchers need a bespoke layout.',
    desktopLayout: 'Bespoke KPI grid, alert rail, and module shelf arranged per role — not a reusable scaffold.',
    mobileSignature: 'Bespoke, unchanged — preserves the built dashboard rhythm without collapsing into a generic shell.',
    darkMoments: ['command strip', 'module shelf'],
  },
  focus: {
    id: 'focus',
    label: 'Focus',
    intent: 'Use when one primary object deserves full attention with a narrow rail for actions and context.',
    desktopLayout: 'Wide hero panel with a narrow side rail for metadata, actions, and secondary tools.',
    mobileSignature: 'Hero object stays full-bleed and dominant; rail becomes a horizontal scroll strip beneath it.',
    darkMoments: ['hero object', 'action rail'],
  },
  pipeline: {
    id: 'pipeline',
    label: 'Pipeline',
    intent: 'Use when work moves through ordered stages that partners scan left-to-right.',
    desktopLayout: 'Horizontal lanes — one column per stage — with cards flowing between states.',
    mobileSignature: 'Lanes become horizontally swipeable columns with a stage indicator, not stacked.',
    darkMoments: ['stage headers', 'lane footer'],
  },
  journey: {
    id: 'journey',
    label: 'Journey',
    intent: 'Use when progress is best understood as numbered steps along a connected path.',
    desktopLayout: 'Connected spine with step nodes and expandable detail panels along the route.',
    mobileSignature: 'Vertical spine with connector line and numbered markers down the left edge.',
    darkMoments: ['spine markers', 'active step panel'],
  },
  ledger: {
    id: 'ledger',
    label: 'Ledger',
    intent: 'Use when partners need to scan many homogeneous records quickly without card overhead.',
    desktopLayout: 'Strong header band plus dense row table with inline status chips and row actions.',
    mobileSignature: 'Stays dense rows; reduces to two columns of data per row, never becomes cards.',
    darkMoments: ['page header', 'row action bar'],
  },
  matrix: {
    id: 'matrix',
    label: 'Matrix',
    intent: 'Use when partners compare attributes across peer items side by side.',
    desktopLayout: 'Attribute rows crossing item columns with sticky headers on both axes.',
    mobileSignature: 'Becomes a swipeable peer-comparison deck with a sticky attribute column.',
    darkMoments: ['attribute header', 'comparison bed'],
  },
  feed: {
    id: 'feed',
    label: 'Feed',
    intent: 'Use when the newest activity or messages should lead and scroll backward in time.',
    desktopLayout: 'Full-width chronological stream with composer or filter controls pinned above.',
    mobileSignature: 'Stays chronological, full-width, with date dividers.',
    darkMoments: ['composer bar', 'pinned announcement'],
  },
};

const PARTNER_ARCHETYPE_BY_PAGE: Record<string, WorkspaceProductArchetype> = {
  dashboard: 'command',
  messages: 'feed',
  documents: 'matrix',
  projects: 'pipeline',
  'my-tasks': 'ledger',
  work: 'feed',
  calendar: 'journey',
  notifications: 'feed',
  billing: 'matrix',
  account: 'focus',
  checklist: 'journey',
  reports: 'focus',
  disputes: 'pipeline',
  letters: 'focus',
  identity: 'pipeline',
  templates: 'matrix',
  build: 'journey',
  courses: 'matrix',
  education: 'focus',
  business: 'focus',
  'business-profile': 'matrix',
  'business-vendors': 'journey',
  'business-bureaus': 'matrix',
  'business-disputes': 'pipeline',
  'business-documents': 'ledger',
  'billion-path': 'journey',
  tradelines: 'focus',
  'au-marketplace': 'matrix',
  'au-orders': 'ledger',
  readiness: 'focus',
  'lender-logic': 'matrix',
  debt: 'pipeline',
  bankruptcy: 'journey',
  escalations: 'ledger',
  'specialist-hub': 'journey',
  'affiliate-hub': 'matrix',
  'agency-hub': 'pipeline',
  'case-help-hub': 'focus',
  'real-estate-hub': 'matrix',
  'hos-hub': 'journey',
};

const ADMIN_ARCHETYPE_BY_PAGE: Record<string, WorkspaceProductArchetype> = {
  dashboard: 'command',
  partners: 'ledger',
  workflow: 'pipeline',
  crm: 'matrix',
  marketing: 'feed',
  staff: 'matrix',
  communications: 'feed',
  cases: 'pipeline',
  mail: 'ledger',
  resources: 'matrix',
  analytics: 'focus',
  settings: 'ledger',
  'hos-program': 'journey',
  'role-preview': 'matrix',
};

function getArchetypeMap(role: WorkspaceProductRole): Record<string, WorkspaceProductArchetype> {
  return role === 'admin' ? ADMIN_ARCHETYPE_BY_PAGE : PARTNER_ARCHETYPE_BY_PAGE;
}

export function getWorkspaceProductArchetype(
  role: WorkspaceProductRole,
  pageId: string,
): WorkspaceProductArchetype {
  return getArchetypeMap(role)[pageId] ?? 'ledger';
}

export function getArchetypeMeta(archetype: WorkspaceProductArchetype): WorkspaceProductArchetypeMeta {
  return ARCHETYPE_META[archetype];
}

export function listArchetypeAssignments(role: WorkspaceProductRole): WorkspaceProductArchetypeAssignment[] {
  const archetypes = getArchetypeMap(role);
  return getWorkspaceProductNav(role).map((item) => ({
    pageId: item.id,
    archetype: archetypes[item.id] ?? 'ledger',
    accent: item.accent,
  }));
}

export function assertNoAdjacentRepeats(role: WorkspaceProductRole): { ok: boolean; problems: string[] } {
  const assignments = listArchetypeAssignments(role);
  const problems: string[] = [];

  for (let index = 1; index < assignments.length; index += 1) {
    const previous = assignments[index - 1];
    const current = assignments[index];

    if (previous.accent === current.accent) {
      problems.push(
        `Adjacent accent "${current.accent}" at "${previous.pageId}" → "${current.pageId}"`,
      );
    }

    if (previous.archetype === current.archetype) {
      problems.push(
        `Adjacent archetype "${current.archetype}" at "${previous.pageId}" → "${current.pageId}"`,
      );
    }
  }

  return { ok: problems.length === 0, problems };
}
