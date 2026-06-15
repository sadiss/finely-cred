import type { BankerRelationship, FundingLadderPlan, InquiryPull } from '../domain/fundingLadder';
import { DEFAULT_FUNDING_PLAN } from '../domain/fundingLadder';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.fundingLadder.v1';

type Store = {
  plans: FundingLadderPlan[];
  pulls: InquiryPull[];
  bankers: BankerRelationship[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { plans: [], pulls: [], bankers: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
}

function nowIso() {
  return new Date().toISOString();
}

export function getFundingLadderPlan(partnerId: string): FundingLadderPlan {
  const store = loadStore();
  const hit = store.plans.find((p) => p.partnerId === partnerId);
  if (hit) return hit;
  return {
    partnerId,
    ...DEFAULT_FUNDING_PLAN,
    updatedAt: nowIso(),
  };
}

export function upsertFundingLadderPlan(plan: FundingLadderPlan): FundingLadderPlan {
  const store = loadStore();
  const next = { ...plan, updatedAt: nowIso() };
  const idx = store.plans.findIndex((p) => p.partnerId === plan.partnerId);
  if (idx >= 0) store.plans[idx] = next;
  else store.plans.push(next);
  saveStore(store);
  return next;
}

export function listInquiryPullsByPartner(partnerId: string, limit = 48): InquiryPull[] {
  return loadStore()
    .pulls.filter((p) => p.partnerId === partnerId)
    .sort((a, b) => b.pulledAt.localeCompare(a.pulledAt))
    .slice(0, limit);
}

export function addInquiryPull(args: Omit<InquiryPull, 'id'>): InquiryPull {
  const store = loadStore();
  const pull: InquiryPull = { ...args, id: newId('inq') };
  store.pulls.unshift(pull);
  saveStore(store);
  return pull;
}

export function listBankerRelationships(partnerId: string): BankerRelationship[] {
  return loadStore()
    .bankers.filter((b) => b.partnerId === partnerId)
    .sort((a, b) => (b.lastContactAt ?? '').localeCompare(a.lastContactAt ?? ''));
}

export function upsertBankerRelationship(b: BankerRelationship): BankerRelationship {
  const store = loadStore();
  const idx = store.bankers.findIndex((x) => x.id === b.id);
  if (idx >= 0) store.bankers[idx] = b;
  else store.bankers.push(b);
  saveStore(store);
  return b;
}

export function createBankerRelationship(args: Omit<BankerRelationship, 'id'>): BankerRelationship {
  return upsertBankerRelationship({ ...args, id: newId('bnk') });
}
