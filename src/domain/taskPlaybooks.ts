import type { PricingCategory } from '../config/pricingCatalog';
import type { TaskKind, TaskPriority, TaskStage, TaskVisibility, WorkScope } from './tasks';

export type PlaybookDelivery = 'DIY' | 'DFY' | 'HYBRID' | 'any';

export type TaskPlaybook = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  kind: TaskKind;
  stage: TaskStage;
  priority?: TaskPriority;
  delivery: PlaybookDelivery;
  scope?: WorkScope;
  categories: PricingCategory[];
  packageIds?: string[];
  dueDaysOffset?: number;
  dependsOnPlaybookId?: string;
  checklist?: string[];
  tags?: string[];
  partnerInstructions?: string;
  adminInstructions?: string;
  visibility?: TaskVisibility;
  assignedTo?: 'partner' | 'admin';
  sortOrder?: number;
};

export type ServicePlaybookBundle = {
  id: string;
  packageId: string;
  name: string;
  delivery: 'DIY' | 'DFY' | 'HYBRID';
  scope: WorkScope;
  playbookIds: string[];
  projectTitleTemplate: string;
  projectTags: string[];
  projectStage?: TaskStage;
};

export function playbookMatchesPackage(playbook: TaskPlaybook, packageId: string, category: PricingCategory, delivery: PlaybookDelivery): boolean {
  if (playbook.packageIds?.length && !playbook.packageIds.includes(packageId)) return false;
  if (playbook.categories.length && !playbook.categories.includes(category)) return false;
  if (playbook.delivery !== 'any' && playbook.delivery !== delivery) return false;
  return true;
}
