import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.disputeLaneFocus.v1';

export type DisputeLaneFocus = {
  bureau?: string;
  focusAt: string;
};

type Store = { byPartner: Record<string, DisputeLaneFocus> };

function load(): Store {
  return loadJson(KEY, { byPartner: {} }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function saveDisputeLaneFocus(partnerId: string, bureau: string): DisputeLaneFocus {
  const next: DisputeLaneFocus = { bureau, focusAt: new Date().toISOString() };
  const store = load();
  store.byPartner[partnerId] = next;
  save(store);
  return next;
}

export function getDisputeLaneFocus(partnerId: string): DisputeLaneFocus | undefined {
  return load().byPartner[partnerId];
}
