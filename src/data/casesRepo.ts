import type { Bureau } from '../domain/creditReports';
import type { DisputeCase, DisputeCaseItem, DisputeCaseRound } from '../domain/cases';
import { addDaysIso, nowIso } from '../domain/cases';
import type { Project } from '../domain/projects';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { bureauShortCode } from '../utils/bureaus';
import { createNotification } from './notificationsRepo';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { DisputeRoundLabel, DisputeRoundStatus } from '../domain/disputeWorkflow';
import { recordDisputeCaseAction } from './disputeWorkflowRepo';

const KEY = 'finely.cases.v1';
const PROJECTS_KEY = 'finely.projects.v1';

type Store = { cases: DisputeCase[] };
type ProjectsStore = { projects: Project[] };

// Module-level cache: prevents duplicate project creation and deferred-write races
const _caseProjectIdCache = new Map<string, string>();

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
  const scope = args.scope ?? 'personal';
  const cacheKey = `${args.partnerId}::${scope}`;
  if (_caseProjectIdCache.has(cacheKey)) return _caseProjectIdCache.get(cacheKey)!;

  const store = loadProjectsStore();
  const projects = store.projects.map((p) => ({ ...p, scope: (p as any).scope ?? 'personal' }));
  const existing =
    projects.find((p) => p.partnerId === args.partnerId && (p.scope ?? 'personal') === scope && p.status === 'active') ??
    null;
  if (existing?.id) {
    _caseProjectIdCache.set(cacheKey, existing.id);
    return existing.id;
  }

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
  _caseProjectIdCache.set(cacheKey, created.id); // cache before deferred write
  store.projects.push(created);
  // Defer write so it doesn't dispatch finely:store synchronously during React render
  queueMicrotask(() => saveProjectsStore(store));
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
    const snapshot = normalized as any;
    // Defer write so it doesn't dispatch finely:store synchronously during React render
    queueMicrotask(() => saveStore({ cases: snapshot }));
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
    body: `${bureauShortCode(next.bureau)} • ${next.items.length} item(s)`,
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
    body: `${bureauShortCode(created.bureau)} • ${created.items.length} item(s) • due ${dueLabel0}`,
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
    status: args.round.status ?? (args.round.letterId ? 'letter_generated' : 'draft'),
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
    body: `${bureauShortCode(next.bureau)} • round ${next.rounds[next.rounds.length - 1]!.round}`,
    href: `/portal/disputes/${encodeURIComponent(next.id)}`,
    meta: { caseId: next.id, status: next.status, bureau: next.bureau, round: next.rounds[next.rounds.length - 1]!.round },
  });
  return next;
}

function patchLatestRound(
  c: DisputeCase,
  roundLabel: DisputeRoundLabel,
  patch: Partial<DisputeCaseRound>,
): DisputeCase {
  const rounds = c.rounds.slice();
  const idx = rounds.map((r) => r.round).lastIndexOf(roundLabel);
  if (idx < 0) {
    rounds.push({
      round: roundLabel,
      tone: 'formal',
      createdAt: nowIso(),
      dueAt: addDaysIso(nowIso(), 35),
      ...patch,
    });
  } else {
    rounds[idx] = { ...rounds[idx]!, ...patch };
  }
  return upsertCase({ ...c, rounds });
}

export function updateCaseRound(args: {
  caseId: string;
  round: DisputeRoundLabel;
  patch: Partial<DisputeCaseRound>;
}): DisputeCase | null {
  const c = getCase(args.caseId);
  if (!c) return null;
  return patchLatestRound(c, args.round, args.patch);
}

export function markCaseRoundMailed(args: {
  caseId: string;
  round: DisputeRoundLabel;
  mailedAt?: string;
  createdBy?: 'partner' | 'admin';
}): DisputeCase | null {
  const mailedAt = args.mailedAt ?? nowIso();
  const c = updateCaseRound({
    caseId: args.caseId,
    round: args.round,
    patch: { status: 'mailed' as DisputeRoundStatus, mailedAt },
  });
  if (!c) return null;
  recordDisputeCaseAction({
    caseId: c.id,
    partnerId: c.partnerId,
    round: args.round,
    type: 'bureau_letter',
    title: `${args.round} marked as mailed`,
    body: `Letter sent on ${new Date(mailedAt).toLocaleDateString()}. Awaiting bureau response (~30 days).`,
    createdBy: args.createdBy ?? 'partner',
    href: `/portal/disputes/${encodeURIComponent(c.id)}`,
  });
  return c;
}

export function markCaseRoundResponseReceived(args: {
  caseId: string;
  round: DisputeRoundLabel;
  responseReceivedAt?: string;
  notes?: string;
  createdBy?: 'partner' | 'admin';
}): DisputeCase | null {
  const responseReceivedAt = args.responseReceivedAt ?? nowIso();
  const c = updateCaseRound({
    caseId: args.caseId,
    round: args.round,
    patch: {
      status: 'response_received' as DisputeRoundStatus,
      responseReceivedAt,
      notes: args.notes ?? undefined,
    },
  });
  if (!c) return null;
  recordDisputeCaseAction({
    caseId: c.id,
    partnerId: c.partnerId,
    round: args.round,
    type: 'bureau_response',
    title: `Bureau response logged for ${args.round}`,
    body: args.notes || 'Response received — review results and decide next step.',
    createdBy: args.createdBy ?? 'partner',
    href: `/portal/disputes/${encodeURIComponent(c.id)}`,
  });
  return c;
}

export function markCaseRoundReadyForNext(args: {
  caseId: string;
  round: DisputeRoundLabel;
  createdBy?: 'partner' | 'admin';
}): DisputeCase | null {
  const c = updateCaseRound({
    caseId: args.caseId,
    round: args.round,
    patch: { status: 'ready_for_next_round' as DisputeRoundStatus },
  });
  if (!c) return null;
  recordDisputeCaseAction({
    caseId: c.id,
    partnerId: c.partnerId,
    round: args.round,
    type: 'note',
    title: `${args.round} complete — ready for next round`,
    body: 'Case owner confirmed this round is done. Generate the next round letter when ready.',
    createdBy: args.createdBy ?? 'partner',
    href: `/portal/letters?caseId=${encodeURIComponent(c.id)}`,
  });
  return c;
}

