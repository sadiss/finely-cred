/** Daily notification digest summaries (Phase 33). */
import { listNotifications } from '../data/notificationsRepo';
import type { NotificationAudience } from '../domain/notifications';

export type NotificationDigest = {
  at: string;
  audience: NotificationAudience;
  total: number;
  unread: number;
  byKind: Record<string, number>;
  highlights: string[];
};

export function buildNotificationDigest(args: {
  audience: NotificationAudience;
  partnerId?: string;
  hours?: number;
}): NotificationDigest {
  const hours = args.hours ?? 24;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const items = listNotifications({
    audience: args.audience,
    partnerId: args.partnerId,
    limit: 200,
  }).filter((n) => Date.parse(n.createdAt) >= cutoff);

  const byKind: Record<string, number> = {};
  for (const n of items) {
    byKind[n.kind] = (byKind[n.kind] ?? 0) + 1;
  }

  const highlights = items
    .slice(0, 5)
    .map((n) => n.title)
    .filter(Boolean);

  return {
    at: new Date().toISOString(),
    audience: args.audience,
    total: items.length,
    unread: items.filter((n) => !n.readAt).length,
    byKind,
    highlights,
  };
}

export function formatDigestSummary(digest: NotificationDigest): string {
  if (!digest.total) return 'No alerts in the last 24 hours.';
  const kinds = Object.entries(digest.byKind)
    .map(([k, n]) => `${k} (${n})`)
    .join(', ');
  const head = digest.highlights[0] ? `Latest: ${digest.highlights[0]}.` : '';
  return `${digest.unread} unread of ${digest.total} — ${kinds}. ${head}`.trim();
}
