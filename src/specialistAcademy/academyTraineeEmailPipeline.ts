import { newId } from '../utils/ids';
import { addCommsSend } from '../data/commsRepo';
import { getAcademyTraineeSettings, isFeatureEnabled } from '../data/settingsRepo';
import { sendEmail } from '../lib/commsDeliveryClient';
import {
  ACADEMY_TRAINEE_TEMPLATE_PREFIX,
  ensureAcademyTraineeTemplates,
  renderAcademyTraineeEmail,
} from './academyTraineeComms';

const SENT_KEY = 'finely.specialistAcademy.traineeEmailSent.v1';
const OUTBOX_KEY = 'finely.specialistAcademy.traineeEmailOutbox.v1';

export type AcademyTraineeEmailEvent =
  | 'welcome'
  | 'module_started'
  | 'module_completed'
  | 'quiz_passed'
  | 'quiz_retry'
  | 'weekly_digest'
  | 'course_complete'
  | 'material_pack';

type SentMap = Record<string, string>;

function loadSent(): SentMap {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '{}') as SentMap;
  } catch {
    return {};
  }
}

function markSent(key: string) {
  const m = loadSent();
  m[key] = new Date().toISOString();
  localStorage.setItem(SENT_KEY, JSON.stringify(m));
}

function wasSent(key: string, withinHours?: number): boolean {
  const ts = loadSent()[key];
  if (!ts) return false;
  if (!withinHours) return true;
  const age = Date.now() - Date.parse(ts);
  return age < withinHours * 3600 * 1000;
}

function pushOutbox(entry: { event: string; to: string; subject: string; body: string; error?: string }) {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]') as unknown[];
    const list = Array.isArray(raw) ? raw : [];
    list.unshift({ ...entry, at: new Date().toISOString() });
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(0, 80)));
  } catch {
    /* ignore */
  }
}

export function listAcademyTraineeOutbox() {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]') as Array<{
      event: string;
      to: string;
      subject: string;
      at: string;
      error?: string;
    }>;
  } catch {
    return [];
  }
}

function templateIdFor(event: AcademyTraineeEmailEvent): string {
  if (event === 'quiz_retry') return `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}quiz_retry`;
  if (event === 'material_pack') return `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}material_pack`;
  return `${ACADEMY_TRAINEE_TEMPLATE_PREFIX}${event}`;
}

export async function triggerAcademyTraineeEmail(args: {
  event: AcademyTraineeEmailEvent;
  toEmail: string;
  toName?: string;
  dedupeKey?: string;
  dedupeHours?: number;
  ctx: Record<string, unknown>;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const settings = getAcademyTraineeSettings();
  if (!settings.traineeEmailsEnabled) return { ok: false, skipped: true };

  if (args.event === 'weekly_digest' && !settings.weeklyDigestEnabled) {
    return { ok: false, skipped: true };
  }

  const dedupeKey = args.dedupeKey ?? args.event;
  if (wasSent(dedupeKey, args.dedupeHours)) return { ok: true, skipped: true };

  ensureAcademyTraineeTemplates();
  const tid = templateIdFor(args.event);
  const rendered = renderAcademyTraineeEmail(tid, args.ctx);
  if (!rendered) return { ok: false, error: 'Template missing' };

  const canSend = isFeatureEnabled('commsDelivery');

  if (!canSend) {
    pushOutbox({
      event: args.event,
      to: args.toEmail,
      subject: rendered.subject,
      body: rendered.body,
      error: 'commsDelivery disabled — queued in outbox',
    });
    addCommsSend({
      id: newId('send'),
      templateId: tid,
      channel: 'email',
      to: args.toEmail,
      createdAt: new Date().toISOString(),
      status: 'dry_run',
      subject: rendered.subject,
      body: rendered.body,
      meta: { academyTrainee: true, event: args.event },
    });
    markSent(dedupeKey);
    return { ok: true, skipped: true };
  }

  try {
    await sendEmail({
      toEmail: args.toEmail,
      toName: args.toName,
      subject: rendered.subject,
      text: rendered.body,
    });
    addCommsSend({
      id: newId('send'),
      templateId: tid,
      channel: 'email',
      to: args.toEmail,
      createdAt: new Date().toISOString(),
      status: 'sent',
      subject: rendered.subject,
      body: rendered.body,
      meta: { academyTrainee: true, event: args.event },
    });
    markSent(dedupeKey);
    return { ok: true };
  } catch (e: unknown) {
    const msg = (e as Error)?.message || 'Send failed';
    pushOutbox({ event: args.event, to: args.toEmail, subject: rendered.subject, body: rendered.body, error: msg });
    return { ok: false, error: msg };
  }
}

export function academyBaseUrl(): string {
  try {
    return `${window.location.origin}/admin/specialist-academy`;
  } catch {
    return '/admin/specialist-academy';
  }
}
