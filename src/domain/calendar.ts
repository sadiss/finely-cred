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
  status: ConsultationRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventType = 'consultation' | 'follow_up' | 'ops';
export type CalendarEventStatus = 'tentative' | 'confirmed' | 'completed' | 'cancelled';

export type SlotDuration = 20 | 30 | 60 | 90;

export type CalendarEvent = {
  id: string;
  partnerId: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  title: string;
  description?: string;
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
  status: ConsultationRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export function nowIso() {
  return new Date().toISOString();
}

