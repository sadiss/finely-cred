import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type {
  BusinessCreditProfile,
  BusinessDispute,
  BusinessRoadmapStepId,
  BusinessScoreSnapshot,
} from '../domain/businessCredit';

const KEY = 'finely.business_credit.v1';
const VERSION = 1;

type Store = { profiles: BusinessCreditProfile[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { profiles: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

function defaultProfile(partnerId: string): BusinessCreditProfile {
  return {
    partnerId,
    roadmap: {},
    scores: [],
    disputes: [],
    updatedAt: nowIso(),
  };
}

export function getBusinessCreditProfile(partnerId: string): BusinessCreditProfile {
  const store = loadStore();
  return store.profiles.find((p) => p.partnerId === partnerId) ?? defaultProfile(partnerId);
}

export function upsertBusinessCreditProfile(profile: BusinessCreditProfile): BusinessCreditProfile {
  const store = loadStore();
  const idx = store.profiles.findIndex((p) => p.partnerId === profile.partnerId);
  const next: BusinessCreditProfile = { ...profile, updatedAt: nowIso() };
  if (idx >= 0) store.profiles[idx] = next;
  else store.profiles.unshift(next);
  saveStore(store);
  return next;
}

export function setRoadmapStepDone(args: { partnerId: string; stepId: BusinessRoadmapStepId; done: boolean }) {
  const p = getBusinessCreditProfile(args.partnerId);
  const next = {
    ...p,
    roadmap: {
      ...(p.roadmap ?? {}),
      [args.stepId]: args.done ? { done: true, doneAt: nowIso() } : { done: false },
    },
  };
  return upsertBusinessCreditProfile(next);
}

export function listBusinessScoreSnapshots(partnerId: string): BusinessScoreSnapshot[] {
  const p = getBusinessCreditProfile(partnerId);
  return (p.scores ?? []).slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function upsertBusinessScoreSnapshot(snapshot: Omit<BusinessScoreSnapshot, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const p = getBusinessCreditProfile(snapshot.partnerId);
  const existing = p.scores ?? [];
  const now = nowIso();
  const nextItem: BusinessScoreSnapshot = {
    id: snapshot.id ?? newId('biz_score'),
    partnerId: snapshot.partnerId,
    bureau: snapshot.bureau,
    scoreType: snapshot.scoreType,
    scoreValue: snapshot.scoreValue ?? null,
    reportedTradelines: snapshot.reportedTradelines ?? null,
    reportedPaidPayments: snapshot.reportedPaidPayments ?? null,
    derogFlags: snapshot.derogFlags ?? [],
    notes: snapshot.notes,
    createdAt: existing.find((x) => x.id === snapshot.id)?.createdAt ?? now,
    updatedAt: now,
  };
  const idx = existing.findIndex((x) => x.id === nextItem.id);
  const scores = idx >= 0 ? existing.map((x, i) => (i === idx ? nextItem : x)) : [nextItem, ...existing];
  return upsertBusinessCreditProfile({ ...p, scores });
}

export function deleteBusinessScoreSnapshot(partnerId: string, scoreId: string) {
  const p = getBusinessCreditProfile(partnerId);
  return upsertBusinessCreditProfile({ ...p, scores: (p.scores ?? []).filter((s) => s.id !== scoreId) });
}

export function listBusinessDisputes(partnerId: string): BusinessDispute[] {
  const p = getBusinessCreditProfile(partnerId);
  return (p.disputes ?? []).slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function createBusinessDispute(args: { partnerId: string; title?: string; bureau: BusinessDispute['bureau'] }): BusinessDispute {
  const p = getBusinessCreditProfile(args.partnerId);
  const now = nowIso();
  const d: BusinessDispute = {
    id: newId('biz_dispute'),
    partnerId: args.partnerId,
    title: (args.title || '').trim() || 'Business dispute',
    bureau: args.bureau,
    status: 'draft',
    negativeItems: [],
    evidenceIds: [],
    letterIds: [],
    createdAt: now,
    updatedAt: now,
  };
  return upsertBusinessCreditProfile({ ...p, disputes: [d, ...(p.disputes ?? [])] }).disputes[0]!;
}

export function getBusinessDispute(partnerId: string, disputeId: string): BusinessDispute | null {
  const p = getBusinessCreditProfile(partnerId);
  return (p.disputes ?? []).find((d) => d.id === disputeId) ?? null;
}

export function upsertBusinessDispute(dispute: BusinessDispute): BusinessDispute {
  const p = getBusinessCreditProfile(dispute.partnerId);
  const existing = p.disputes ?? [];
  const next: BusinessDispute = { ...dispute, updatedAt: nowIso() };
  const idx = existing.findIndex((d) => d.id === next.id);
  const disputes = idx >= 0 ? existing.map((d, i) => (i === idx ? next : d)) : [next, ...existing];
  const saved = upsertBusinessCreditProfile({ ...p, disputes });
  return (saved.disputes ?? []).find((d) => d.id === next.id) ?? next;
}

export function deleteBusinessDispute(partnerId: string, disputeId: string) {
  const p = getBusinessCreditProfile(partnerId);
  return upsertBusinessCreditProfile({ ...p, disputes: (p.disputes ?? []).filter((d) => d.id !== disputeId) });
}

