import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.fundingLaneFocus.v1';

export type FundingLaneFocus = {
  laneId: string;
  laneTitle?: string;
  focusAt: string;
};

type Store = { byPartner: Record<string, FundingLaneFocus> };

function load(): Store {
  return loadJson(KEY, { byPartner: {} }, 1);
}

function save(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function saveFundingLaneFocus(
  partnerId: string,
  patch: Omit<FundingLaneFocus, 'focusAt'> & { focusAt?: string },
): FundingLaneFocus {
  const next: FundingLaneFocus = {
    ...patch,
    focusAt: patch.focusAt ?? new Date().toISOString(),
  };
  const store = load();
  store.byPartner[partnerId] = next;
  save(store);
  return next;
}

export function getFundingLaneFocus(partnerId: string): FundingLaneFocus | undefined {
  return load().byPartner[partnerId];
}
