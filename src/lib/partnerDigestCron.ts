/** Partner notification digest batch tick (Phase 33). */
import { loadJson, saveJson } from '../data/localJsonStore';
import { sendPartnerDigestEmails } from './notificationDigestComms';

const KEY = 'finely.partnerDigestCron.v1';
const DIGEST_INTERVAL_MS = 24 * 60 * 60 * 1000;

type Store = { lastPartnerDigestAt?: string };

function loadStore(): Store {
  return loadJson<Store>(KEY, {}, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export type PartnerDigestCronResult = {
  ran: boolean;
  skipped?: 'cooldown';
  sent?: number;
  skippedCount?: number;
};

export async function processPartnerDigestTick(args?: {
  dryRun?: boolean;
  force?: boolean;
}): Promise<PartnerDigestCronResult> {
  const store = loadStore();
  const now = Date.now();
  const last = store.lastPartnerDigestAt ? Date.parse(store.lastPartnerDigestAt) : 0;

  if (!args?.force && last && now - last < DIGEST_INTERVAL_MS) {
    return { ran: false, skipped: 'cooldown' };
  }

  const result = await sendPartnerDigestEmails({ dryRun: args?.dryRun });
  if (!args?.dryRun) {
    saveStore({ lastPartnerDigestAt: new Date().toISOString() });
  }

  return {
    ran: true,
    sent: result.sent,
    skippedCount: result.skipped,
  };
}
