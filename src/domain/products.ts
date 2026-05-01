import type { TaskKind, TaskPriority, TaskStage } from './tasks';

export type BundleId = 'triple_tradeline_timed_v1' | 'business_fundability_sprint_v1';

export type BundleTemplate = {
  id: BundleId;
  title: string;
  priceHint?: string;
  description: string;
  timeline: Array<{
    title: string;
    kind: TaskKind;
    stage: TaskStage;
    priority?: TaskPriority;
    dueInDays: number;
    notes?: string;
    tags?: string[];
    dependsOnPrev?: boolean;
  }>;
};

export type BundleActivation = {
  id: string;
  partnerId: string;
  bundleId: BundleId;
  activatedAt: string;
  startAt: string;
  createdTaskIds: string[];
  status: 'active' | 'completed' | 'cancelled';
};

