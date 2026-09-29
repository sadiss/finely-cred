import type { WorkspaceProductNavItem } from './workspaceProductNav';

export type AdminIaGroup = {
  id: string;
  label: string;
  defaultOpen: boolean;
  itemIds: readonly string[];
};

/**
 * Product-sidebar IA. Item ids match ADMIN_PRODUCT_NAV.
 * Anything not listed lands in More so routes stay reachable.
 */
export const ADMIN_IA_GROUPS: readonly AdminIaGroup[] = [
  { id: 'home', label: 'Home', defaultOpen: true, itemIds: ['dashboard', 'today'] },
  {
    id: 'clients',
    label: 'Clients & work',
    defaultOpen: false,
    itemIds: ['partners', 'crm', 'cases', 'workflow', 'projects', 'my-tasks', 'dispute-collaboration', 'mail', 'staff'],
  },
  {
    id: 'learn',
    label: 'Learn & train',
    defaultOpen: true,
    itemIds: ['courses', 'partner-success', 'tour-studio', 'resources', 'signup-ops', 'agent-staff', 'guide'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    defaultOpen: true,
    itemIds: ['marketing-desk', 'marketing', 'social-hub', 'playbooks', 'content-studio', 'lead-magnets', 'cmo', 'testimonials'],
  },
  {
    id: 'money',
    label: 'Money',
    defaultOpen: false,
    itemIds: ['billing', 'finance', 'products', 'vendors'],
  },
  {
    id: 'settings',
    label: 'Settings',
    defaultOpen: false,
    itemIds: ['settings', 'access', 'team'],
  },
];

export function buildAdminIa(items: WorkspaceProductNavItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const used = new Set<string>();
  const groups = ADMIN_IA_GROUPS.map((group) => {
    const groupItems = group.itemIds.flatMap((id) => {
      const item = byId.get(id);
      if (!item) return [];
      used.add(item.id);
      return [item];
    });
    return { ...group, items: groupItems };
  }).filter((group) => group.items.length > 0);
  const more = items.filter((item) => !used.has(item.id));
  return { groups, more };
}
