import { loadJson, saveJson } from '../../data/localJsonStore';
import type { StaffPersonality } from './types';

const KEY = 'finely.staff.roster.profiles.v1';

export type StaffProfileOverride = {
  firstName?: string;
  lastName?: string;
  title?: string;
  personality?: Partial<StaffPersonality>;
};

export type StaffProfileStore = {
  overrides: Record<string, StaffProfileOverride>;
};

export function loadStaffProfileStore(): StaffProfileStore {
  return loadJson<StaffProfileStore>(KEY, { overrides: {} }, 1);
}

export function saveStaffProfileStore(store: StaffProfileStore): StaffProfileStore {
  saveJson(KEY, store, 1);
  return store;
}

export function getStaffProfileOverride(staffId: string): StaffProfileOverride | undefined {
  return loadStaffProfileStore().overrides[staffId];
}

export function updateStaffProfileOverride(staffId: string, patch: StaffProfileOverride): StaffProfileOverride {
  const store = loadStaffProfileStore();
  const prev = store.overrides[staffId] ?? {};
  const personality = patch.personality
    ? { ...prev.personality, ...patch.personality }
    : prev.personality;
  store.overrides[staffId] = {
    ...prev,
    ...patch,
    personality: personality as StaffProfileOverride['personality'],
  };
  saveStaffProfileStore(store);
  return store.overrides[staffId];
}

export function resetStaffProfileOverrides() {
  saveStaffProfileStore({ overrides: {} });
}
