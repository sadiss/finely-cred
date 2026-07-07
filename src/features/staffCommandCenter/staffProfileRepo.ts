import { saveTenantState } from '../../data/tenantStateRepo';
import type { StaffPersonality } from './types';

const STATE_KEY = 'staff_profile_overrides';

export type StaffProfileOverride = {
  firstName?: string;
  lastName?: string;
  title?: string;
  personality?: Partial<StaffPersonality>;
};

export type StaffProfileStore = {
  overrides: Record<string, StaffProfileOverride>;
};

let memoryStore: StaffProfileStore | null = null;

export function seedStaffProfileStore(store: StaffProfileStore): StaffProfileStore {
  memoryStore = store;
  return store;
}

export function loadStaffProfileStore(): StaffProfileStore {
  return memoryStore ?? { overrides: {} };
}

export function saveStaffProfileStore(store: StaffProfileStore): StaffProfileStore {
  memoryStore = store;
  saveTenantState(STATE_KEY, store);
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
