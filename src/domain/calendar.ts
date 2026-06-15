export type ConsultationTopic =
  | 'enlightenment'
  | 'credit_restore'
  | 'business_build'
  | 'debt_summons'
  | 'identity_theft'
  | 'billing'
  | 'affiliate'
  | 'other';

export type ConsultationRequestStatus = 'new' | 'triaged' | 'scheduled' | 'closed';

export type SlotDuration = 20 | 30 | 60 | 90;

export type CalendarBlockedWindow = {
  id: string;
  label: string;
  /** 0 Sunday, 1 Monday, etc. Omit when using a specific dayKey. */
  dayOfWeek?: number;
  /** YYYY-MM-DD for one-off blocks. */
  dayKey?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type CalendarBookingSettings = {
  timezone?: string;
  startHour: number;
  endHour: number;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  /** If it is after this hour, next-day booking is closed. */
  cutoffHourPreviousDay: number;
  allowedWeekdays: number[];
  allowedDurations: SlotDuration[];
  defaultDuration: SlotDuration;
  meetingTypes: Array<{ id: string; label: string; durationMinutes: SlotDuration; description?: string }>;
  blockedWindows: CalendarBlockedWindow[];
};

export type ConsultationRequest = {
  id: string;
  partnerId: string;
  topic: ConsultationTopic;
  /** Free-text notes on availability/time windows/timezone. */
  availabilityNotes: string;
  /** Optional: explicit preferred date strings (YYYY-MM-DD). */
  preferredDates?: string[];
  timezone?: string;
  notes?: string;
  /** Structured meeting agenda (Calendly-style). */
  meetingAgenda?: string;
  /** Extra context: goals, documents, urgency. */
  details?: string;
  /** Partner-selected slot start (ISO) when self-booking. */
  selectedSlotStartAt?: string;
  selectedSlotEndAt?: string;
  preferredSlotMinutes?: SlotDuration;
  voiceNoteBlobRef?: string;
  voiceNoteMimeType?: string;
  status: ConsultationRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventType = 'consultation' | 'follow_up' | 'ops';
export type CalendarEventStatus = 'tentative' | 'confirmed' | 'completed' | 'cancelled';

export type CalendarEvent = {
  id: string;
  partnerId: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  title: string;
  description?: string;
  /** Pre-meeting agenda visible to partner + admin. */
  meetingAgenda?: string;
  startAt: string; // ISO
  endAt: string; // ISO
  /** Slot duration in minutes (20, 30, 60, 90) */
  slotDurationMinutes?: SlotDuration;
  timezone?: string;
  meetingUrl?: string;
  location?: string;
  sourceRequestId?: string;
  reminderSentAt?: string;
  /** Post-meeting notes (admin enters after call) */
  meetingNotes?: string;
  createdAt: string;
  updatedAt: string;
};

/** Public appointment request (visitor, no login) */
export type PublicAppointmentRequest = {
  id: string;
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
  /** One free enlightenment session per email; later sessions are paid. */
  freeSessionApplied?: boolean;
  sessionPriceCents?: number;
  paymentRequired?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  stripeSessionId?: string;
  voiceNoteBlobRef?: string;
  voiceNoteMimeType?: string;
  status: ConsultationRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

