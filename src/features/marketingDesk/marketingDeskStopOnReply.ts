/**
 * Stop-on-reply foundation — when email webhook events match a prospect email,
 * pause nurture and (for replies) create a Hot reply task.
 * Bounce / complaint also pause when the recipient email matches.
 * Edge email-webhook stays ingest/log; this runs on client ingest/sync.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';
import { listProspects } from '../../data/crmProspectsRepo';
import { listCrmRecords, setCrmRecordStage } from '../../data/crmRecordsRepo';
import { listEmailWebhookEvents, type EmailWebhookEvent } from '../../data/commsWebhookRepo';
import { pauseMarketingMailForEmail } from './marketingDeskMail';
import { createMarketingTask, findOpenMarketingTask } from './marketingDeskTasks';

const PROCESSED_KEY = 'finely.marketing_desk_stop_on_reply_processed.v1';
const LAST_STOP_KEY = 'finely.marketing_desk_last_stop_on_reply.v1';
const MAX_PROCESSED = 400;

type ProcessedStore = { ids: string[] };

export type MarketingLastMailStop = {
  at: string;
  action: 'reply' | 'bounce' | 'complaint';
  email: string;
  cancelled: number;
  hotTaskId?: string;
};

function loadProcessed(): ProcessedStore {
  return loadJson<ProcessedStore>(PROCESSED_KEY, { ids: [] }, 1);
}

function markProcessed(id: string) {
  const store = loadProcessed();
  if (store.ids.includes(id)) return;
  store.ids.unshift(id);
  store.ids = store.ids.slice(0, MAX_PROCESSED);
  saveJson(PROCESSED_KEY, store, 1);
}

function wasProcessed(id: string): boolean {
  return loadProcessed().ids.includes(id);
}

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

function looksLikeEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@') && value.trim().length > 3;
}

/** Pull recipient from top-level or common provider payload shapes. */
export function extractWebhookRecipientEmail(ev: Pick<EmailWebhookEvent, 'recipient' | 'payload'>): string {
  if (looksLikeEmail(ev.recipient)) return normalizeEmail(ev.recipient);
  const p = ev.payload || {};
  const direct = [
    p.email,
    p.recipient,
    p.to,
    p.email_address,
    p.emailAddress,
    p.address,
    (p as { mail?: { destination?: string[] } }).mail?.destination?.[0],
  ];
  for (const c of direct) {
    if (looksLikeEmail(c)) return normalizeEmail(c);
  }
  // SendGrid-style array
  const emailArr = p.email as unknown;
  if (Array.isArray(emailArr) && looksLikeEmail(emailArr[0])) return normalizeEmail(emailArr[0]);
  return '';
}

/** Classify provider event → pause action. */
export function classifyWebhookMailAction(
  eventType: string,
): 'reply' | 'bounce' | 'complaint' | 'ignore' {
  const t = (eventType || '').toLowerCase();
  if (
    /\b(reply|replied|inbound|received|email\.received|message\.received)\b/.test(t) ||
    t.includes('reply')
  ) {
    return 'reply';
  }
  if (/\b(bounce|bounced|dropped|failed|deferred)\b/.test(t)) return 'bounce';
  if (/\b(complaint|spamreport|spam_report|unsubscribe|group_unsubscribe)\b/.test(t)) {
    return 'complaint';
  }
  return 'ignore';
}

function findProspectIdForEmail(email: string): string | undefined {
  const normalized = normalizeEmail(email);
  if (!normalized) return undefined;
  const p = listProspects().find((x) =>
    (x.contact?.emails ?? []).some((e) => normalizeEmail(e) === normalized),
  );
  return p?.id;
}

function nudgeBoardTalking(email: string) {
  const normalized = normalizeEmail(email);
  const record = listCrmRecords({ kind: 'inbound_lead' }).find(
    (r) => normalizeEmail(r.contact?.email || '') === normalized,
  );
  if (!record) return;
  // Inbound board: New → Contacted (Talking) → Booked
  if (record.stage === 'new') {
    try {
      setCrmRecordStage(record.id, 'contacted');
    } catch {
      /* non-blocking */
    }
  }
}

