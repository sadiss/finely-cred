/**
 * Marketing Pipeline master project — all Desk Book/Offer/Review/Nurture tasks attach here.
 * Idempotent: one active project per browser profile; never duplicates on approve storms.
 */
import type { Project } from '../../domain/projects';
import { createProject, listProjectsByPartner, upsertProject } from '../../data/projectsRepo';

export const MARKETING_PIPELINE_PARTNER_ID = 'admin_growth';
export const MARKETING_PIPELINE_TAG = 'marketing-pipeline';
export const MARKETING_DESK_TAG = 'marketing-desk';

let cachedPipelineId: string | null = null;

function isPipelineProject(p: Project): boolean {
  return (
    p.status === 'active' &&
    ((p.tags ?? []).includes(MARKETING_PIPELINE_TAG) ||
      (p.tags ?? []).includes(MARKETING_DESK_TAG) ||
      p.title.trim().toLowerCase() === 'marketing pipeline')
  );
}

export function ensureMarketingPipelineProject(): Project {
  if (cachedPipelineId) {
    const hit = listProjectsByPartner(MARKETING_PIPELINE_PARTNER_ID).find((p) => p.id === cachedPipelineId);
    if (hit && hit.status === 'active') return hit;
    cachedPipelineId = null;
  }

  const existing = listProjectsByPartner(MARKETING_PIPELINE_PARTNER_ID).find(isPipelineProject);
  if (existing) {
    const tags = Array.from(
      new Set([...(existing.tags ?? []), MARKETING_PIPELINE_TAG, MARKETING_DESK_TAG, 'growth']),
    );
    const needsTagPatch =
      !(existing.tags ?? []).includes(MARKETING_PIPELINE_TAG) ||
      !(existing.tags ?? []).includes(MARKETING_DESK_TAG);
    const project = needsTagPatch ? upsertProject({ ...existing, tags }) : existing;
    cachedPipelineId = project.id;
    return project;
  }

  const created = createProject({
    partnerId: MARKETING_PIPELINE_PARTNER_ID,
    title: 'Marketing Pipeline',
    scope: 'personal',
    status: 'active',
    stage: 'funding',
    visibility: 'admin',
    description: 'Master project for Marketing Desk Find · Board · Book · Offer · Nurture work.',
    tags: [MARKETING_PIPELINE_TAG, MARKETING_DESK_TAG, 'growth'],
    priority: 'high',
  });
  cachedPipelineId = created.id;
  return created;
}

export function getMarketingPipelineProjectId(): string {
  return ensureMarketingPipelineProject().id;
}
