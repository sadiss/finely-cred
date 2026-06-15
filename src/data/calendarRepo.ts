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
import { buildFinelyMeetingUrl } from '../lib/meetingUrls';
import { onConsultationScheduled } from '../lib/calendarBookingEngine';

const KEY = 'finely.calendar.v1';
const ADDITIONAL_ENLIGHTENMENT_SESSION_CENTS = 10_000;

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
  meetingAgenda?: string;
  details?: string;
  selectedSlotStartAt?: string;
  selectedSlotEndAt?: string;
  preferredSlotMinutes?: SlotDuration;
  voiceNoteBlobRef?: string;
  voiceNoteMimeType?: string;
  status?: ConsultationRequestStatus;
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
    meetingAgenda: (args.meetingAgenda || '').trim() || undefined,
    details: (args.details || '').trim() || undefined,
    selectedSlotStartAt: args.selectedSlotStartAt,
    selectedSlotEndAt: args.selectedSlotEndAt,
    preferredSlotMinutes: args.preferredSlotMinutes,
    voiceNoteBlobRef: args.voiceNoteBlobRef,
    voiceNoteMimeType: args.voiceNoteMimeType,
    status: args.status ?? 'new',
    createdAt: now,
    updatedAt: now,
  };
  const created = upsertConsultationRequest(req);
  createNotification({
    partnerId: created.partnerId,
    audience: 'admin',
    kind: 'calendar_request',
    title: created.status === 'scheduled' ? 'Session booked' : 'New consultation request',
    body: `${created.topic} • ${created.selectedSlotStartAt ? new Date(created.selectedSlotStartAt).toLocaleString() : created.availabilityNotes || 'pending slot'}`,
    href: '/admin/calendar',
    meta: { requestId: created.id, topic: created.topic, status: created.status },
  });
  return created;
}

/** Self-serve Calendly-style booking: creates request + confirmed event in one step. */
export function bookPartnerConsultationSlot(args: {
  partnerId: string;
  topic: ConsultationTopic;
  slotStartAt: string;
  slotEndAt: string;
  slotDurationMinutes: SlotDuration;
  timezone?: string;
  meetingAgenda?: string;
  notes?: string;
  details?: string;
  voiceNoteBlobRef?: string;
  voiceNoteMimeType?: string;
}): { request: ConsultationRequest; event: CalendarEvent } {
  const startMs = Date.parse(args.slotStartAt);
  const endMs = Date.parse(args.slotEndAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error('Invalid time slot.');
  }

  const existing = listCalendarEvents().filter((e) => e.status !== 'cancelled');
  const blocked = existing.some((ev) => {
    const evStart = Date.parse(ev.startAt);
    const evEnd = Date.parse(ev.endAt);
    if (!Number.isFinite(evStart) || !Number.isFinite(evEnd)) return false;
    return startMs < evEnd && evStart < endMs;
  });
  if (blocked) throw new Error('That time slot is no longer available. Pick another.');

  const topicLabel = args.topic.replace(/_/g, ' ');
  const agenda = (args.meetingAgenda || '').trim();
  const details = (args.details || '').trim();
  const notes = (args.notes || '').trim();

  const req = createConsultationRequest({
    partnerId: args.partnerId,
    topic: args.topic,
    availabilityNotes: `Self-booked: ${new Date(args.slotStartAt).toLocaleString()}`,
    timezone: args.timezone,
    notes,
    meetingAgenda: agenda,
    details,
    selectedSlotStartAt: args.slotStartAt,
    selectedSlotEndAt: args.slotEndAt,
    preferredSlotMinutes: args.slotDurationMinutes,
    voiceNoteBlobRef: args.voiceNoteBlobRef,
    voiceNoteMimeType: args.voiceNoteMimeType,
    status: 'scheduled',
  });

  const descriptionParts = [
    agenda ? `Agenda:\n${agenda}` : '',
    details ? `Details:\n${details}` : '',
    notes ? `Notes:\n${notes}` : '',
    args.voiceNoteBlobRef ? 'Voice note attached to request.' : '',
  ].filter(Boolean);

  const ev = createCalendarEvent({
    partnerId: args.partnerId,
    type: 'consultation',
    status: 'confirmed',
    title: `Consultation: ${topicLabel}`,
    description: descriptionParts.join('\n\n') || undefined,
    meetingAgenda: agenda || undefined,
    startAt: args.slotStartAt,
    endAt: args.slotEndAt,
    slotDurationMinutes: args.slotDurationMinutes,
    timezone: args.timezone,
    sourceRequestId: req.id,
  });

  return { request: req, event: ev };
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

function normalizeEmail(email: string) {
  return (email || '').trim().toLowerCase();
}

export function getPublicEnlightenmentSessionQuote(email: string): {
  usedFreeSession: boolean;
  freeSessionApplied: boolean;
  sessionPriceCents: number;
  paymentRequired: boolean;
} {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { usedFreeSession: false, freeSessionApplied: true, sessionPriceCents: 0, paymentRequired: false };
  }
  const usedFreeSession = loadStore().publicAppointmentRequests.some((r) => {
    if (r.topic !== 'enlightenment') return false;
    if (normalizeEmail(r.email) !== normalized) return false;
    return r.status !== 'closed';
  });
  return {
    usedFreeSession,
    freeSessionApplied: !usedFreeSession,
    sessionPriceCents: usedFreeSession ? ADDITIONAL_ENLIGHTENMENT_SESSION_CENTS : 0,
    paymentRequired: usedFreeSession,
  };
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
  meetingAgenda?: string;
  details?: string;
  selectedSlotStartAt?: string;
  selectedSlotEndAt?: string;
  freeSessionApplied?: boolean;
  sessionPriceCents?: number;
  paymentRequired?: boolean;
}): PublicAppointmentRequest {
  const now = nowIso();
  const quote =
    args.topic === 'enlightenment'
      ? getPublicEnlightenmentSessionQuote(args.email)
      : { freeSessionApplied: false, sessionPriceCents: args.sessionPriceCents ?? 0, paymentRequired: Boolean(args.paymentRequired) };
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
    meetingAgenda: (args.meetingAgenda || '').trim() || undefined,
    details: (args.details || '').trim() || undefined,
    selectedSlotStartAt: args.selectedSlotStartAt,
    selectedSlotEndAt: args.selectedSlotEndAt,
    freeSessionApplied: args.freeSessionApplied ?? quote.freeSessionApplied,
    sessionPriceCents: args.sessionPriceCents ?? quote.sessionPriceCents,
    paymentRequired: args.paymentRequired ?? quote.paymentRequired,
    paymentStatus: (args.paymentRequired ?? quote.paymentRequired) ? 'pending' : undefined,
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
    body: `${req.topic} • ${req.fullName} • ${req.availabilityNotes || 'no availability'}${req.paymentRequired ? ' • paid session $100' : ''}`,
    href: '/admin/calendar',
    meta: { requestId: req.id, topic: req.topic, source: 'public' },
  });
  return req;
}

