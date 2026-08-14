import type { StaffShiftBlock } from './staffMember';

export type ConsultationTopic =
  | 'enlightenment'
  | 'credit_restore'
  | 'business_build'
  | 'funding_strategy'
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

/** Staff member in round-robin scheduling (Calendly-style rotation). */
export type CalendarStaffAssignee = {
  id: string;
  displayName: string;
  email: string;
  /** When false, skipped in rotation. */
  enabled: boolean;
  roleLabel?: string;
  /** Growth agent registry id — e.g. appointment-setter, lead-discovery. */
  growthAgentId?: string;
  /** Human staff roster id for shift/on-duty matching. */
  staffRosterId?: string;
  /** Direct shift blocks when not linked to staffRoster (AI agent hosts). */
  shiftBlocks?: StaffShiftBlock[];
  /** When true (default), skip in rotation when off shift. Set false for always-available hosts. */
  respectShiftSchedule?: boolean;
  /** Consultation topics this host accepts; omit = all topics. */
  topics?: ConsultationTopic[];
};

/** Resolved host for a confirmed booking — persisted on calendar events. */
export type CalendarBookingHost = {
  staffAssigneeId?: string;
  displayName: string;
  email?: string;
  roleLabel?: string;
  growthAgentId?: string;
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
  /** Calendly-style booking horizon — how many days out slots are offered. */
  maxAdvanceDays: number;
  meetingTypes: Array<{ id: string; label: string; durationMinutes: SlotDuration; description?: string }>;
  blockedWindows: CalendarBlockedWindow[];
  /** Distribute new bookings across enabled staff (round-robin). */
  roundRobinEnabled?: boolean;
  staffAssignees?: CalendarStaffAssignee[];
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
export type CalendarEventStatus = 'tentative' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

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
  /** In-app reminder notification sent (portal/admin calendar load). */
  reminderSentAt?: string;
  /** Email/SMS reminder sent for this confirmed event. */
  emailReminderSentAt?: string;
  /** Post-meeting notes (admin enters after call) */
  meetingNotes?: string;
  /** Heuristic summary generated from meetingNotes after the call */
  postMeetingSummary?: string;
  /** Suggested next-step chips saved with the event */
  postMeetingNextSteps?: string[];
  /** Round-robin / assigned session host (Calendly-style). */
  hostStaffAssigneeId?: string;
  hostDisplayName?: string;
  hostEmail?: string;
  hostRoleLabel?: string;
  /** Growth agent attribution when host maps to Alex, Caleb, etc. */
  hostGrowthAgentId?: string;
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

/** Admin-issued self-book link — `/book/i/:token` */
export type BookingInviteStatus = 'active' | 'expired' | 'revoked';

/** Who this invite was created for — shapes email copy and internal reporting. */
export type BookingInviteAudience = 'partner' | 'guest' | 'internal';

export type BookingInviteEmailStatus = 'not_sent' | 'sending' | 'sent' | 'failed';

export type BookingInvite = {
  id: string;
  /** URL-safe token (not the internal id) */
  token: string;
  label?: string;
  topic: ConsultationTopic;
  durationMinutes: SlotDuration;
  /** Optional CRM / lead / partner linkage */
  crmRecordId?: string;
  leadId?: string;
  partnerId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  /** Existing partner vs new/guest contact vs internal team invite. */
  audience?: BookingInviteAudience;
  emailStatus?: BookingInviteEmailStatus;
  emailSentAt?: string;
  emailError?: string;
  expiresAt?: string;
  maxUses: number;
  useCount: number;
  status: BookingInviteStatus;
  /** Last scheduled event id when invite was redeemed */
  lastEventId?: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

