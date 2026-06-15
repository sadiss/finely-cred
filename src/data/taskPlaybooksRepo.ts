import { ALL_TASK_PLAYBOOKS, getPlaybookCount } from '../features/work/playbooks/playbookSeed';
import { ALL_SERVICE_PLAYBOOK_BUNDLES } from '../features/work/playbooks/servicePlaybookBundles';
import type { TaskPlaybook, ServicePlaybookBundle } from '../domain/taskPlaybooks';
import type { PricingCategory } from '../config/pricingCatalog';

export function listTaskPlaybooks(filters?: {
  q?: string;
  category?: PricingCategory;
  packageId?: string;
  delivery?: TaskPlaybook['delivery'];
}): TaskPlaybook[] {
  let rows = ALL_TASK_PLAYBOOKS.slice();
  if (filters?.category) rows = rows.filter((p) => p.categories.includes(filters.category!));
  if (filters?.packageId) rows = rows.filter((p) => !p.packageIds?.length || p.packageIds.includes(filters.packageId!));
  if (filters?.delivery) rows = rows.filter((p) => p.delivery === 'any' || p.delivery === filters.delivery);
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter((p) => p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.id.includes(q));
  }
  return rows.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getTaskPlaybook(id: string): TaskPlaybook | null {
  return ALL_TASK_PLAYBOOKS.find((p) => p.id === id) ?? null;
}

export function listServicePlaybookBundles(): ServicePlaybookBundle[] {
  return ALL_SERVICE_PLAYBOOK_BUNDLES.slice();
}

export function getTaskPlaybookStats() {
  return {
    playbookCount: getPlaybookCount(),
    bundleCount: ALL_SERVICE_PLAYBOOK_BUNDLES.length,
  };
}
