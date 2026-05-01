import type { WorkflowConfig, WorkflowId, WorkflowRun } from '../domain/automation';
import { nowIso } from '../domain/automation';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.automation.v1';

type Store = {
  configs: Partial<Record<WorkflowId, WorkflowConfig>>;
  runs: WorkflowRun[];
};

function defaultConfig(id: WorkflowId): WorkflowConfig {
  const defaults: Record<WorkflowId, WorkflowConfig['params']> = {
    dispute_followup_scheduler: { daysBeforeDue: 7 },
    evidence_request_autopilot: { dueInDays: 3 },
  };
  return {
    id,
    enabled: true,
    updatedAt: nowIso(),
    params: defaults[id] ?? {},
  };
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { configs: {}, runs: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getWorkflowConfig(id: WorkflowId): WorkflowConfig {
  const store = loadStore();
  return store.configs[id] ?? defaultConfig(id);
}

export function setWorkflowConfig(id: WorkflowId, patch: Partial<WorkflowConfig> & { params?: WorkflowConfig['params'] }): WorkflowConfig {
  const store = loadStore();
  const cur = store.configs[id] ?? defaultConfig(id);
  const next: WorkflowConfig = {
    ...cur,
    ...patch,
    params: patch.params ? { ...cur.params, ...patch.params } : cur.params,
    updatedAt: nowIso(),
  };
  store.configs[id] = next;
  saveStore(store);
  return next;
}

export function listWorkflowRuns(limit = 50): WorkflowRun[] {
  const store = loadStore();
  return store.runs.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, Math.max(1, limit));
}

export function addWorkflowRun(run: WorkflowRun): WorkflowRun {
  const store = loadStore();
  store.runs.push(run);
  store.runs = store.runs.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 500);
  saveStore(store);
  return run;
}

