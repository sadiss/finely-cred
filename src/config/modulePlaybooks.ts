/** Module-by-module how-to inventory — Part A3 Launch OS. */
import { ADMIN_NAV_GROUPS } from './adminNavLanes';
import { PORTAL_NAV_LANES } from './portalNavLanes';

export type ModulePlaybook = {
  id: string;
  path: string;
  title: string;
  plainSummary: string;
  lane: 'admin' | 'portal' | 'public';
  sopId?: string;
  tourId?: string;
};

const PUBLIC_MODULES: ModulePlaybook[] = [
  {
    id: 'mod-start-here',
    path: '/start-here',
    title: 'Start Here',
    plainSummary: 'Pick one path: fix your credit, refer people, or staff login.',
    lane: 'public',
    sopId: 'sop-public-start-here',
    tourId: 'tour-home-overview',
  },
  {
    id: 'mod-resources',
    path: '/resources',
    title: 'Resources',
    plainSummary: 'Free guides, monitoring links, and how-to videos on one scroll page.',
    lane: 'public',
    sopId: 'sop-public-monitoring-links',
    tourId: 'tour-resources-monitoring',
  },
  {
    id: 'mod-help-center',
    path: '/help-center',
    title: 'Help center',
    plainSummary: 'Search plain-English playbooks and watch step-by-step tours.',
    lane: 'public',
    sopId: 'sop-public-help-center',
  },
  {
    id: 'mod-personal-credit',
    path: '/personal-credit',
    title: 'Personal credit',
    plainSummary: 'Learn how credit repair works before you sign up.',
    lane: 'public',
    sopId: 'sop-public-personal-credit',
    tourId: 'tour-personal-credit',
  },
  {
    id: 'mod-fundability',
    path: '/fundability-readiness',
    title: 'Fundability readiness',
    plainSummary: 'See if your profile is ready for business funding.',
    lane: 'public',
    sopId: 'sop-public-fundability',
    tourId: 'tour-fundability-readiness',
  },
  {
    id: 'mod-onboarding',
    path: '/onboarding',
    title: 'Sign up & monitoring',
    plainSummary: 'Create your account and connect a credit monitoring service.',
    lane: 'public',
    sopId: 'sop-onboarding-monitoring',
    tourId: 'tour-onboarding-start',
  },
];

const ADMIN_SOP_MAP: Record<string, { sopId?: string; tourId?: string }> = {
  '/admin/partners': { sopId: 'sop-admin-create-partner', tourId: 'tour-admin-partners' },
  '/admin/workflow': { sopId: 'sop-admin-workflow-triage', tourId: 'tour-admin-workflow' },
  '/admin/crm': { sopId: 'sop-admin-crm-pulse', tourId: 'tour-admin-workflow' },
  '/admin/tour-studio': { tourId: 'tour-home-overview' },
  '/admin/launch-os': { sopId: 'sop-public-help-center' },
};

function adminModules(): ModulePlaybook[] {
  return ADMIN_NAV_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      id: `mod-admin-${item.path.replace(/\//g, '-')}`,
      path: item.path,
      title: item.label,
      plainSummary: item.hint ?? `Open ${item.label} from the admin menu.`,
      lane: 'admin' as const,
      ...ADMIN_SOP_MAP[item.path],
    })),
  );
}

function portalModules(): ModulePlaybook[] {
  return PORTAL_NAV_LANES.flatMap((lane) =>
    lane.links.map((link) => {
      let sopId: string | undefined;
      let tourId: string | undefined;
      if (link.path.includes('/reports')) {
        sopId = 'sop-portal-upload-report';
        tourId = 'tour-portal-upload-report';
      } else if (link.path.includes('/disputes') || link.path.includes('/letters')) {
        sopId = 'sop-portal-dispute-letter';
        tourId = 'tour-portal-dispute-letter';
      } else if (link.path.includes('/billing')) {
        sopId = 'sop-portal-billing';
        tourId = 'tour-portal-billing';
      } else if (link.path.includes('/calendar')) {
        sopId = 'sop-portal-calendar';
        tourId = 'tour-portal-calendar';
      } else if (link.path.includes('/education') || link.path.includes('/courses')) {
        sopId = 'sop-portal-education';
        tourId = 'tour-portal-education';
      } else if (link.path.includes('/messages')) {
        sopId = 'sop-portal-messages';
        tourId = 'tour-portal-messages';
      } else if (link.path.includes('/tasks')) {
        sopId = 'sop-portal-tasks';
        tourId = 'tour-portal-my-tasks';
      }
      return {
        id: `mod-portal-${link.path.replace(/\//g, '-')}`,
        path: link.path,
        title: link.label,
        plainSummary: `${lane.label}: ${lane.hint}`,
        lane: 'portal' as const,
        sopId,
        tourId,
      };
    }),
  );
}

export const MODULE_PLAYBOOKS: ModulePlaybook[] = [...PUBLIC_MODULES, ...portalModules(), ...adminModules()];

export function listModulePlaybooksByLane(lane: ModulePlaybook['lane'] | 'all'): ModulePlaybook[] {
  if (lane === 'all') return MODULE_PLAYBOOKS;
  return MODULE_PLAYBOOKS.filter((m) => m.lane === lane);
}

export function getModulePlaybookForPath(pathname: string): ModulePlaybook | null {
  const path = pathname.split('?')[0] ?? pathname;
  const hits = MODULE_PLAYBOOKS.filter((m) => path === m.path || path.startsWith(`${m.path}/`));
  if (!hits.length) return null;
  return hits.sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}
