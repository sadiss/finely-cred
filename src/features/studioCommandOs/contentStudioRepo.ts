import { loadJson, saveJson } from '../../data/localJsonStore';
import type {
  ContentStudioAsset,
  ContentStudioIntake,
  ContentStudioJob,
  ContentStudioJobEvent,
  ContentStudioJobStatus,
  ContentStudioProviderKind,
} from './types';

const KEY = 'finely.content_studio_department.v1';
const VERSION = 1;

type Store = {
  jobs: ContentStudioJob[];
  assets: ContentStudioAsset[];
  selectedJobId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 8)}`;
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { jobs: [], assets: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

function event(label: string, detail: string): ContentStudioJobEvent {
  return { id: id('evt'), at: nowIso(), label, detail };
}

function providerPlanFor(intake: ContentStudioIntake): ContentStudioJob['providerPlan'] {
  const providers: Array<{ provider: ContentStudioProviderKind; purpose: string; status: 'planned' | 'queued' | 'complete' | 'blocked' }> = [
    { provider: 'ai_gateway', purpose: 'Research, script, offer positioning, compliance-safe copy', status: 'planned' },
  ];

  if (['video', 'course_lesson_video', 'tour_demo', 'testimonial_video', 'social_clip'].includes(intake.requestedAssetType)) {
    providers.push(
      { provider: 'voice_studio', purpose: 'Narration, timing map, voice style, dubbing-ready audio', status: 'planned' },
      { provider: 'openai_images', purpose: 'Scene visuals, thumbnails, posters, storyboard frames', status: 'planned' },
      { provider: 'ffmpeg', purpose: 'Final assembly, captions, render, poster extraction', status: 'planned' },
      { provider: 'runway', purpose: 'Optional cinematic B-roll/video generation adapter', status: 'blocked' },
      { provider: 'heygen', purpose: 'Optional avatar/explainer adapter', status: 'blocked' },
    );
  }

  if (['ebook', 'guide_pdf', 'campaign_bundle'].includes(intake.requestedAssetType)) {
    providers.push(
      { provider: 'canva', purpose: 'Optional brand-template design/autofill adapter', status: 'blocked' },
      { provider: 'manual', purpose: 'Finely internal PDF/doc renderer until external document API is connected', status: 'planned' },
    );
  }

  if (intake.sourceSurface === 'lead_magnet') {
    providers.push({ provider: 'manual', purpose: 'Attach approved asset to Lead Magnet Funnel media override', status: 'planned' });
  }

  return providers;
}

export function createContentStudioJob(intake: ContentStudioIntake): ContentStudioJob {
  const ts = nowIso();
  const titleSeed = intake.offer || intake.prompt.split(/[.!?]/)[0] || 'Content Studio job';
  const job: ContentStudioJob = {
    id: id('content_job'),
    createdAt: ts,
    updatedAt: ts,
    title: titleSeed.slice(0, 96),
    status: 'draft',
    ownerRole: 'content_director',
    intake,
    providerPlan: providerPlanFor(intake),
    assetIds: [],
    events: [event('Intake created', `Source: ${intake.sourceSurface}. Publish target: ${intake.publishTarget}.`)],
  };
  const store = loadStore();
  store.jobs = [job, ...store.jobs].slice(0, 200);
  store.selectedJobId = job.id;
  saveStore(store);
  return job;
}

export function listContentStudioJobs(): ContentStudioJob[] {
  return loadStore().jobs.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSelectedContentStudioJobId(): string | undefined {
  return loadStore().selectedJobId;
}

export function setSelectedContentStudioJobId(jobId: string | undefined) {
  const store = loadStore();
  store.selectedJobId = jobId;
  saveStore(store);
}

export function updateContentStudioJob(jobId: string, patch: Partial<ContentStudioJob>, eventDetail?: { label: string; detail: string }): ContentStudioJob | null {
  const store = loadStore();
  const idx = store.jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return null;
  const current = store.jobs[idx]!;
  const next: ContentStudioJob = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
    events: eventDetail ? [event(eventDetail.label, eventDetail.detail), ...current.events].slice(0, 50) : current.events,
  };
  store.jobs[idx] = next;
  saveStore(store);
  return next;
}

export function advanceContentStudioJob(jobId: string, status: ContentStudioJobStatus, detail: string): ContentStudioJob | null {
  return updateContentStudioJob(jobId, { status }, { label: `Status: ${status}`, detail });
}

export function listContentStudioAssets(): ContentStudioAsset[] {
  return loadStore().assets.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveContentStudioAsset(asset: Omit<ContentStudioAsset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ContentStudioAsset {
  const store = loadStore();
  const ts = nowIso();
  const existing = asset.id ? store.assets.find((a) => a.id === asset.id) : undefined;
  const next: ContentStudioAsset = {
    ...asset,
    id: asset.id || id('content_asset'),
    createdAt: existing?.createdAt || ts,
    updatedAt: ts,
  };
  store.assets = [next, ...store.assets.filter((a) => a.id !== next.id)].slice(0, 500);
  if (next.jobId) {
    store.jobs = store.jobs.map((j) =>
      j.id === next.jobId
        ? {
            ...j,
            updatedAt: ts,
            assetIds: Array.from(new Set([next.id, ...j.assetIds])),
            events: [event('Asset saved', `${next.assetType}: ${next.title}`), ...j.events].slice(0, 50),
          }
        : j,
    );
  }
  saveStore(store);
  return next;
}

export function updateContentStudioAsset(assetId: string, patch: Partial<Omit<ContentStudioAsset, 'id' | 'createdAt'>>): ContentStudioAsset | null {
  const store = loadStore();
  const idx = store.assets.findIndex((a) => a.id === assetId);
  if (idx < 0) return null;
  const current = store.assets[idx]!;
  const next: ContentStudioAsset = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
  };
  store.assets[idx] = next;
  if (next.jobId) {
    store.jobs = store.jobs.map((j) =>
      j.id === next.jobId
        ? {
            ...j,
            updatedAt: next.updatedAt,
            events: [event('Asset updated', `${next.title}: ${next.status}`), ...j.events].slice(0, 50),
          }
        : j,
    );
  }
  saveStore(store);
  return next;
}

export function clearContentStudioDemoData() {
  saveStore({ jobs: [], assets: [] });
}
