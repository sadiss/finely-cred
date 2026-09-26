import { loadJson, saveJson } from './localJsonStore';
import type { PartnerSuccessModule } from '../domain/partnerSuccessExperience';
import { PARTNER_SUCCESS_MODULES } from '../domain/partnerSuccessExperience';

const KEY = 'finely.partnerSuccessOverrides.v1';

type Store = {
  overrides: Record<string, Partial<Pick<PartnerSuccessModule, 'title' | 'description' | 'hubPath' | 'trainingLessonId'>>>;
};

function load(): Store {
  return loadJson(KEY, { overrides: {} }, 1);
}

function save(store: Store): boolean {
  return saveJson(KEY, store, 1);
}

export function getPartnerSuccessModuleOverride(moduleId: string) {
  return load().overrides[moduleId];
}

export function savePartnerSuccessModuleOverride(
  moduleId: string,
  patch: Partial<Pick<PartnerSuccessModule, 'title' | 'description' | 'hubPath' | 'trainingLessonId'>>,
): boolean {
  const store = load();
  const next = { ...(store.overrides[moduleId] ?? {}), ...patch };
  const empty = !next.title && !next.description && !next.hubPath && !next.trainingLessonId;
  if (empty) delete store.overrides[moduleId];
  else store.overrides[moduleId] = next;
  return save(store);
}

export function clearPartnerSuccessModuleOverride(moduleId: string): boolean {
  const store = load();
  delete store.overrides[moduleId];
  return save(store);
}

export function listEffectivePartnerSuccessModules(): PartnerSuccessModule[] {
  const base = Array.isArray(PARTNER_SUCCESS_MODULES) ? PARTNER_SUCCESS_MODULES : [];
  const overrides = load().overrides;
  return base.map((m) => ({
    ...m,
    ...(overrides[m.id] ?? {}),
    lanes: Array.isArray(m.lanes) ? m.lanes : [],
  }));
}
