/** Maps platform events → in-app notifications (Phase 33). */
import { onPlatformEvent, type PlatformEvent } from '../domain/platformEvents';
import { createNotification } from '../data/notificationsRepo';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';

function shouldNotify(partnerId: string | undefined, kind: string): boolean {
  if (!partnerId) return true;
  const prefs = getNotificationPrefs({ partnerId });
  return !prefs.mutedKinds.includes(kind);
}

function handleEvent(event: PlatformEvent) {
  const partnerId = event.partnerId;
  const payload = event.payload ?? {};

  if (event.type === 'purchase.completed' && partnerId) {
    if (!shouldNotify(partnerId, 'purchase')) return;
    createNotification({
      partnerId,
      audience: 'partner',
      kind: 'system',
      title: 'Purchase confirmed',
      body: String(payload.title ?? payload.packageName ?? 'Your order is active.'),
      href: '/portal/billing',
      meta: { productId: String(event.entityId ?? '') },
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'trial_expiring' && partnerId) {
    if (!shouldNotify(partnerId, 'trial')) return;
    createNotification({
      partnerId,
      audience: 'both',
      kind: 'system',
      title: 'Trial ending soon',
      body: `${payload.daysLeft ?? '?'} day(s) left on your trial.`,
      href: '/portal/billing',
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'billing_past_due' && partnerId) {
    createNotification({
      partnerId,
      audience: 'both',
      kind: 'system',
      title: 'Payment past due',
      body: 'Update billing to avoid interruption.',
      href: '/portal/billing',
    });
  }

  if (event.type === 'lead.created') {
    createNotification({
      audience: 'admin',
      kind: 'system',
      title: 'New lead captured',
      body: String(payload.email ?? event.leadId ?? 'Lead'),
      href: '/admin/leads',
      meta: { leadId: event.leadId ?? null },
    });
  }

  if (event.type === 'chat.message_received') {
    createNotification({
      audience: 'admin',
      kind: 'support_message',
      title: 'Inbound message',
      body: String(payload.preview ?? payload.text ?? 'New thread activity'),
      href: '/admin/support?source=meta',
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'funnel_session_booked') {
    createNotification({
      audience: 'admin',
      kind: 'system',
      title: 'Funnel session booked',
      body: `${payload.focus ?? 'Strategy call'} · ${payload.funnelId ?? 'funnel'}`,
      href: '/admin/calendar',
      meta: {
        leadId: event.leadId ?? null,
        requestId: typeof payload.requestId === 'string' ? payload.requestId : null,
      },
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'meta_lead') {
    createNotification({
      audience: 'admin',
      kind: 'system',
      title: 'Meta lead received',
      body: String(payload.email ?? payload.name ?? 'Social lead'),
      href: '/admin/leads',
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'crm_stage_changed') {
    createNotification({
      audience: 'admin',
      kind: 'system',
      title: 'CRM stage updated',
      body: `${payload.recordName ?? 'Record'} → ${payload.stage ?? 'moved'}`,
      href: '/admin/crm',
    });
  }

  if (event.type === 'task.created' && partnerId) {
    if (!shouldNotify(partnerId, 'task')) return;
    createNotification({
      partnerId,
      audience: 'partner',
      kind: 'task_created',
      title: 'New task assigned',
      body: String(payload.title ?? 'Check your Work OS tasks.'),
      href: '/portal/my-tasks',
    });
  }

  if (event.type === 'task.overdue' && partnerId) {
    createNotification({
      partnerId,
      audience: 'both',
      kind: 'task_created',
      title: 'Task overdue',
      body: String(payload.title ?? 'A task passed its due date.'),
      href: '/portal/projects',
      meta: { taskId: event.entityId },
    });
  }

  if (event.type === 'automation.triggered' && payload.kind === 'win_back' && partnerId) {
    createNotification({
      partnerId,
      audience: 'both',
      kind: 'system',
      title: 'Trial ended — win-back offer',
      body: 'Upgrade to keep your restore momentum and Work OS access.',
      href: '/portal/billing',
    });
  }

  if (event.type === 'task.completed' && partnerId && payload.actualResult) {
    createNotification({
      partnerId,
      audience: 'admin',
      kind: 'system',
      title: 'Task result recorded',
      body: String(payload.actualResult).slice(0, 120),
      href: '/admin/workflow',
    });
  }
}

let wired = false;

export function wirePlatformNotificationBridge() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  onPlatformEvent(handleEvent);
}

if (typeof window !== 'undefined') {
  wirePlatformNotificationBridge();
}
