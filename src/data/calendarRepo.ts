import type {
  CalendarEvent,
  CalendarEventStatus,
  ConsultationRequest,
  ConsultationRequestStatus,
  ConsultationTopic,
  PublicAppointmentRequest,
  SlotDuration,
} from '../domain/calendar';
import { nowIso } from '../domain/calendar';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { createNotification } from './notificationsRepo';

const KEY = 'finely.calendar.v1';

type Store = {
  requests: ConsultationRequest[];
  events: CalendarEvent[];
  publicAppointmentRequests: PublicAppointmentRequest[];
};

function loadStore(): Store {
  const fallback: Store = { requests: [], events: [], publicAppointmentRequests: [] };
  const loaded = loadJson<Store>(KEY, fallback, 1);
  return {
    requests: loaded.requests ?? [],
    events: loaded.events ?? [],
    publicAppointmentRequests: loaded.publicAppointmentRequests ?? [],
  };
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listConsultationRequests(): ConsultationRequest[] {
  return loadStore().requests.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listRequestsByPartner(partnerId: string): ConsultationRequest[] {
  return listConsultationRequests().filter((r) => r.partnerId === partnerId);
}

export function getConsultationRequest(id: string): ConsultationRequest | null {
  return loadStore().requests.find((r) => r.id === id) ?? null;
}

export function upsertConsultationRequest(req: ConsultationRequest): ConsultationRequest {
  const store = loadStore();
  const idx = store.requests.findIndex((r) => r.id === req.id);
  const next = { ...req, updatedAt: nowIso() };
  if (idx >= 0) store.requests[idx] = next;
  else store.requests.push(next);
  saveStore(store);
  return next;
}

export function createConsultationRequest(args: {
  partnerId: string;
  topic: ConsultationTopic;
  availabilityNotes: string;
  preferredDates?: string[];
  timezone?: string;
  notes?: string;
}): ConsultationRequest {
  const now = nowIso();
  const req: ConsultationRequest = {
    id: newId('req'),
    partnerId: args.partnerId,
    topic: args.topic,
    availabilityNotes: (args.availabilityNotes || '').trim(),
    preferredDates: (args.preferredDates ?? []).map((d) => (d || '').trim()).filter(Boolean).slice(0, 6),
    timezone: (args.timezone || '').trim() || undefined,
    notes: (args.notes || '').trim() || undefined,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };
  const created = upsertConsultationRequest(req);
  createNotification({
    partnerId: created.partnerId,
    audience: 'admin',
    kind: 'calendar_request',
    title: 'New consultation request',
    body: `${created.topic} • ${created.availabilityNotes || 'no availability notes'}`,
    href: '/admin/calendar',
    meta: { requestId: created.id, topic: created.topic, status: created.status },
  });
  return created;
}

export function setRequestStatus(id: string, status: ConsultationRequestStatus): ConsultationRequest | null {
  const store = loadStore();
  const idx = store.requests.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next = { ...store.requests[idx]!, status, updatedAt: nowIso() };
  store.requests[idx] = next;
  saveStore(store);
  return next;
}

export function listPublicAppointmentRequests(): PublicAppointmentRequest[] {
  return loadStore().publicAppointmentRequests
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPublicAppointmentRequest(args: {
  topic: ConsultationTopic;
  fullName: string;
  email: string;
  phone?: string;
  preferredSlotMinutes?: SlotDuration;
  availabilityNotes: string;
  preferredDates?: string[];
  timezone?: string;
  notes?: string;
}): PublicAppointmentRequest {
  const now = nowIso();
  const req: PublicAppointmentRequest = {
    id: newId('pubreq'),
    topic: args.topic,
    fullName: (args.fullName || '').trim(),
    email: (args.email || '').trim(),
    phone: (args.phone || '').trim() || undefined,
    preferredSlotMinutes: args.preferredSlotMinutes,
    availabilityNotes: (args.availabilityNotes || '').trim(),
    preferredDates: (args.preferredDates ?? []).map((d) => (d || '').trim()).filter(Boolean).slice(0, 6),
    timezone: (args.timezone || '').trim() || undefined,
    notes: (args.notes || '').trim() || undefined,
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };
  const store = loadStore();
  store.publicAppointmentRequests.push(req);
  saveStore(store);
  createNotification({
    partnerId: 'admin',
    audience: 'admin',
    kind: 'calendar_request',
    title: 'New public appointment request',
    body: `${req.topic} • ${req.fullName} • ${req.availabilityNotes || 'no availability'}`,
    href: '/admin/calendar',
    meta: { requestId: req.id, topic: req.topic, source: 'public' },
  });
  return req;
}

export function setPublicRequestStatus(id: string, status: ConsultationRequestStatus): PublicAppointmentRequest | null {
  const store = loadStore();
  const idx = store.publicAppointmentRequests.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next = { ...store.publicAppointmentRequests[idx]!, status, updatedAt: nowIso() };
  store.publicAppointmentRequests[idx] = next;
  saveStore(store);
  return next;
}

export function listCalendarEvents(): CalendarEvent[] {
  return loadStore().events.slice().sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function listEventsByPartner(partnerId: string): CalendarEvent[] {
  return listCalendarEvents().filter((e) => e.partnerId === partnerId);
}

export function upsertCalendarEvent(ev: CalendarEvent): CalendarEvent {
  const store = loadStore();
  const idx = store.events.findIndex((e) => e.id === ev.id);
  const next = { ...ev, updatedAt: nowIso() };
  if (idx >= 0) store.events[idx] = next;
  else store.events.push(next);
  saveStore(store);
  return next;
}

export function createCalendarEvent(args: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'reminderSentAt'> & { id?: string }): CalendarEvent {
  const now = nowIso();
  const ev: CalendarEvent = {
    id: args.id ?? newId('evt'),
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  const created = upsertCalendarEvent(ev);
  createNotification({
    partnerId: created.partnerId,
    audience: 'both',
    kind: 'calendar_scheduled',
    title: created.status === 'confirmed' ? 'Meeting confirmed' : 'Meeting scheduled',
    body: `${created.title} • ${new Date(created.startAt).toLocaleString()}`,
    href: '/portal/calendar',
    meta: { eventId: created.id, status: created.status, startAt: created.startAt, type: created.type },
  });
  return created;
}

/**
 * Create a public event (webinar/office hours) not tied to a partner.
 * Stored in the same calendar store for demo mode; does NOT send partner notifications.
 */
export function createPublicCalendarEvent(args: {
  tenantId: string;
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  status?: CalendarEventStatus;
  meetingUrl?: string;
  location?: string;
  timezone?: string;
}): CalendarEvent {
  const now = nowIso();
  const ev: CalendarEvent = {
    id: newId('evt'),
    partnerId: `public:${(args.tenantId || '').trim() || 'unknown'}`,
    type: 'ops',
    status: args.status ?? 'confirmed',
    title: (args.title || '').trim() || 'Public event',
    description: (args.description || '').trim() || undefined,
    startAt: args.startAt,
    endAt: args.endAt,
    meetingUrl: (args.meetingUrl || '').trim() || undefined,
    location: (args.location || '').trim() || undefined,
    timezone: (args.timezone || '').trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  return upsertCalendarEvent(ev);
}

export function setEventStatus(id: string, status: CalendarEventStatus): CalendarEvent | null {
  const store = loadStore();
  const idx = store.events.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = { ...store.events[idx]!, status, updatedAt: nowIso() };
  store.events[idx] = next;
  saveStore(store);
  return next;
}

export function setEventMeetingNotes(id: string, meetingNotes: string | undefined): CalendarEvent | null {
  const store = loadStore();
  const idx = store.events.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const next = { ...store.events[idx]!, meetingNotes: meetingNotes?.trim() || undefined, updatedAt: nowIso() };
  store.events[idx] = next;
  saveStore(store);
  return next;
}

export function scheduleEventFromPublicRequest(args: {
  requestId: string;
  startAt: string;
  endAt: string;
  meetingUrl?: string;
  location?: string;
  slotDurationMinutes?: SlotDuration;
  confirm?: boolean;
}): CalendarEvent | null {
  const store = loadStore();
  const req = store.publicAppointmentRequests.find((r) => r.id === args.requestId);
  if (!req) return null;

  const ev = createCalendarEvent({
    partnerId: `public:${args.requestId}`,
    type: 'consultation',
    status: args.confirm ? 'confirmed' : 'tentative',
    title: `Consultation: ${req.topic.replace('_', ' ')} — ${req.fullName}`,
    description: [req.notes, `Availability: ${req.availabilityNotes}`, `Preferred: ${req.preferredSlotMinutes ?? 30} min`, `Email: ${req.email}`, req.phone ? `Phone: ${req.phone}` : ''].filter(Boolean).join('\n'),
    startAt: args.startAt,
    endAt: args.endAt,
    meetingUrl: args.meetingUrl?.trim() || undefined,
    location: args.location?.trim() || undefined,
    slotDurationMinutes: args.slotDurationMinutes ?? (req.preferredSlotMinutes as SlotDuration | undefined),
    timezone: req.timezone,
    sourceRequestId: req.id,
  });

  const idx = store.publicAppointmentRequests.findIndex((r) => r.id === args.requestId);
  if (idx >= 0) {
    store.publicAppointmentRequests[idx] = { ...req, status: 'scheduled', updatedAt: nowIso() };
    saveStore(store);
  }
  return ev;
}

export function scheduleEventFromRequest(args: {
  requestId: string;
  startAt: string;
  endAt: string;
  meetingUrl?: string;
  location?: string;
  confirm?: boolean;
}): { request: ConsultationRequest; event: CalendarEvent } {
  const req = getConsultationRequest(args.requestId);
  if (!req) throw new Error('Request not found.');

  const ev = createCalendarEvent({
    partnerId: req.partnerId,
    type: 'consultation',
    status: args.confirm ? 'confirmed' : 'tentative',
    title: `Consultation: ${req.topic.replace('_', ' ')}`,
    description: [req.notes, `Availability: ${req.availabilityNotes}`].filter(Boolean).join('\n'),
    startAt: args.startAt,
    endAt: args.endAt,
    meetingUrl: args.meetingUrl,
    location: args.location,
    sourceRequestId: req.id,
    timezone: req.timezone,
  });

  const nextReq = setRequestStatus(req.id, 'scheduled')!;
  return { request: nextReq, event: ev };
}

/**
 * Create partner reminders for events happening soon.
 * Local-first: runs when calendar pages load.
 */
export function sendUpcomingReminders(args?: { withinHours?: number; now?: Date }): number {
  const withinHours = Math.max(1, Math.round(args?.withinHours ?? 24));
  const now = args?.now ?? new Date();
  const nowMs = now.getTime();
  const cutoff = nowMs + withinHours * 60 * 60 * 1000;

  const store = loadStore();
  let changed = 0;
  const nextEvents = store.events.map((ev) => {
    if (ev.status !== 'confirmed') return ev;
    if (ev.reminderSentAt) return ev;
    const startMs = Date.parse(ev.startAt);
    if (!Number.isFinite(startMs)) return ev;
    if (startMs < nowMs) return ev;
    if (startMs > cutoff) return ev;

    createNotification({
      partnerId: ev.partnerId,
      audience: 'both',
      kind: 'calendar_reminder',
      title: 'Upcoming meeting',
      body: `${ev.title} • ${new Date(ev.startAt).toLocaleString()}`,
      href: '/portal/calendar',
      meta: { eventId: ev.id, startAt: ev.startAt, type: ev.type },
    });
    changed++;
    return { ...ev, reminderSentAt: nowIso(), updatedAt: nowIso() };
  });

  if (changed) {
    store.events = nextEvents;
    saveStore(store);
  }
  return changed;
}

