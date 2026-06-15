import type { NotificationPrefs } from '../domain/notificationPrefs';
import { DEFAULT_NOTIFICATION_PREFS } from '../domain/notificationPrefs';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.notificationPrefs.v1';

type Store = { prefs: NotificationPrefs[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { prefs: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getNotificationPrefs(args: { partnerId?: string; userId?: string }): NotificationPrefs {
  const hit = loadStore().prefs.find(
    (p) => (args.partnerId && p.partnerId === args.partnerId) || (args.userId && p.userId === args.userId),
  );
  if (hit) return hit;
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    partnerId: args.partnerId,
    userId: args.userId,
    updatedAt: new Date().toISOString(),
  };
}

export function upsertNotificationPrefs(prefs: NotificationPrefs): NotificationPrefs {
  const store = loadStore();
  const next = { ...prefs, updatedAt: new Date().toISOString() };
  const idx = store.prefs.findIndex(
    (p) =>
      (prefs.partnerId && p.partnerId === prefs.partnerId) ||
      (prefs.userId && p.userId === prefs.userId),
  );
  if (idx >= 0) store.prefs[idx] = next;
  else store.prefs.push(next);
  saveStore(store);
  return next;
}
