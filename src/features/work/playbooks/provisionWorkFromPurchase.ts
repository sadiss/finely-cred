import { getPackageById } from '../../../config/pricingCatalog';
import { listProjectsByPartner } from '../../../data/projectsRepo';
import { instantiateServiceBundle } from './instantiateServiceBundle';
import type { Project } from '../../../domain/projects';
import type { TaskItem } from '../../../domain/tasks';

export function provisionWorkFromPurchase(args: {
  partnerId: string;
  packageId: string;
}): { project: Project; tasks: TaskItem[]; bundleId: string } | { skipped: true; project: Project } | null {
  const pkg = getPackageById(args.packageId);
  if (!pkg) return null;

  const existing = listProjectsByPartner(args.partnerId).find(
    (p) => p.tags?.includes(args.packageId) || p.tags?.includes(pkg.id),
  );
  if (existing) {
    return { skipped: true, project: existing };
  }

  const result = instantiateServiceBundle({ partnerId: args.partnerId, packageId: args.packageId });
  return result;
}
