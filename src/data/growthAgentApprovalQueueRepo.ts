/**
 * One unified "needs your OK" approval inbox for growth-agent brain directives —
 * replaces the pattern of each agent (Caleb's review queue, Hannah's syndication
 * queue) having its own disconnected approval flag with no shared surface.
 */
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.growth_approval_queue.v1';

export type GrowthApprovalItem = {
  id: string;
  agentId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  reasoning: string;
  confidence: number;
  meta?: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

type Store = { items: GrowthApprovalItem[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { items: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, { items: store.items.slice(0, 500) }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function enqueueGrowthApproval(args: {
  agentId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  reasoning: string;
  confidence: number;
  meta?: Record<string, unknown>;
}): GrowthApprovalItem {
  const item: GrowthApprovalItem = {
    id: newId('approval'),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...args,
  };
  const store = loadStore();
  store.items = [item, ...store.items];
  saveStore(store);
  return item;
}

export function listPendingGrowthApprovals(): GrowthApprovalItem[] {
  return loadStore().items.filter((i) => i.status === 'pending');
}

export function resolveGrowthApproval(id: string, approve: boolean, resolvedBy = 'admin'): GrowthApprovalItem | null {
  const store = loadStore();
  const item = store.items.find((i) => i.id === id);
  if (!item) return null;
  item.status = approve ? 'approved' : 'rejected';
  item.resolvedAt = new Date().toISOString();
  item.resolvedBy = resolvedBy;
  saveStore(store);
  return item;
}
