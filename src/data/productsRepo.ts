import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { BundleActivation, BundleId } from '../domain/products';

const KEY = 'finely.bundles.v1';

type Store = { activations: BundleActivation[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { activations: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listBundleActivationsByPartner(partnerId: string): BundleActivation[] {
  return loadStore().activations.filter((a) => a.partnerId === partnerId).sort((a, b) => b.activatedAt.localeCompare(a.activatedAt));
}

export function getActiveBundleActivation(partnerId: string, bundleId: BundleId): BundleActivation | null {
  return listBundleActivationsByPartner(partnerId).find((a) => a.bundleId === bundleId && a.status === 'active') ?? null;
}

export function upsertBundleActivation(act: BundleActivation): BundleActivation {
  const store = loadStore();
  const idx = store.activations.findIndex((x) => x.id === act.id);
  if (idx >= 0) store.activations[idx] = act;
  else store.activations.push(act);
  saveStore(store);
  return act;
}

export function createBundleActivation(args: {
  partnerId: string;
  bundleId: BundleId;
  startAt: string;
  createdTaskIds: string[];
}): BundleActivation {
  const act: BundleActivation = {
    id: newId('bundle'),
    partnerId: args.partnerId,
    bundleId: args.bundleId,
    activatedAt: nowIso(),
    startAt: args.startAt,
    createdTaskIds: args.createdTaskIds,
    status: 'active',
  };
  return upsertBundleActivation(act);
}

