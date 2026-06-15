/** Browser push for high-signal platform events (Phase 41). */
import { onPlatformEvent, type PlatformEvent } from '../domain/platformEvents';
import { getNotificationPrefs } from '../data/notificationPrefsRepo';

function canPush(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

function showPush(title: string, body: string, href?: string) {
  if (!canPush()) return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/manifest-icon-192.png',
      tag: `finely-${title}`.slice(0, 32),
    });
    n.onclick = () => {
      window.focus();
      if (href) window.location.assign(href);
      n.close();
    };
  } catch {
    // ignore — Safari / restricted contexts
  }
}

function partnerPushAllowed(partnerId: string | undefined, kind: string): boolean {
  if (!partnerId) return true;
  const prefs = getNotificationPrefs({ partnerId });
  return !prefs.mutedKinds.includes(kind) && prefs.pushEnabled !== false;
}

function handlePushEvent(event: PlatformEvent) {
  const payload = event.payload ?? {};
  const partnerId = event.partnerId;

  if (event.type === 'lead.created') {
    showPush('New lead', String(payload.email ?? event.leadId ?? 'Lead captured'), '/admin/leads');
  }

  if (event.type === 'task.overdue' && partnerId && partnerPushAllowed(partnerId, 'task')) {
    showPush('Task overdue', String(payload.title ?? 'Check Work OS'), '/portal/projects');
  }

  if (event.type === 'automation.triggered' && payload.kind === 'trial_expiring' && partnerId) {
    if (!partnerPushAllowed(partnerId, 'trial')) return;
    showPush('Trial ending soon', `${payload.daysLeft ?? '?'} day(s) left`, '/portal/billing');
  }

  if (event.type === 'automation.triggered' && payload.kind === 'meta_lead') {
    showPush('Meta lead', String(payload.email ?? payload.name ?? 'Social lead'), '/admin/leads');
  }

  if (event.type === 'automation.triggered' && payload.kind === 'billing_past_due' && partnerId) {
    if (!partnerPushAllowed(partnerId, 'purchase')) return;
    showPush('Payment past due', 'Update billing to avoid interruption.', '/portal/billing');
  }

  if (event.type === 'automation.triggered' && payload.kind === 'win_back' && partnerId) {
    showPush('Trial ended', 'Special offer to continue your restore journey.', '/portal/billing');
  }
}

let wired = false;

export function wirePushNotificationBridge() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  onPlatformEvent(handlePushEvent);
}

if (typeof window !== 'undefined') {
  wirePushNotificationBridge();
}
