import type { CalendarEvent } from '../domain/calendar';
import { addDaysIso } from '../domain/cases';
import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { createNotification } from '../data/notificationsRepo';
import { emitPlatformEvent } from '../domain/platformEvents';

/** When a consultation is scheduled — Work OS prep task + reminder notification. */
export function onConsultationScheduled(args: {
  event: CalendarEvent;
  partnerId: string;
}): { taskCreated: boolean } {
  const { event, partnerId } = args;
  const tag = `calendar_prep:${event.id}`;

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId,
    entityType: 'calendar_event',
    entityId: event.id,
    payload: { kind: 'consultation_scheduled', startAt: event.startAt, title: event.title },
  });

  createNotification({
    partnerId,
    audience: 'both',
    kind: 'calendar_scheduled',
    title: 'Consultation scheduled',
    body: `${event.title} · ${new Date(event.startAt).toLocaleString()}`,
    href: `/portal/meeting/${event.id}`,
    meta: { eventId: event.id },
  });

  const exists = listTasksByPartner(partnerId).some(
    (t) => (t.tags ?? []).includes(tag) && t.status !== 'cancelled',
  );
  if (exists) return { taskCreated: false };

  createTask({
    partnerId,
    title: `Prep for consultation: ${event.title}`,
    kind: 'general',
    stage: 'intake',
    status: 'pending',
    dueAt: addDaysIso(event.startAt, -1),
    notes: 'Gather reports, questions, and goals before your session. Appointment Setter agent can help if needed.',
    assignedTo: 'partner',
    tags: ['calendar_os', tag, 'persona:appointment_setter'],
  });

  const reminderTag = `calendar_reminder:${event.id}`;
  const hasReminder = listTasksByPartner(partnerId).some(
    (t) => (t.tags ?? []).includes(reminderTag) && t.status !== 'cancelled',
  );
  if (!hasReminder) {
    createTask({
      partnerId,
      title: `Join consultation: ${event.title}`,
      kind: 'follow_up',
      stage: 'intake',
      status: 'pending',
      dueAt: event.startAt,
      notes: `Video session starts ${new Date(event.startAt).toLocaleString()}. Open meeting link from calendar.`,
      assignedTo: 'partner',
      tags: ['calendar_os', reminderTag, 'persona:appointment_setter'],
    });
  }

  return { taskCreated: true };
}
