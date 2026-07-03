import { loadJson, saveJson } from '../../data/localJsonStore';
import type { StaffCommandEvent, StaffCommandSettings, StaffCommandStore, StaffMissionPlan } from './types';
import { GEO_CLUSTERS, STAFF_DEPARTMENTS } from './staffDirectory';
import { findStaff, isStaffMemberHydrated } from './staffRoster';

const KEY = 'finely.staff.command.center.v1';

const defaultSettings: StaffCommandSettings = {
  defaultView: 'floor',
  maxSelectableStaff: 3,
  showFutureHumanStaff: true,
  activeDepartmentIds: STAFF_DEPARTMENTS.map((d) => d.id),
  activeGeoClusterIds: GEO_CLUSTERS.slice(0, 5).map((g) => g.id),
  autonomyLabel: 'approval_required_external',
};

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hydrateStaffMission(plan: StaffMissionPlan): StaffMissionPlan | null {
  const leadId = plan.leadOwner?.id;
  if (!leadId) return null;
  const leadOwner = findStaff(leadId);
  if (!isStaffMemberHydrated(leadOwner)) return null;
  const supportStaff = (Array.isArray(plan.supportStaff) ? plan.supportStaff : [])
    .map((s) => findStaff(s?.id ?? ''))
    .filter(isStaffMemberHydrated);
  return { ...plan, leadOwner, supportStaff };
}

function normalizeStaffCommandStore(store: StaffCommandStore): StaffCommandStore {
  const missions = store.missions.map(hydrateStaffMission).filter((m): m is StaffMissionPlan => Boolean(m));
  const selectedStaffIds = store.selectedStaffIds.filter((id) => findStaff(id));
  return {
    ...store,
    missions,
    selectedStaffIds: selectedStaffIds.length ? selectedStaffIds : ['professor_apex', 'cmo_prime', 'scout_supreme'],
  };
}

export function loadStaffCommandStore(): StaffCommandStore {
  const raw = loadJson<StaffCommandStore>(KEY, { settings: defaultSettings, selectedStaffIds: ['professor_apex', 'cmo_prime', 'scout_supreme'], missions: [], events: [] }, 1);
  return normalizeStaffCommandStore(raw);
}

export function saveStaffCommandStore(store: StaffCommandStore): StaffCommandStore {
  saveJson(KEY, store, 1);
  return store;
}

export function updateStaffCommandSettings(patch: Partial<StaffCommandSettings>) {
  const store = loadStaffCommandStore();
  store.settings = { ...store.settings, ...patch };
  return saveStaffCommandStore(store).settings;
}

export function setSelectedStaff(ids: string[]) {
  const store = loadStaffCommandStore();
  store.selectedStaffIds = ids.slice(0, Math.max(1, store.settings.maxSelectableStaff));
  addStaffEvent({ summary: `Selected staff: ${store.selectedStaffIds.join(', ')}`, severity: 'info' }, store);
  return saveStaffCommandStore(store).selectedStaffIds;
}

export function addStaffEvent(input: Omit<StaffCommandEvent, 'id' | 'createdAt'>, existing?: StaffCommandStore): StaffCommandEvent {
  const store = existing ?? loadStaffCommandStore();
  const event: StaffCommandEvent = { id: newId('sce'), createdAt: nowIso(), ...input };
  store.events = [event, ...store.events].slice(0, 240);
  if (!existing) saveStaffCommandStore(store);
  return event;
}

export function addStaffMission(plan: StaffMissionPlan): StaffMissionPlan {
  const store = loadStaffCommandStore();
  const severity: StaffCommandEvent['severity'] = plan.request.riskLevel === 'blocked' ? 'blocked' : plan.request.approvalRequired ? 'warning' : 'success';
  store.missions = [plan, ...store.missions].slice(0, 80);
  store.selectedStaffIds = [plan.leadOwner.id, ...plan.supportStaff.map((s) => s.id)].slice(0, store.settings.maxSelectableStaff);
  store.events = [
    {
      id: newId('sce'),
      createdAt: nowIso(),
      staffId: plan.leadOwner.id,
      departmentId: plan.leadOwner.departmentId,
      missionType: plan.request.missionType,
      summary: `Mission created: ${plan.request.title}`,
      severity,
    },
    ...store.events,
  ].slice(0, 240);
  return saveStaffCommandStore(store).missions[0];
}

export function resetStaffCommandDemo() {
  saveStaffCommandStore({ settings: defaultSettings, selectedStaffIds: ['professor_apex', 'cmo_prime', 'scout_supreme'], missions: [], events: [] });
}
