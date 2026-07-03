import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

export type TourClipJobStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type TourClipJob = {
  id: string;
  title: string;
  tourId?: string;
  assetId: string;
  blobRef: string;
  transcript?: string;
  status: TourClipJobStatus;
  createdAt: string;
  updatedAt?: string;
};

const KEY = 'finely.tourClipJobs.v1';

type Store = { jobs: TourClipJob[] };

function load(): Store {
  return loadJson(KEY, { jobs: [] }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listTourClipJobs(): TourClipJob[] {
  return load().jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function queueTourClipJob(args: {
  title: string;
  assetId: string;
  blobRef: string;
  tourId?: string;
  transcript?: string;
}): TourClipJob {
  const store = load();
  const job: TourClipJob = {
    id: newId('tclip'),
    title: args.title,
    tourId: args.tourId,
    assetId: args.assetId,
    blobRef: args.blobRef,
    transcript: args.transcript,
    status: 'queued',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.jobs.unshift(job);
  save(store);
  return job;
}

export function updateTourClipJobStatus(id: string, status: TourClipJobStatus): TourClipJob | null {
  const store = load();
  const idx = store.jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  store.jobs[idx] = { ...store.jobs[idx], status, updatedAt: new Date().toISOString() };
  save(store);
  return store.jobs[idx];
}

export function listTourClipJobsForTour(tourId: string): TourClipJob[] {
  return load().jobs.filter((j) => j.tourId === tourId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTourClipJobStats(): { total: number; queued: number; processing: number; ready: number; failed: number } {
  const jobs = load().jobs;
  return {
    total: jobs.length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    processing: jobs.filter((j) => j.status === 'processing').length,
    ready: jobs.filter((j) => j.status === 'ready').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };
}
