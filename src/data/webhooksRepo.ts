import type { PlatformEventType } from '../domain/platformEvents';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

export type WebhookEndpoint = {
  id: string;
  label: string;
  url: string;
  secret?: string;
  events: PlatformEventType[];
  enabled: boolean;
  createdAt: string;
};

const KEY = 'finely.webhooks.v1';

type Store = { endpoints: WebhookEndpoint[]; deliveryLog: Array<{ id: string; endpointId: string; eventType: string; at: string; ok: boolean }> };

function loadStore(): Store {
  return loadJson<Store>(KEY, { endpoints: [], deliveryLog: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function seedDefaultWebhookEndpoints() {
  const store = loadJson<Store>(KEY, { endpoints: [], deliveryLog: [] }, 1);
  if (store.endpoints.length > 0) return;
  store.endpoints.push({
    id: newId('wh'),
    label: 'Platform events (dev sink)',
    url: 'https://localhost/dev-webhook-sink',
    events: ['lead.created', 'purchase.completed', 'automation.triggered', 'task.created', 'task.completed', 'task.overdue'],
    enabled: true,
    createdAt: new Date().toISOString(),
  });
  saveJson(KEY, store, 1);
}

export function listAllWebhookEndpoints(): WebhookEndpoint[] {
  seedDefaultWebhookEndpoints();
  return loadStore().endpoints;
}

export function listWebhookEndpoints(): WebhookEndpoint[] {
  return listAllWebhookEndpoints().filter((e) => e.enabled);
}

export function getWebhookDeliveryLog(limit = 50) {
  seedDefaultWebhookEndpoints();
  return loadStore().deliveryLog.slice(0, limit);
}

export function upsertWebhookEndpoint(ep: WebhookEndpoint): WebhookEndpoint {
  const store = loadStore();
  const idx = store.endpoints.findIndex((e) => e.id === ep.id);
  if (idx >= 0) store.endpoints[idx] = ep;
  else store.endpoints.push(ep);
  saveStore(store);
  return ep;
}

export function createWebhookEndpoint(args: Omit<WebhookEndpoint, 'id' | 'createdAt'>): WebhookEndpoint {
  return upsertWebhookEndpoint({
    ...args,
    id: newId('wh'),
    createdAt: new Date().toISOString(),
  });
}

/** Queue outbound webhook delivery (local log — production POST via edge function). */
export function dispatchWebhooksForEvent(eventType: PlatformEventType, payload: Record<string, unknown>) {
  const store = loadStore();
  const hits = store.endpoints.filter((e) => e.enabled && e.events.includes(eventType));
  for (const ep of hits) {
    store.deliveryLog.unshift({
      id: newId('whd'),
      endpointId: ep.id,
      eventType,
      at: new Date().toISOString(),
      ok: true,
    });
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.info('[webhook]', ep.url, eventType, payload);
    }
  }
  store.deliveryLog = store.deliveryLog.slice(0, 500);
  saveStore(store);
}
