import type { Prospect, ProspectNote, ProspectStage, ProspectTarget, ProspectTouch } from '../domain/crmProspects';
import { nowIso } from '../domain/crmProspects';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.crm.prospects.v1';

type Store = { prospects: Prospect[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { prospects: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function clampScore(n: number) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, x));
}

function norm(s: any) {
  return String(s || '').trim();
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((s) => norm(s).toLowerCase()).filter(Boolean)));
}

function touch(kind: ProspectTouch['kind'], meta?: Record<string, any>): ProspectTouch {
  return { id: newId('ptouch'), kind, createdAt: nowIso(), meta: meta ?? undefined };
}

export function listProspects(args?: { q?: string; stage?: ProspectStage | 'all'; target?: ProspectTarget | 'all' }): Prospect[] {
  const store = loadStore();
  const q = norm(args?.q).toLowerCase();
  const stage = (args?.stage ?? 'all') as any;
  const target = (args?.target ?? 'all') as any;
  const filtered = store.prospects.filter((p) => {
    if (stage !== 'all' && p.stage !== stage) return false;
    if (target !== 'all' && p.target !== target) return false;
    if (!q) return true;
    const hay = [
      p.company.name,
      p.company.domain,
      p.company.website,
      p.company.location,
      p.company.industry,
      p.company.description,
      p.contact.name,
      p.contact.title,
      ...(p.contact.emails ?? []),
      ...(p.contact.phones ?? []),
      ...(p.tags ?? []),
      p.id,
      p.source,
      p.stage,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getProspect(id: string): Prospect | null {
  const pid = norm(id);
  if (!pid) return null;
  return loadStore().prospects.find((p) => p.id === pid) ?? null;
}

export function upsertProspect(p: Prospect): Prospect {
  const store = loadStore();
  const now = nowIso();
  const next: Prospect = {
    ...p,
    score: clampScore(p.score),
    tags: Array.from(new Set((p.tags ?? []).map((t) => norm(t)).filter(Boolean))).slice(0, 32),
    contact: {
      ...p.contact,
      emails: uniq(p.contact?.emails ?? []),
      phones: Array.from(new Set((p.contact?.phones ?? []).map((x) => norm(x)).filter(Boolean))).slice(0, 8),
    },
    company: {
      ...p.company,
      name: p.company?.name ? norm(p.company.name) : undefined,
      website: p.company?.website ? norm(p.company.website) : undefined,
      domain: p.company?.domain ? norm(p.company.domain).toLowerCase() : undefined,
      location: p.company?.location ? norm(p.company.location) : undefined,
      industry: p.company?.industry ? norm(p.company.industry) : undefined,
      description: p.company?.description ? norm(p.company.description) : undefined,
    },
    updatedAt: now,
  };

  const idx = store.prospects.findIndex((x) => x.id === next.id);
  if (idx >= 0) store.prospects[idx] = next;
  else store.prospects.push(next);
  saveStore(store);
  return next;
}

export function createProspect(args: {
  target: ProspectTarget;
  source: Prospect['source'];
  score?: number;
  tags?: string[];
  company?: Partial<Prospect['company']>;
  contact?: Partial<Prospect['contact']>;
  intel?: Prospect['intel'];
}): Prospect {
  const now = nowIso();
  const p: Prospect = {
    id: newId('prospect'),
    createdAt: now,
    updatedAt: now,
    target: args.target,
    stage: 'new',
    source: args.source,
    score: clampScore(args.score ?? 0),
    tags: Array.from(new Set((args.tags ?? []).map((t) => norm(t)).filter(Boolean))),
    company: {
      name: args.company?.name ? norm(args.company.name) : undefined,
      website: args.company?.website ? norm(args.company.website) : undefined,
      domain: args.company?.domain ? norm(args.company.domain).toLowerCase() : undefined,
      location: args.company?.location ? norm(args.company.location) : undefined,
      industry: args.company?.industry ? norm(args.company.industry) : undefined,
      description: args.company?.description ? norm(args.company.description) : undefined,
    },
    contact: {
      name: args.contact?.name ? norm(args.contact.name) : undefined,
      title: args.contact?.title ? norm(args.contact.title) : undefined,
      emails: uniq(args.contact?.emails ?? []),
      phones: Array.from(new Set((args.contact?.phones ?? []).map((x) => norm(x)).filter(Boolean))),
    },
    intel: args.intel,
    notes: [],
    touches: [touch('enriched', { via: args.source })],
  };
  const next = upsertProspect(p);
  return next;
}

export function findProspectByWebsite(website: string): Prospect | null {
  const url = norm(website).toLowerCase();
  if (!url) return null;
  return loadStore().prospects.find((p) => (p.company.website || '').toLowerCase() === url) ?? null;
}

export function addProspectNote(prospectId: string, text: string): Prospect | null {
  const p = getProspect(prospectId);
  if (!p) return null;
  const t = norm(text);
  if (!t) return p;
  const note: ProspectNote = { id: newId('pnote'), createdAt: nowIso(), text: t };
  return upsertProspect({ ...p, notes: [note, ...(p.notes ?? [])], touches: [touch('note'), ...(p.touches ?? [])] });
}

export function setProspectStage(prospectId: string, stage: ProspectStage): Prospect | null {
  const p = getProspect(prospectId);
  if (!p) return null;
  if (p.stage === stage) return p;
  return upsertProspect({ ...p, stage, touches: [touch('stage_change', { stage }), ...(p.touches ?? [])] });
}

export function assignProspect(prospectId: string, args: { userId?: string; email?: string } | null): Prospect | null {
  const p = getProspect(prospectId);
  if (!p) return null;
  const nextAssigned = args ? { userId: args.userId, email: args.email } : undefined;
  return upsertProspect({ ...p, assignedTo: nextAssigned, touches: [touch('assigned', nextAssigned ?? { cleared: true }), ...(p.touches ?? [])] });
}

export function patchProspect(prospectId: string, patch: Partial<Prospect>): Prospect | null {
  const p = getProspect(prospectId);
  if (!p) return null;
  return upsertProspect({ ...p, ...(patch as any) });
}

