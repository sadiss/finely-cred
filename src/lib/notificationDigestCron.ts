/** Daily admin notification digest tick (Phase 33). */
import { loadJson, saveJson } from '../data/localJsonStore';
import { createNotification, listNotifications } from '../data/notificationsRepo';
import { buildNotificationDigest, formatDigestSummary, type NotificationDigest } from './notificationDigestEngine';
import { sendAdminDigestEmail } from './notificationDigestComms';

const KEY = 'finely.notificationDigestCron.v1';
const DIGEST_INTERVAL_MS = 24 * 60 * 60 * 1000;

type Store = { lastAdminDigestAt?: string };

function loadStore(): Store {
  return loadJson<Store>(KEY, {}, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export type NotificationDigestCronResult = {
  ran: boolean;
  skipped?: 'cooldown' | 'empty' | 'already_sent';
  digest?: NotificationDigest;
  notificationId?: string;
  emailsSent?: number;
  emailsSkipped?: number;
};

export async function processNotificationDigestTick(args?: {
  dryRun?: boolean;
  force?: boolean;
}): Promise<NotificationDigestCronResult> {
  const store = loadStore();
  const now = Date.now();
  const last = store.lastAdminDigestAt ? Date.parse(store.lastAdminDigestAt) : 0;

  if (!args?.force && last && now - last < DIGEST_INTERVAL_MS) {
    return { ran: false, skipped: 'cooldown' };
  }

  const digest = buildNotificationDigest({ audience: 'admin', hours: 24 });
  if (!digest.total && !args?.force) {
    return { ran: false, skipped: 'empty' };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const existing = listNotifications({ audience: 'admin', limit: 80 }).find(
    (n) => n.meta?.digest === 'daily' && Date.parse(n.createdAt) >= todayStart.getTime(),
  );
  if (existing && !args?.force) {
    return { ran: false, skipped: 'already_sent' };
  }

  if (args?.dryRun) {
    const emailPreview = await sendAdminDigestEmail({ digest, dryRun: true });
    return { ran: true, digest, emailsSent: emailPreview.sent, emailsSkipped: emailPreview.skipped };
  }

  const notif = createNotification({
    audience: 'admin',
    kind: 'system',
    title: 'Daily admin digest',
    body: formatDigestSummary(digest),
    href: '/admin/notifications',
    meta: { digest: 'daily', total: digest.total, unread: digest.unread },
  });

  const emailResult = await sendAdminDigestEmail({ digest, dryRun: false });

  saveStore({ lastAdminDigestAt: new Date().toISOString() });
  return {
    ran: true,
    digest,
    notificationId: notif.id,
    emailsSent: emailResult.sent,
    emailsSkipped: emailResult.skipped,
  };
}
