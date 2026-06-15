/**
 * Finely Phone Hub — unified SMS + voice routing model (desktop-first ops center).
 * Outbound: Twilio SMS + Voice via edge functions.
 * Inbound: webhook queue → agent persona routing → CRM timeline.
 */

export type PhoneChannel = 'sms_in' | 'sms_out' | 'voice_in' | 'voice_out' | 'voicemail';

export type PhoneCallStatus =
  | 'queued'
  | 'ringing'
  | 'in_progress'
  | 'completed'
  | 'missed'
  | 'voicemail'
  | 'failed';

export type PhoneThread = {
  id: string;
  partnerId?: string;
  leadId?: string;
  phoneE164: string;
  displayName?: string;
  lastMessageAt: string;
  unreadCount: number;
  channel: 'sms' | 'voice';
  assignedPersonaId?: string;
  assignedStaffId?: string;
};

export type PhoneCallRecord = {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  status: PhoneCallStatus;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  recordingUrl?: string;
  transcription?: string;
  personaId?: string;
  notes?: string;
};

export type PhoneAgentRoute = {
  id: string;
  label: string;
  personaId: string;
  /** E.164 or extension pattern */
  matchPattern?: string;
  channels: PhoneChannel[];
  priority: number;
};

export const PHONE_AGENT_ROUTES: PhoneAgentRoute[] = [
  { id: 'route_sales', label: 'Sales & closers', personaId: 'sales_closer', channels: ['voice_in', 'voice_out', 'sms_in'], priority: 10 },
  { id: 'route_support', label: 'Partner support', personaId: 'support_specialist', channels: ['voice_in', 'sms_in', 'sms_out'], priority: 20 },
  { id: 'route_debt', label: 'Debt validation', personaId: 'debt_strategist', channels: ['voice_in', 'sms_in'], priority: 30 },
  { id: 'route_coowner', label: 'Co-owner escalation', personaId: 'finely_coowner', channels: ['voice_in', 'voicemail'], priority: 5 },
  { id: 'route_affiliate', label: 'Affiliate line', personaId: 'affiliate_specialist', channels: ['sms_in', 'sms_out'], priority: 40 },
  { id: 'route_intake', label: 'CRM intake', personaId: 'crm_intake_specialist', channels: ['voice_in', 'sms_in'], priority: 15 },
];

export const PHONE_HUB_FEATURES = {
  outboundDialer: true,
  inboundQueue: true,
  smsThreads: true,
  voicemailTranscription: true,
  callRecording: true,
  personaHandoff: true,
  coOwnerSummaries: true,
  crmTimelineSync: true,
  desktopSoftphone: true,
  clickToCallFromCrm: true,
  clickToTextFromPortal: true,
  afterHoursVoicemail: true,
  callbackTasks: true,
  consentLogging: true,
} as const;

export function resolvePhoneRoute(args: { channel: PhoneChannel; interest?: string }): PhoneAgentRoute {
  const interest = (args.interest ?? '').toLowerCase();
  if (interest.includes('debt') || interest.includes('summons') || interest.includes('collection')) {
    return PHONE_AGENT_ROUTES.find((r) => r.id === 'route_debt')!;
  }
  if (interest.includes('affiliate')) {
    return PHONE_AGENT_ROUTES.find((r) => r.id === 'route_affiliate')!;
  }
  if (args.channel === 'voicemail') {
    return PHONE_AGENT_ROUTES.find((r) => r.id === 'route_coowner')!;
  }
  return PHONE_AGENT_ROUTES.find((r) => r.id === 'route_intake')!;
}
