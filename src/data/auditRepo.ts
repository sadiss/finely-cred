import type { AuditEvent } from '../domain/audit';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.audit.v1';

type Store = { events: AuditEvent[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { events: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

/**
 * List all audit events (platform admin only)
 */
export function listAuditEvents(): AuditEvent[] {
  return loadStore().events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * List audit events for a specific tenant
 */
export function listAuditEventsByTenant(tenantId: string): AuditEvent[] {
  return loadStore()
    .events.filter((e) => e.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAuditEventsByPartner(partnerId: string): AuditEvent[] {
  return listAuditEvents().filter((e) => e.partnerId === partnerId);
}

/**
 * List audit events for a partner within a specific tenant
 */
export function listAuditEventsByPartnerInTenant(
  partnerId: string,
  tenantId: string
): AuditEvent[] {
  return loadStore()
    .events.filter((e) => e.partnerId === partnerId && e.tenantId === tenantId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addAuditEvent(
  e: Omit<AuditEvent, 'id' | 'createdAt' | 'tenantId'> & { tenantId?: string }
): AuditEvent {
  const store = loadStore();
  const ev: AuditEvent = {
    id: newId('audit'),
    createdAt: nowIso(),
    tenantId: e.tenantId ?? FINELY_TENANT_ID,
    ...e,
  };
  store.events.push(ev);
  saveStore(store);
  return ev;
}

