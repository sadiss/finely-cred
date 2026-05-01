import type { Bureau } from '../domain/creditReports';
import type { DisputeCase, DisputeCaseItem, DisputeCaseRound } from '../domain/cases';
import { addDaysIso, nowIso } from '../domain/cases';
import type { Project } from '../domain/projects';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KEY = 'finely.cases.v1';
const PROJECTS_KEY = 'finely.projects.v1';

type Store = { cases: DisputeCase[] };
type ProjectsStore = { projects: Project[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { cases: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function loadProjectsStore(): ProjectsStore {
  return loadJson<ProjectsStore>(PROJECTS_KEY, { projects: [] }, 1);
}

function saveProjectsStore(store: ProjectsStore) {
  saveJson(PROJECTS_KEY, store, 1);
}

function ensureDefaultProjectIdForPartner(args: { partnerId: string; scope: 'personal' | 'business' }): string {
  const store = loadProjectsStore();
  const scope = args.scope ?? 'personal';
  const projects = store.projects.map((p) => ({ ...p, scope: (p as any).scope ?? 'personal' }));
  const existing =
    projects.find((p) => p.partnerId === args.partnerId && (p.scope ?? 'personal') === scope && p.status === 'active') ??
    null;
  if (existing?.id) return existing.id;

  const now = nowIso();
  const created: Project = {
    id: newId('proj'),
    partnerId: args.partnerId,
    scope,
    title: scope === 'business' ? 'DFY Business Project' : 'DFY Restoration Project',
    status: 'active',
    stage: 'intake',
    tags: ['dfy', 'baseline', scope, 'auto'],
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
  store.projects.push(created);
  saveProjectsStore(store);
  return created.id;
}

export function listCases(): DisputeCase[] {
  const store = loadStore();
  let changed = false;
  const normalized = store.cases.map((c) => {
    const projectId =
      (c as any).projectId ?? ensureDefaultProjectIdForPartner({ partnerId: c.partnerId, scope: 'personal' });
    if ((c as any).projectId !== projectId) changed = true;
    return { ...c, projectId };
  });
  if (changed) {
    store.cases = normalized as any;
    saveStore(store);
  }
  return normalized.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listCasesByPartner(partnerId: string): DisputeCase[] {
  return listCases().filter((c) => c.partnerId === partnerId);
}

export function getCase(id: string): DisputeCase | null {
  return loadStore().cases.find((c) => c.id === id) ?? null;
}

export function upsertCase(c: DisputeCase): DisputeCase {
  const store = loadStore();
  const idx = store.cases.findIndex((x) => x.id === c.id);
  const next = { ...c, updatedAt: nowIso() };
  if (idx >= 0) store.cases[idx] = next;
  else store.cases.push(next);
  saveStore(store);

  if (isSupabaseConfigured) {
    queueMicrotask(() => {
      void supabase.from('cases').upsert(
        {
          id: next.id,
          partner_id: next.partnerId,
          project_id: (next as any).projectId ?? null,
          bureau: next.bureau,
          title: next.title,
          status: next.status,
          latest_report_id: (next as any).latestReportId ?? null,
          items: (next as any).items ?? [],
          rounds: (next as any).rounds ?? [],
          created_at: (next as any).createdAt ?? nowIso(),
          updated_at: (next as any).updatedAt ?? nowIso(),
        },
        { onConflict: 'id' },
      );
    });
  }
  return next;
}

export function closeCase(id: string): DisputeCase | null {
  const c = getCase(id);
  if (!c) return null;
  const next = upsertCase({ ...c, status: 'closed' });
  createNotification({
    partnerId: next.partnerId,
    audience: 'both',
    kind: 'case_update',
    title: `Case closed: ${next.title}`,
    body: `${next.bureau} • ${next.items.length} item(s)`,
    href: `/portal/disputes/${encodeURIComponent(next.id)}`,
    meta: { caseId: next.id, status: next.status, bureau: next.bureau },
  });
  return next;
}

export function replaceCasesSnapshotForPartner(args: { partnerId: string; cases: DisputeCase[] }) {
  const store = loadStore();
  store.cases = [...store.cases.filter((c) => c.partnerId !== args.partnerId), ...(args.cases ?? [])];
  saveStore(store);
}

export function createDisputeCase(args: {
  partnerId: string;
  bureau: Bureau;
  title: string;
  latestReportId?: string;
  items: DisputeCaseItem[];
  initialRound: DisputeCaseRound;
  projectId?: string;
}): DisputeCase {
  const createdAt = nowIso();
  const projectId = args.projectId ?? ensureDefaultProjectIdForPartner({ partnerId: args.partnerId, scope: 'personal' });
  const c: DisputeCase = {
    id: newId('case'),
    partnerId: args.partnerId,
    projectId,
    bureau: args.bureau,
    title: args.title,
    status: 'open',
    createdAt,
    updatedAt: createdAt,
    latestReportId: args.latestReportId,
    items: args.items,
    rounds: [
      {
        ...args.initialRound,
        createdAt,
        dueAt: args.initialRound.dueAt ?? addDaysIso(createdAt, 35),
      },
    ],
  };
  const created = upsertCase(c);
  const due0 = created.rounds[0]?.dueAt;
  const dueLabel0 = due0 ? new Date(due0).toLocaleDateString() : '—';
  createNotification({
    partnerId: created.partnerId,
    audience: 'both',
    kind: 'case_update',
    title: `Case opened: ${created.title}`,
    body: `${created.bureau} • ${created.items.length} item(s) • due ${dueLabel0}`,
    href: `/portal/disputes/${encodeURIComponent(created.id)}`,
    meta: { caseId: created.id, status: created.status, bureau: created.bureau, round: created.rounds[0]!.round },
  });
  return created;
}

export function addRoundToCase(args: {
  caseId: string;
  round: DisputeCaseRound;
  replaceIfSameRound?: boolean;
}): DisputeCase | null {
  const c = getCase(args.caseId);
  if (!c) return null;
  const rounds = c.rounds.slice();
  const idx = rounds.findIndex((r) => r.round === args.round.round);
  const nextRound: DisputeCaseRound = {
    ...args.round,
    createdAt: args.round.createdAt || nowIso(),
    dueAt: args.round.dueAt ?? addDaysIso(args.round.createdAt || nowIso(), 35),
  };
  if (idx >= 0) {
    if (args.replaceIfSameRound) rounds[idx] = nextRound;
    else rounds.push(nextRound);
  } else {
    rounds.push(nextRound);
  }
  const next = upsertCase({ ...c, rounds });
  createNotification({
    partnerId: next.partnerId,
    audience: 'both',
    kind: 'case_update',
    title: `New round added: ${next.title}`,
    body: `${next.bureau} • round ${next.rounds[next.rounds.length - 1]!.round}`,
    href: `/portal/disputes/${encodeURIComponent(next.id)}`,
    meta: { caseId: next.id, status: next.status, bureau: next.bureau, round: next.rounds[next.rounds.length - 1]!.round },
  });
  return next;
}

