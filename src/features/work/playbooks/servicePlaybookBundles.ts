import { allPackages, getPackageById, type PricingPackage } from '../../../config/pricingCatalog';
import type { ServicePlaybookBundle } from '../../../domain/taskPlaybooks';
import type { WorkScope } from '../../../domain/projects';
import { ALL_TASK_PLAYBOOKS, buildAllTaskPlaybooks } from './playbookSeed';
import { playbookMatchesPackage } from '../../../domain/taskPlaybooks';

function scopeForPackage(pkg: PricingPackage): WorkScope {
  if (pkg.category === 'business_credit' || pkg.id.includes('business') || pkg.id.includes('biz')) return 'business';
  return 'personal';
}

function selectPlaybookIdsForPackage(pkg: PricingPackage): string[] {
  const coreIds = ALL_TASK_PLAYBOOKS.filter(
    (pb) =>
      pb.packageIds?.includes(pkg.id) ||
      (pb.categories.includes(pkg.category) && !pb.packageIds?.length && pb.delivery === 'any'),
  )
    .slice(0, 8)
    .map((pb) => pb.id);

  const deliverySpecific = ALL_TASK_PLAYBOOKS.filter((pb) => playbookMatchesPackage(pb, pkg.id, pkg.category, pkg.delivery))
    .slice(0, 12)
    .map((pb) => pb.id);

  const kickoff = ALL_TASK_PLAYBOOKS.find((pb) => pb.packageIds?.includes(pkg.id) && pb.slug.endsWith('_kickoff'));
  const ids = new Set<string>();
  if (kickoff) ids.add(kickoff.id);
  for (const id of coreIds) ids.add(id);
  for (const id of deliverySpecific) ids.add(id);

  if (ids.size < 6) {
    for (const pb of ALL_TASK_PLAYBOOKS.filter((p) => p.categories.includes(pkg.category)).slice(0, 10)) {
      ids.add(pb.id);
    }
  }
  return Array.from(ids);
}

export function buildServicePlaybookBundles(): ServicePlaybookBundle[] {
  return allPackages.map((pkg) => ({
    id: `spb_${pkg.id}`,
    packageId: pkg.id,
    name: `${pkg.name} delivery`,
    delivery: pkg.delivery,
    scope: scopeForPackage(pkg),
    playbookIds: selectPlaybookIdsForPackage(pkg),
    projectTitleTemplate: `${pkg.name} — ${pkg.delivery}`,
    projectTags: [pkg.category, pkg.delivery.toLowerCase(), pkg.id],
    projectStage: 'intake',
  }));
}

export const ALL_SERVICE_PLAYBOOK_BUNDLES = buildServicePlaybookBundles();

export function getServiceBundleByPackageId(packageId: string): ServicePlaybookBundle | null {
  return ALL_SERVICE_PLAYBOOK_BUNDLES.find((b) => b.packageId === packageId) ?? null;
}

export function getPlaybooksForBundle(bundleId: string) {
  const bundle = ALL_SERVICE_PLAYBOOK_BUNDLES.find((b) => b.id === bundleId);
  if (!bundle) return [];
  const playbooks = buildAllTaskPlaybooks();
  const byId = new Map(playbooks.map((p) => [p.id, p]));
  return bundle.playbookIds.map((id) => byId.get(id)).filter(Boolean);
}

export function getPlaybookById(id: string) {
  return ALL_TASK_PLAYBOOKS.find((p) => p.id === id) ?? null;
}

export function describeServiceBundle(packageId: string): {
  bundle: ServicePlaybookBundle;
  playbooks: { id: string; title: string; kind: string }[];
  taskCount: number;
} | null {
  const bundle = getServiceBundleByPackageId(packageId);
  if (!bundle) return null;
  const playbooks = bundle.playbookIds
    .map((id) => getPlaybookById(id))
    .filter(Boolean)
    .map((pb) => ({ id: pb!.id, title: pb!.title, kind: pb!.kind }));
  return { bundle, playbooks, taskCount: playbooks.length };
}
