import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.debtLaneFocus.v1';

export type DebtLaneFocus = {
  workstation: string;
  focusAt: string;
};

type Store = { byPartner: Record<string, DebtLaneFocus> };

function load(): Store {
  return loadJson(KEY, { byPartner: {} }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function saveDebtLaneFocus(partnerId: string, workstation: string): DebtLaneFocus {
  const next: DebtLaneFocus = { workstation, focusAt: new Date().toISOString() };
  const store = load();
  store.byPartner[partnerId] = next;
  save(store);
  return next;
}

export function getDebtLaneFocus(partnerId: string): DebtLaneFocus | undefined {
  return load().byPartner[partnerId];
}
