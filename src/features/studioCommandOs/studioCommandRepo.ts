import { loadJson, saveJson } from '../../data/localJsonStore';
import type { VideoCommandPlan } from './types';

const KEY = 'finely.studio_command_os.v1';
const VERSION = 1;

type Store = {
  videoPlans: VideoCommandPlan[];
  selectedBlueprintId?: string;
  mediaPromptHistory: string[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { videoPlans: [], mediaPromptHistory: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listVideoCommandPlans(): VideoCommandPlan[] {
  return loadStore().videoPlans.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveVideoCommandPlan(plan: VideoCommandPlan): VideoCommandPlan {
  const store = loadStore();
  const next = [plan, ...store.videoPlans.filter((p) => p.id !== plan.id)].slice(0, 100);
  store.videoPlans = next;
  const prompt = plan.request.prompt.trim();
  if (prompt) store.mediaPromptHistory = [prompt, ...(store.mediaPromptHistory ?? []).filter((p) => p !== prompt)].slice(0, 25);
  saveStore(store);
  return plan;
}

export function deleteVideoCommandPlan(id: string): boolean {
  const store = loadStore();
  const before = store.videoPlans.length;
  store.videoPlans = store.videoPlans.filter((p) => p.id !== id);
  if (before !== store.videoPlans.length) saveStore(store);
  return before !== store.videoPlans.length;
}

export function listMediaPromptHistory(): string[] {
  return loadStore().mediaPromptHistory ?? [];
}

export function setSelectedAutomationBlueprint(id: string) {
  const store = loadStore();
  store.selectedBlueprintId = id;
  saveStore(store);
}

export function getSelectedAutomationBlueprintId(): string | undefined {
  return loadStore().selectedBlueprintId;
}
