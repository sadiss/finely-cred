import type { AgentOperatingModel } from '../domain/agentProgram';
import { defaultAgentOperatingModel } from '../domain/agentProgram';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.agent_program.v1';
const VERSION = 1;

type Store = {
  byUserId: Record<string, AgentOperatingModel>;
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { byUserId: {} }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function getAgentOperatingModel(userId: string | undefined | null): AgentOperatingModel | null {
  if (!userId) return null;
  const store = loadStore();
  return store.byUserId[userId] ?? null;
}

export function saveAgentOperatingModel(userId: string, model: AgentOperatingModel): AgentOperatingModel {
  const normalized = defaultAgentOperatingModel(model);
  const store = loadStore();
  store.byUserId[userId] = normalized;
  saveStore(store);
  return normalized;
}

export function agentModelFromMetadata(meta: Record<string, unknown> | undefined): AgentOperatingModel | null {
  if (!meta?.agentOperatingModel) return null;
  try {
    return defaultAgentOperatingModel(meta.agentOperatingModel as Partial<AgentOperatingModel>);
  } catch {
    return null;
  }
}
