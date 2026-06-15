import type { PartnerEscalation } from '../domain/escalations';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';
import { recordDisputeCaseAction } from './disputeWorkflowRepo';

const KEY = 'finely.escalations.v1';
type Store = { escalations: PartnerEscalation[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { escalations: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listEscalationsByPartner(partnerId: string): PartnerEscalation[] {
  return loadStore().escalations
    .filter((e) => e.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllEscalations(): PartnerEscalation[] {
  return loadStore().escalations.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listEscalationsByCase(caseId: string): PartnerEscalation[] {
  return loadStore().escalations
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createEscalation(args: Omit<PartnerEscalation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): PartnerEscalation {
  const store = loadStore();
  const now = nowIso();
  const esc: PartnerEscalation = {
    id: newId('esc'),
    status: 'open',
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  store.escalations.push(esc);
  saveStore(store);

  createNotification({
    partnerId: esc.partnerId,
    audience: 'admin',
    kind: 'case_update',
    title: `New escalation: ${esc.title}`,
    body: `${esc.topic.replace(/_/g, ' ')} • ${esc.priority} priority`,
    href: '/admin/dispute-collaboration',
    meta: { escalationId: esc.id, caseId: esc.caseId, topic: esc.topic },
  });

  if (esc.caseId) {
    recordDisputeCaseAction({
      caseId: esc.caseId,
      partnerId: esc.partnerId,
      round: esc.disputeRound,
      type: 'internal_escalation',
      title: `Internal escalation filed: ${esc.title}`,
      body: esc.description.slice(0, 220),
      href: `/portal/disputes/${encodeURIComponent(esc.caseId)}`,
      createdBy: 'partner',
      notify: false,
    });
  }
  return esc;
}

export function getEscalation(id: string): PartnerEscalation | null {
  return loadStore().escalations.find((e) => e.id === id) ?? null;
}

export function updateEscalationStatus(
  id: string,
  status: PartnerEscalation['status'],
  resolutionNote?: string
): PartnerEscalation | null {
  const store = loadStore();
  const idx = store.escalations.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = {
    ...store.escalations[idx],
    status,
    updatedAt: nowIso(),
    ...(resolutionNote !== undefined && { resolutionNote }),
  };
  store.escalations[idx] = next;
  saveStore(store);

  createNotification({
    partnerId: next.partnerId,
    audience: 'partner',
    kind: 'case_update',
    title: `Escalation updated: ${next.title}`,
    body: `Status is now ${next.status.replace(/_/g, ' ')}`,
    href: '/portal/escalations',
    meta: { escalationId: next.id, status: next.status },
  });
  return next;
}
