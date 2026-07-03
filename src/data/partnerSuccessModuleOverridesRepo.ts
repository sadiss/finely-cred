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

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getPartnerSuccessModuleOverride(moduleId: string) {
  return load().overrides[moduleId];
}

export function savePartnerSuccessModuleOverride(
  moduleId: string,
  patch: Partial<Pick<PartnerSuccessModule, 'title' | 'description' | 'hubPath' | 'trainingLessonId'>>,
) {
  const store = load();
  store.overrides[moduleId] = { ...(store.overrides[moduleId] ?? {}), ...patch };
  save(store);
}

export function listEffectivePartnerSuccessModules(): PartnerSuccessModule[] {
  const overrides = load().overrides;
  return PARTNER_SUCCESS_MODULES.map((m) => ({
    ...m,
    ...(overrides[m.id] ?? {}),
  }));
}
