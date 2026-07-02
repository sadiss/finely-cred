import { loadJson, saveJson } from '../../data/localJsonStore';
import type { HumanStaffAgentId, HumanStaffMemory, HumanStaffMissionPlan, HumanStaffNotification, HumanStaffStore, HumanStaffThread } from './types';

const STORE_KEY = 'finelycred.humanStaffOs.v1';

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

const defaultStore: HumanStaffStore = {
  threads: [],
  notifications: [],
  missions: [],
  memories: [],
  lastResponseHashes: {},
  selectedAgentIds: ['professor_apex', 'pipeline_titan', 'cmo_prime'],
};

export function loadHumanStaffStore(): HumanStaffStore {
  return loadJson<HumanStaffStore>(STORE_KEY, defaultStore, 1);
}

export function saveHumanStaffStore(store: HumanStaffStore): HumanStaffStore {
  const clean: HumanStaffStore = {
    ...store,
    threads: store.threads.slice(0, 80),
    notifications: store.notifications.slice(0, 240),
    missions: store.missions.slice(0, 80),
    memories: store.memories.slice(0, 400),
  };
  saveJson(STORE_KEY, clean, 1);
  return clean;
}

export function resetHumanStaffDemo(): HumanStaffStore {
  const store: HumanStaffStore = {
    ...defaultStore,
    threads: [
      {
        id: newId('thread'),
        createdAt: nowIso(),
        updatedAt: nowIso(),
        title: 'Deep Swarm ownership reset',
        missionType: 'deep_swarm',
        status: 'open',
        cityIds: ['dallas', 'houston'],
        assignedAgentIds: ['pipeline_titan', 'scout_supreme', 'switchboard'],
        summary: 'Clarify that Start Swarm is a system process owned by Lead Intel staff and Automation Ops.',
        nextAction: 'Build action-ready lead cards with owner, message, short link, and nurture handoff.',
        memory: ['User wants the staff hierarchy to feel real and easy to understand.', 'User prefers direct answers and visible ownership.'],
        messages: [
          {
            id: newId('msg'),
            createdAt: nowIso(),
            fromAgentId: 'pipeline_titan',
            toAgentIds: ['scout_supreme', 'switchboard'],
            body: 'I own the lead outcome. Scout owns discovery depth. Switchboard owns whether the queue is actually moving. We should show that directly on the page.',
            tone: 'direct',
            priority: 'high',
            tags: ['deep-swarm', 'ownership'],
            suggestedActions: ['Open Action Center', 'Check queue health', 'Review hot leads'],
          },
        ],
      },
    ],
    notifications: [
      {
        id: newId('note'),
        createdAt: nowIso(),
        fromAgentId: 'scout_supreme',
        toAgentId: 'pipeline_titan',
        title: 'Lead Intel needs action cards',
        body: 'Discovery is useful only when it becomes a routed next step. I recommend Action Center cards for every scored lead.',
        priority: 'high',
        read: false,
        actionLabel: 'Open Lead Action Center',
        routeHint: '/admin/lead-engine-system',
      },
    ],
    memories: [
      {
        id: newId('mem'),
        createdAt: nowIso(),
        agentId: 'professor_apex',
        topic: 'operator preference',
        detail: 'The operator wants hierarchy, staff identity, and less mystery around Start Swarm / Deep Swarm.',
        source: 'user_note',
        importance: 5,
      },
    ],
  };
  return saveHumanStaffStore(store);
}

export function setSelectedHumanStaff(ids: HumanStaffAgentId[]): HumanStaffStore {
  const unique = Array.from(new Set(ids)).slice(0, 3) as HumanStaffAgentId[];
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, selectedAgentIds: unique });
}

export function addHumanStaffThread(thread: HumanStaffThread): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, threads: [thread, ...store.threads] });
}

export function updateHumanStaffThread(thread: HumanStaffThread): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, threads: store.threads.map((item) => (item.id === thread.id ? { ...thread, updatedAt: nowIso() } : item)) });
}

export function addHumanStaffMessage(threadId: string, message: HumanStaffThread['messages'][number]): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({
    ...store,
    threads: store.threads.map((thread) =>
      thread.id === threadId
        ? {
            ...thread,
            updatedAt: nowIso(),
            messages: [...thread.messages, message].slice(-80),
            memory: Array.from(new Set([...thread.memory, message.body.slice(0, 180)])).slice(-20),
          }
        : thread,
    ),
  });
}

export function addHumanStaffNotifications(notifications: HumanStaffNotification[]): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, notifications: [...notifications, ...store.notifications] });
}

export function markHumanStaffNotificationRead(id: string): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, notifications: store.notifications.map((note) => (note.id === id ? { ...note, read: true } : note)) });
}

export function addHumanStaffMission(plan: HumanStaffMissionPlan): HumanStaffStore {
  const store = loadHumanStaffStore();
  return saveHumanStaffStore({ ...store, missions: [plan, ...store.missions] });
}

export function addHumanStaffMemory(memory: Omit<HumanStaffMemory, 'id' | 'createdAt'>): HumanStaffStore {
  const store = loadHumanStaffStore();
  const next: HumanStaffMemory = { id: newId('mem'), createdAt: nowIso(), ...memory };
  return saveHumanStaffStore({ ...store, memories: [next, ...store.memories] });
}

export function rememberResponseHash(agentId: string, hash: string): HumanStaffStore {
  const store = loadHumanStaffStore();
  const current = store.lastResponseHashes[agentId] ?? [];
  return saveHumanStaffStore({ ...store, lastResponseHashes: { ...store.lastResponseHashes, [agentId]: [hash, ...current].slice(0, 12) } });
}

export function makeHumanStaffId(prefix: string) {
  return newId(prefix);
}

export function humanStaffNowIso() {
  return nowIso();
}
