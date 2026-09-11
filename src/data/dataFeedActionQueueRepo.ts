/**
 * Today-queue rows spawned from live data feeds.
 * Approve creates a Marketing Desk review task — human still has to act.
 */
import { createMarketingTask, type MarketingTaskKind } from '../features/marketingDesk/marketingDeskTasks';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.dataFeedActions.v1';

export type DataFeedActionCta = 'email' | 'post' | 'mail' | 'book' | 'payout';

export type DataFeedActionRow = {
  id: string;
  createdAt: string;
  source: string;
  headline: string;
  detail: string;
  href?: string;
  cta: DataFeedActionCta;
  status: 'pending' | 'approved' | 'dismissed';
  taskId?: string;
};

type Store = { rows: DataFeedActionRow[] };

function load(): Store {
  return loadJson<Store>(KEY, { rows: [] }, 1);
}

function save(store: Store) {
  saveJson(KEY, { rows: store.rows.slice(0, 80) }, 1);
}

function newId() {
  return `dfa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listDataFeedActions(status?: DataFeedActionRow['status']): DataFeedActionRow[] {
  const rows = load().rows;
  return status ? rows.filter((r) => r.status === status) : rows;
}

export function enqueueDataFeedAction(args: {
  source: string;
  headline: string;
  detail: string;
  href?: string;
  cta?: DataFeedActionCta;
}): DataFeedActionRow {
  const store = load();
  const existing = store.rows.find(
    (r) => r.status === 'pending' && r.source === args.source && r.headline === args.headline,
  );
  if (existing) return existing;
  const row: DataFeedActionRow = {
    id: newId(),
    createdAt: new Date().toISOString(),
    source: args.source,
    headline: args.headline,
    detail: args.detail,
    href: args.href,
    cta: args.cta ?? 'post',
    status: 'pending',
  };
  store.rows.unshift(row);
  save(store);
  return row;
}

function kindForCta(cta: DataFeedActionCta): MarketingTaskKind {
  if (cta === 'book') return 'book';
  if (cta === 'email') return 'nurture';
  return 'review';
}

export function approveDataFeedAction(id: string): DataFeedActionRow | null {
  const store = load();
  const row = store.rows.find((r) => r.id === id);
  if (!row || row.status !== 'pending') return row ?? null;
  const task = createMarketingTask({
    kind: kindForCta(row.cta),
    title: `${row.cta === 'book' ? 'Book' : row.cta === 'email' ? 'Email' : 'Post'}: ${row.headline}`,
    notes: `${row.detail}${row.href ? `\n\nSource: ${row.href}` : ''}\n\nFrom Data Feeds · ${row.source}`,
    href: row.cta === 'book' ? '/enlightenment-session' : row.href,
    tags: ['data-feed', row.source],
    meta: { source: 'data_feeds', feedSource: row.source, cta: row.cta },
    dedupe: false,
  });
  row.status = 'approved';
  row.taskId = task.id;
  save(store);
  return row;
}

export function dismissDataFeedAction(id: string): DataFeedActionRow | null {
  const store = load();
  const row = store.rows.find((r) => r.id === id);
  if (!row) return null;
  row.status = 'dismissed';
  save(store);
  return row;
}
