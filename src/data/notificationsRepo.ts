import type { AppNotification, NotificationAudience } from '../domain/notifications';
import { nowIso } from '../domain/notifications';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.notifications.v1';

type Store = {
  notifications: AppNotification[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { notifications: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

function matchesAudience(n: AppNotification, audience: NotificationAudience) {
  return n.audience === audience || n.audience === 'both';
}

export function listNotifications(args?: {
  partnerId?: string;
  audience?: NotificationAudience;
  unreadOnly?: boolean;
  limit?: number;
}): AppNotification[] {
  const store = loadStore();
  const audience = args?.audience;
  const partnerId = args?.partnerId;
  const unreadOnly = Boolean(args?.unreadOnly);
  const limit = args?.limit ?? 200;

  return store.notifications
    .filter((n) => (audience ? matchesAudience(n, audience) : true))
    .filter((n) => (partnerId ? n.partnerId === partnerId : true))
    .filter((n) => (unreadOnly ? !n.readAt : true))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, limit));
}

export function unreadCount(args?: { partnerId?: string; audience?: NotificationAudience }): number {
  return listNotifications({ ...args, unreadOnly: true, limit: 10000 }).length;
}

export function createNotification(args: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AppNotification {
  const store = loadStore();
  const next: AppNotification = {
    id: args.id ?? newId('notif'),
    createdAt: args.createdAt ?? nowIso(),
    ...args,
  };
  store.notifications.push(next);
  // prevent unbounded growth
  store.notifications = store.notifications.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2000);
  saveStore(store);
  return next;
}

export function markNotificationRead(id: string): AppNotification | null {
  const store = loadStore();
  const idx = store.notifications.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const cur = store.notifications[idx]!;
  if (cur.readAt) return cur;
  const next = { ...cur, readAt: nowIso() };
  store.notifications[idx] = next;
  saveStore(store);
  return next;
}

export function markAllRead(args?: { partnerId?: string; audience?: NotificationAudience }): number {
  const store = loadStore();
  const now = nowIso();
  const audience = args?.audience;
  const partnerId = args?.partnerId;
  let changed = 0;
  store.notifications = store.notifications.map((n) => {
    if (n.readAt) return n;
    if (audience && !matchesAudience(n, audience)) return n;
    if (partnerId && n.partnerId !== partnerId) return n;
    changed++;
    return { ...n, readAt: now };
  });
  if (changed) saveStore(store);
  return changed;
}

