import type { DisputeCaseAction, DisputeRoundLabel, InterRoundActionType } from '../domain/disputeWorkflow';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';

const KEY = 'finely.dispute_workflow.v1';

type Store = { actions: DisputeCaseAction[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { actions: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso() {
  return new Date().toISOString();
}

export function listDisputeActionsByCase(caseId: string): DisputeCaseAction[] {
  return loadStore()
    .actions.filter((a) => a.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listDisputeActionsByPartner(partnerId: string): DisputeCaseAction[] {
  return loadStore()
    .actions.filter((a) => a.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function recordDisputeCaseAction(args: {
  caseId: string;
  partnerId: string;
  round?: DisputeRoundLabel;
  type: InterRoundActionType;
  title: string;
  body?: string;
  href?: string;
  createdBy?: DisputeCaseAction['createdBy'];
  meta?: Record<string, unknown>;
  notify?: boolean;
}): DisputeCaseAction {
  const store = loadStore();
  const action: DisputeCaseAction = {
    id: newId('dact'),
    caseId: args.caseId,
    partnerId: args.partnerId,
    round: args.round,
    type: args.type,
    title: args.title,
    body: args.body,
    href: args.href,
    createdAt: nowIso(),
    createdBy: args.createdBy ?? 'system',
    meta: args.meta,
  };
  store.actions.push(action);
  saveStore(store);

  if (args.notify !== false) {
    createNotification({
      partnerId: args.partnerId,
      audience: 'both',
      kind: 'case_update',
      title: args.title,
      body: (args.body || '').slice(0, 220) || `Case activity • ${args.type.replace(/_/g, ' ')}`,
      href: args.href || `/portal/disputes/${encodeURIComponent(args.caseId)}`,
      meta: { caseId: args.caseId, actionId: action.id, round: args.round, type: args.type },
    });
  }
  return action;
}
