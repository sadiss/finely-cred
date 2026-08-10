import { loadJson, saveJson } from './localJsonStore';
import type { VideoCommandRecord, VideoCommandWorkflowStep } from '../domain/videoCommandRecord';
import { newId } from '../utils/ids';

const KEY = 'finely.videoCommandRecords.v1';
const VERSION = 1;

type Store = { records: VideoCommandRecord[] };

function nowIso() {
  return new Date().toISOString();
}

function load(): Store {
  return loadJson<Store>(KEY, { records: [] }, VERSION);
}

function save(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listVideoCommandRecords(): VideoCommandRecord[] {
  return load().records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getVideoCommandRecord(id: string): VideoCommandRecord | null {
  return load().records.find((r) => r.id === id) ?? null;
}

export function findVideoCommandRecordByUploadAnalysis(uploadAnalysisId: string): VideoCommandRecord | null {
  const key = (uploadAnalysisId || '').trim();
  if (!key) return null;
  return load().records.find((r) => r.uploadAnalysisId === key) ?? null;
}

export function createVideoCommandRecord(args: {
  title: string;
  uploadAnalysisId?: string;
  lifecycle?: VideoCommandWorkflowStep;
}): VideoCommandRecord {
  const store = load();
  const t = nowIso();
  const record: VideoCommandRecord = {
    id: newId('vcr'),
    title: args.title.trim() || 'Uploaded video',
    uploadAnalysisId: args.uploadAnalysisId,
    lifecycle: args.lifecycle ?? 'import',
    createdAt: t,
    updatedAt: t,
  };
  store.records.unshift(record);
  save(store);
  return record;
}

export function upsertVideoCommandRecord(
  id: string,
  patch: Partial<Omit<VideoCommandRecord, 'id' | 'createdAt'>>,
): VideoCommandRecord | null {
  const store = load();
  const idx = store.records.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: VideoCommandRecord = {
    ...store.records[idx]!,
    ...patch,
    updatedAt: nowIso(),
  };
  store.records[idx] = next;
  save(store);
  return next;
}

export function deleteVideoCommandRecord(id: string): void {
  const store = load();
  store.records = store.records.filter((r) => r.id !== id);
  save(store);
}
