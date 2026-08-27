import {
  getAdminServiceLine,
  getPartnerServiceLine,
  getWorkspaceProductNav,
  resolveWorkspaceProductPreviewPath,
  type WorkspaceProductNavItem,
} from '../workspaceProductNav';
import type { WorkspaceProductRole } from '../workspaceProductTokens';
import type { WorkspaceProductPageSpec } from './workspaceProductPageCatalog';

function derivePrimaryLabel(role: WorkspaceProductRole, navItem: WorkspaceProductNavItem): string {
  const id = navItem.id;
  const label = navItem.label.toLowerCase();

  const byId: Record<string, string> = {
    notifications: 'Open the item that needs you',
    'my-tasks': role === 'admin' ? 'Open your next task' : 'Open your most overdue task',
    projects: role === 'admin' ? 'Create work item' : 'Open your most overdue task',
    mail: 'Process the next mail item',
    workflow: 'Open the highest-risk queue item',
    partners: 'Open the highest-risk partner',
    analytics: 'Open partners missing reports',
    templates: 'Open Letter Studio',
    resources: 'Publish the next guide',
    settings: 'Review security settings',
    education: "Start today's recommended lesson",
    build: 'Open your build workspace',
    dashboard: role === 'partner' ? 'Take your next restore step' : 'Open the highest-risk signal',
    'billion-path': 'Upload your next missing document',
  };

  if (byId[id]) return byId[id];

  if (label.includes('notification')) return 'Open the item that needs you';
  if (label.includes('task')) return role === 'admin' ? 'Open your next task' : 'Open your most overdue task';
  if (label.includes('template')) return 'Open Letter Studio';
  if (label.includes('mail')) return 'Process the next mail item';
  if (label.includes('analytic')) return 'Open partners missing reports';

  return `Work in ${navItem.label}`;
}

function derivePlaceholder(navItem: WorkspaceProductNavItem): string {
  return `${navItem.description} A dedicated workstation for this destination is still being built — use the primary action above when you need to work with live records.`;
}

/**
 * Builds a real page for a navigation destination that has no hand-authored spec yet.
 *
 * Derived pages never pad the body with a sibling-link mosaic. They state the page purpose plainly,
 * expose one concrete primary action, and tuck related destinations into a small secondary strip.
 */
export function deriveWorkspaceProductPageSpec(
  role: WorkspaceProductRole,
  navItem: WorkspaceProductNavItem,
): WorkspaceProductPageSpec {
  const line =
    role === 'admin'
      ? getAdminServiceLine(navItem.service as Parameters<typeof getAdminServiceLine>[0])
      : getPartnerServiceLine(navItem.service as Parameters<typeof getPartnerServiceLine>[0]);

  const siblings = getWorkspaceProductNav(role)
    .filter((item) => item.service === navItem.service && item.id !== navItem.id)
    .slice(0, 4);

  return {
    role,
    id: navItem.id,
    eyebrow: line.label,
    title: navItem.description,
    description: derivePlaceholder(navItem),
    status: `${line.label} destination`,
    primaryLabel: derivePrimaryLabel(role, navItem),
    primaryActionPath: navItem.livePath,
    metricTitle: '',
    metricDescription: '',
    metrics: [],
    collectionTitle: 'Related pages',
    collectionDescription: `Other ${line.label.toLowerCase()} destinations — not the main work on this page.`,
    collectionView: 'rows',
    collectionIntelligence: 'Same order as the workspace menu.',
    items: siblings.map((item) => ({
      id: `${navItem.id}-sibling-${item.id}`,
      title: item.label,
      description: item.description,
      meta: line.label,
      status: 'ready' as const,
      actionKind: 'open' as const,
      target: resolveWorkspaceProductPreviewPath(role, item.path),
    })),
    guideTitle: `What ${navItem.label} is for`,
    guideDescription: navItem.description,
    guideSteps: [
      `Use ${navItem.label} for ${navItem.description.charAt(0).toLowerCase()}${navItem.description.slice(1)}`,
      'Ask Finely if you are unsure what belongs here.',
      'Use related pages only when you need a different tool in this line.',
    ],
    derivedPlaceholder: derivePlaceholder(navItem),
  };
}
