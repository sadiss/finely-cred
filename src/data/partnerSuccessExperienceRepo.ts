import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.partnerSuccess.v1';

export type PartnerSuccessRecord = {
  moduleId: string;
  completedAt?: string;
  quizScore?: number;
  reviewRating?: number;
  reviewNote?: string;
  dismissedAt?: string;
};

type Store = {
  byPartner: Record<string, PartnerSuccessRecord[]>;
};

function load(): Store {
  return loadJson(KEY, { byPartner: {} }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listPartnerSuccessRecords(partnerId: string): PartnerSuccessRecord[] {
  return load().byPartner[partnerId] ?? [];
}

export function getPartnerSuccessRecord(partnerId: string, moduleId: string): PartnerSuccessRecord | undefined {
  return listPartnerSuccessRecords(partnerId).find((r) => r.moduleId === moduleId);
}

export function upsertPartnerSuccessRecord(partnerId: string, patch: PartnerSuccessRecord): PartnerSuccessRecord {
  const store = load();
  const list = [...(store.byPartner[partnerId] ?? [])];
  const idx = list.findIndex((r) => r.moduleId === patch.moduleId);
  const merged: PartnerSuccessRecord = {
    ...(idx >= 0 ? list[idx] : { moduleId: patch.moduleId }),
    ...patch,
  };
  if (patch.completedAt !== undefined) {
    merged.completedAt = patch.completedAt;
  } else if (!merged.completedAt && (patch.quizScore !== undefined && patch.quizScore >= 80 || patch.reviewRating !== undefined)) {
    merged.completedAt = new Date().toISOString();
  }
  if (idx >= 0) list[idx] = merged;
  else list.push(merged);
  store.byPartner[partnerId] = list;
  save(store);
  return merged;
}

export function dismissPartnerSuccessModule(partnerId: string, moduleId: string) {
  upsertPartnerSuccessRecord(partnerId, { moduleId, dismissedAt: new Date().toISOString() });
}
