import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.bankruptcyLaneState.v1';

export type BankruptcyLaneSelection = {
  scenarioId: string;
  scenarioTitle?: string;
  threadId?: string;
  selectedAt: string;
};

type Store = { byPartner: Record<string, BankruptcyLaneSelection> };

function load(): Store {
  return loadJson(KEY, { byPartner: {} }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function saveBankruptcyScenarioSelection(
  partnerId: string,
  patch: Omit<BankruptcyLaneSelection, 'selectedAt'> & { selectedAt?: string },
): BankruptcyLaneSelection {
  const store = load();
  const next: BankruptcyLaneSelection = {
    ...patch,
    selectedAt: patch.selectedAt ?? new Date().toISOString(),
  };
  store.byPartner[partnerId] = next;
  save(store);
  return next;
}

export function getBankruptcyScenarioSelection(partnerId: string): BankruptcyLaneSelection | undefined {
  return load().byPartner[partnerId];
}