export function markPublicSessionPaid(args: { requestId: string; stripeSessionId?: string }): PublicAppointmentRequest | null {
  const store = loadStore();
  const idx = store.publicAppointmentRequests.findIndex((r) => r.id === args.requestId);
  if (idx < 0) return null;
  const next = {
    ...store.publicAppointmentRequests[idx]!,
    paymentStatus: 'paid' as const,
    stripeSessionId: args.stripeSessionId?.trim() || store.publicAppointmentRequests[idx]!.stripeSessionId,
    updatedAt: nowIso(),
  };
  store.publicAppointmentRequests[idx] = next;
  saveStore(store);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
  return next;
}

export function getPublicAppointmentRequest(id: string): PublicAppointmentRequest | null {
  return loadStore().publicAppointmentRequests.find((r) => r.id === id) ?? null;
}

export function waivePublicSessionPayment(requestId: string): PublicAppointmentRequest | null {
  const store = loadStore();
  const idx = store.publicAppointmentRequests.findIndex((r) => r.id === requestId);
  if (idx < 0) return null;
  const next = {
    ...store.publicAppointmentRequests[idx]!,
    paymentStatus: 'waived' as const,
    updatedAt: nowIso(),
  };
  store.publicAppointmentRequests[idx] = next;
  saveStore(store);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
  return next;
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
  const id = args.id ?? newId('evt');
  const title = args.title || 'Meeting';
  const ev: CalendarEvent = {
    id,
    createdAt: now,
    updatedAt: now,
    ...args,
    title,
    meetingUrl: (args.meetingUrl || '').trim() || buildFinelyMeetingUrl(id, title),
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
    description: [req.notes, req.meetingAgenda ? `Agenda: ${req.meetingAgenda}` : '', `Availability: ${req.availabilityNotes}`].filter(Boolean).join('\n'),
    startAt: args.startAt,
    endAt: args.endAt,
    meetingUrl: args.meetingUrl,
    location: args.location,
    sourceRequestId: req.id,
    timezone: req.timezone,
  });

  const nextReq = setRequestStatus(req.id, 'scheduled')!;
  try {
    onConsultationScheduled({ event: ev, partnerId: req.partnerId });
  } catch {
    // non-blocking
  }
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
      href: `/portal/meeting/${ev.id}`,
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

