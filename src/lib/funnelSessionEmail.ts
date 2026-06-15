import type { PlatformEvent } from '../domain/platformEvents';
import type { AgentPersonaId } from '../domain/agentPersonas';
import { getAgentPersona } from '../domain/agentPersonas';
import { getLeadCaptureById } from '../data/leadsRepo';
import { getCommsTemplate, addCommsSend, hasRecentLeadCommsSend } from '../data/commsRepo';
import { FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID } from '../data/commsFunnelSessionSeed';
import { sendEmail } from './commsDeliveryClient';
import { buildMarketingEmailFooter } from './commsUnsubscribeFooter';
import { buildEnlightenmentSessionUrl } from './funnelPublicLinks';
import { isFeatureEnabled } from '../data/settingsRepo';
import { isSupabaseConfigured } from './supabaseClient';
import { newId } from '../utils/ids';
import { nowIso } from '../domain/cases';

export type FunnelSessionEmailArgs = {
  leadId?: string;
  fullName: string;
  email: string;
  slotLabel: string;
  focus: string;
  paymentRequired?: boolean;
  requestId?: string;
  agentPersonaId?: AgentPersonaId;
};

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

/** Send session request confirmation to lead (Phase 11/12). */
export async function sendFunnelSessionConfirmationEmail(
  args: FunnelSessionEmailArgs,
): Promise<{ sent: boolean; reason?: string }> {
  const email = args.email?.trim();
  if (!email?.includes('@')) return { sent: false, reason: 'no_email' };

  const dedupeKey = args.requestId || args.slotLabel;
  if (
    args.leadId &&
    hasRecentLeadCommsSend({
      templateId: FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID,
      leadId: args.leadId,
      dedupeKey,
      withinHours: 24,
    })
  ) {
    return { sent: false, reason: 'deduped' };
  }

  const persona = getAgentPersona(args.agentPersonaId ?? 'appointment_setter');
  const firstName = args.fullName.split(' ')[0] || 'there';
  const paymentNote = args.paymentRequired
    ? 'Payment is required before your slot is confirmed — our team will send a secure link if checkout was not completed.'
    : 'Your first strategy call is free — we will email a calendar invite once confirmed.';
  const sessionUrl = buildEnlightenmentSessionUrl({ email, name: args.fullName, leadId: args.leadId });

  const tpl = getCommsTemplate(FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID);
  const vars = {
    firstName,
    slotLabel: args.slotLabel,
    focus: args.focus,
    paymentNote,
    agentName: persona?.name ?? 'Finely Cred',
    sessionUrl,
  };

  const subject = tpl?.subjectTemplate
    ? renderTemplate(tpl.subjectTemplate, vars)
    : 'We received your strategy call request';
  const bodyCore = tpl?.bodyTemplate
    ? renderTemplate(tpl.bodyTemplate, vars)
    : `Hi ${firstName},\n\nWe received your session request for ${args.slotLabel} (${args.focus}).\n\n${paymentNote}\n\nManage booking: ${sessionUrl}`;
  const footer = buildMarketingEmailFooter({ email, personaName: persona?.name });
  const text = `${bodyCore}${footer}`;

  const dryRun = !isFeatureEnabled('commsDelivery') || !isSupabaseConfigured;
  if (dryRun) {
    addCommsSend({
      id: newId('send'),
      templateId: FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID,
      channel: 'email',
      to: email,
      createdAt: nowIso(),
      status: 'dry_run',
      subject,
      body: text,
      meta: { leadId: args.leadId, requestId: args.requestId, dedupeKey },
    });
    return { sent: false, reason: 'comms_not_configured' };
  }

  try {
    await sendEmail({ toEmail: email, toName: args.fullName, subject, text });
    addCommsSend({
      id: newId('send'),
      templateId: FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID,
      channel: 'email',
      to: email,
      createdAt: nowIso(),
      status: 'sent',
      subject,
      body: text,
      meta: { leadId: args.leadId, requestId: args.requestId, dedupeKey },
    });
    return { sent: true };
  } catch (e: unknown) {
    addCommsSend({
      id: newId('send'),
      templateId: FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID,
      channel: 'email',
      to: email,
      createdAt: nowIso(),
      status: 'error',
      subject,
      error: (e as Error)?.message ?? 'send_failed',
      meta: { leadId: args.leadId, requestId: args.requestId },
    });
    return { sent: false, reason: (e as Error)?.message ?? 'send_failed' };
  }
}

/** Handle funnel_session_booked platform events — single spine for confirmation email. */
export async function sendFunnelSessionConfirmationFromEvent(event: PlatformEvent): Promise<{ sent: boolean; reason?: string }> {
  const payload = event.payload ?? {};
  if (payload.kind !== 'funnel_session_booked') return { sent: false, reason: 'wrong_kind' };

  const slotLabel = String(payload.slotLabel ?? 'your preferred time');
  const focus = String(payload.focus ?? 'Strategy call');
  const paymentRequired = Boolean(payload.paymentRequired);

  let fullName = String(payload.fullName ?? '');
  let email = String(payload.email ?? '');

  if (event.leadId) {
    const lead = getLeadCaptureById(event.leadId);
    if (lead) {
      fullName = fullName || lead.fullName;
      email = email || lead.email;
    }
  }

  if (!fullName.trim()) fullName = 'Friend';

  return sendFunnelSessionConfirmationEmail({
    leadId: event.leadId,
    fullName,
    email,
    slotLabel,
    focus,
    paymentRequired,
    requestId: typeof payload.requestId === 'string' ? payload.requestId : undefined,
    agentPersonaId:
      typeof payload.agentPersonaId === 'string'
        ? (payload.agentPersonaId as AgentPersonaId)
        : 'appointment_setter',
  });
}