function rememberLastStop(stop: MarketingLastMailStop) {
  saveJson(LAST_STOP_KEY, stop, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

/** Last auto-pause for Mail room honesty (null when none). */
export function getLastMarketingMailStop(): MarketingLastMailStop | null {
  return loadJson<MarketingLastMailStop | null>(LAST_STOP_KEY, null, 1);
}

export type StopOnReplyResult = {
  acted: boolean;
  action: 'reply' | 'bounce' | 'complaint' | 'ignore';
  email?: string;
  cancelled: number;
  prospectId?: string;
  hotTaskId?: string;
};

/**
 * Apply stop-on-reply / bounce / complaint pause for one webhook event (idempotent by event id).
 */
export function applyStopOnReplyFromWebhookEvent(ev: EmailWebhookEvent): StopOnReplyResult {
  const action = classifyWebhookMailAction(ev.eventType);
  if (action === 'ignore') {
    return { acted: false, action, cancelled: 0 };
  }
  if (wasProcessed(ev.id)) {
    return { acted: false, action, cancelled: 0, email: extractWebhookRecipientEmail(ev) };
  }

  const email = extractWebhookRecipientEmail(ev);
  if (!email) {
    markProcessed(ev.id);
    return { acted: false, action, cancelled: 0 };
  }

  const reason =
    action === 'reply' ? 'reply' : action === 'bounce' ? 'bounce' : 'complaint';
  const paused = pauseMarketingMailForEmail(email, reason);
  markProcessed(ev.id);

  let hotTaskId: string | undefined;
  if (action === 'reply') {
    const prospectId = paused.prospectId || findProspectIdForEmail(email);
    // Hot reply task when we paused mail or know the prospect / inbound email
    if (paused.cancelled > 0 || prospectId || listCrmRecords({ kind: 'inbound_lead' }).some(
      (r) => normalizeEmail(r.contact?.email || '') === email,
    )) {
      const prospect = prospectId ? listProspects().find((p) => p.id === prospectId) : undefined;
      const name = prospect?.contact?.name || prospect?.company?.name || email;
      const existing = findOpenMarketingTask({
        kind: 'book',
        prospectId,
        leadId: prospectId,
      });
      const alreadyHot =
        existing &&
        ((existing.tags ?? []).includes('marketing-hot-reply') ||
          (existing.meta as { hotReply?: boolean } | undefined)?.hotReply);
      if (alreadyHot) {
        hotTaskId = existing.id;
      } else {
        const task = createMarketingTask({
          kind: 'book',
          title: `Hot reply — ${name}`,
          notes: [
            `They replied to marketing mail (${email}).`,
            paused.cancelled > 0
              ? 'Sequences paused. Follow up and offer a book link.'
              : 'Follow up and offer a book link.',
            prospectId ? `Prospect: ${prospectId}` : 'Match by email — open CRM if needed.',
          ].join('\n'),
          prospectId,
          leadId: prospectId,
          href: '/admin/marketing-desk?helper=board',
          priority: 'high',
          dueAt: new Date().toISOString(),
          tags: ['marketing-hot-reply'],
          meta: {
            hotReply: true,
            email,
            webhookEventId: ev.id,
            href: '/admin/marketing-desk?helper=board',
            bookUrl: '/consultation',
          },
          dedupe: false,
        });
        hotTaskId = task.id;
      }
      nudgeBoardTalking(email);
    }
  }

  // Always record last auto-pause for Mail honesty (reply / bounce / complaint).
  rememberLastStop({
    at: new Date().toISOString(),
    action,
    email,
    cancelled: paused.cancelled,
    hotTaskId,
  });

  const acted = paused.cancelled > 0 || Boolean(hotTaskId);
  return {
    acted: acted || Boolean(email),
    action,
    email,
    cancelled: paused.cancelled,
    prospectId: paused.prospectId || findProspectIdForEmail(email),
    hotTaskId,
  };
}

/** Scan recent local webhook events and apply any unprocessed stop actions. */
export function processPendingEmailWebhookStopOnReply(limit = 40): number {
  let n = 0;
  for (const ev of listEmailWebhookEvents(limit)) {
    const r = applyStopOnReplyFromWebhookEvent(ev);
    if (r.acted && (r.cancelled > 0 || r.hotTaskId)) n += 1;
  }
  return n;
}
