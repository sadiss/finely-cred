/**
 * Marketing Desk mail spine — enroll into server nurture (not a fourth engine).
 * Cold / offer / booked / inbound all use nurture_enrollments.
 */
import { getProspect, listProspects } from '../../data/crmProspectsRepo';
import { getCrmRecord } from '../../data/crmRecordsRepo';
import {
  enrollLeadInNurtureSequence,
  cancelNurtureEnrollmentsForLead,
  cancelNurtureEnrollmentsForEmail,
} from '../../lib/nurtureEngine';
import { getMarketingMailStatus, isMarketingMailPaused } from './marketingDeskMailStatus';
import { createMarketingTask, createOfferTask } from './marketingDeskTasks';
import type { LeadEngineLane } from '../leadIntel/leadEngineAutonomy';
import { prospectAllowsColdEmail } from './marketingProspectConsent';
import { isColdOutboundAutopilotEnabled } from '../growthAgents/calebAutoFind';

export const SEQ_COLD_PROSPECT = 'seq_cold_prospect';
export const SEQ_INVITE_OPT_IN = 'seq_invite_opt_in';
export const SEQ_OFFER_PACK = 'seq_offer_pack';
export const SEQ_BOOKED_CONFIRM = 'seq_booked_confirm';
export const SEQ_INBOUND_WELCOME = 'seq_inbound_nurture';
export const SEQ_NURTURE = 'seq_business_funnel';

export type MailEnrollResult = {
  enrolled: boolean;
  enrollmentId?: string;
  fallbackTask?: boolean;
  reason?: string;
};

function mailCanAutopilot(): boolean {
  if (isMarketingMailPaused()) return false;
  return getMarketingMailStatus().status === 'ready';
}

/** Staging approve → cold sequence when email present + mail Ready; else Book/nurture task. */
export function enrollColdProspectMail(args: {
  prospectId: string;
  email?: string;
  fullName?: string;
  lane?: LeadEngineLane | string;
}): MailEnrollResult {
  const prospect = getProspect(args.prospectId);
  if (!prospectAllowsColdEmail(prospect)) {
    return enrollInviteOptInMail(args);
  }

  const email = (args.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    createMarketingTask({
      kind: 'nurture',
      title: `Find email — ${args.fullName || 'prospect'}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: 'No email on approve — add contact then enroll Mail on autopilot.',
      href: '/admin/marketing-desk?helper=find',
    });
    return { enrolled: false, fallbackTask: true, reason: 'no_email' };
  }

  if (!isColdOutboundAutopilotEnabled()) {
    createMarketingTask({
      kind: 'nurture',
      title: `Cold gated — ${args.fullName || email}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: `coldOutboundAutopilot is off (default) — link-first invite or manual outreach to ${email}.`,
      href: '/admin/marketing-desk?helper=mail',
      meta: { email },
    });
    return { enrolled: false, fallbackTask: true, reason: 'cold_autopilot_off' };
  }

  if (!mailCanAutopilot()) {
    createMarketingTask({
      kind: 'nurture',
      title: `Cold follow-up — ${args.fullName || email}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: `Mail Needs setup or Paused. Manual outreach to ${email}.`,
      href: '/admin/marketing-desk?helper=mail',
      meta: { email },
    });
    return { enrolled: false, fallbackTask: true, reason: 'needs_setup' };
  }

  const enrollment = enrollLeadInNurtureSequence({
    leadId: args.prospectId,
    sequenceId: SEQ_COLD_PROSPECT,
    tenantId: 'finely_cred',
    context: {
      email,
      fullName: args.fullName,
      prospectId: args.prospectId,
      lane: args.lane,
      source: 'marketing_desk_cold',
      funnelPath: '/consultation',
    },
  });

  if (!enrollment) {
    createMarketingTask({
      kind: 'nurture',
      title: `Cold follow-up — ${args.fullName || email}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: `Cold sequence unavailable. Manual outreach to ${email}.`,
      href: '/admin/marketing-desk?helper=mail',
      meta: { email },
    });
    return { enrolled: false, fallbackTask: true, reason: 'sequence_disabled' };
  }

  return {
    enrolled: true,
    enrollmentId: enrollment.id,
  };
}

/** Discovered leads — one link-first invite, no cold touches until they opt in. */
export function enrollInviteOptInMail(args: {
  prospectId: string;
  email?: string;
  fullName?: string;
  lane?: LeadEngineLane | string;
}): MailEnrollResult {
  const email = (args.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    createMarketingTask({
      kind: 'nurture',
      title: `Link-first invite — ${args.fullName || 'prospect'}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: 'No email — add contact, then send opt-in link (no cold sequence).',
      href: '/admin/marketing-desk?helper=find',
    });
    return { enrolled: false, fallbackTask: true, reason: 'no_email' };
  }

  if (!mailCanAutopilot()) {
    createMarketingTask({
      kind: 'nurture',
      title: `Link-first invite — ${args.fullName || email}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: `Mail Needs setup or Paused. Send opt-in link manually to ${email} — cold mail gated.`,
      href: '/admin/marketing-desk?helper=mail',
      meta: { email },
    });
    return { enrolled: false, fallbackTask: true, reason: 'needs_setup' };
  }

  const enrollment = enrollLeadInNurtureSequence({
    leadId: args.prospectId,
    sequenceId: SEQ_INVITE_OPT_IN,
    tenantId: 'finely_cred',
    context: {
      email,
      fullName: args.fullName,
      prospectId: args.prospectId,
      lane: args.lane,
      source: 'marketing_desk_invite_opt_in',
      funnelPath: '/resources/business-credit-one-sheets',
    },
  });

  if (!enrollment) {
    createMarketingTask({
      kind: 'nurture',
      title: `Link-first invite — ${args.fullName || email}`,
      prospectId: args.prospectId,
      lane: args.lane,
      notes: `Invite sequence unavailable. Send opt-in link manually to ${email}.`,
      href: '/admin/marketing-desk?helper=mail',
      meta: { email },
    });
    return { enrolled: false, fallbackTask: true, reason: 'sequence_disabled' };
  }

  return { enrolled: true, enrollmentId: enrollment.id };
}

/** Offer action → offer-pack sequence or Offer task. */
export function enrollOrSendOfferMail(args: {
  name: string;
  email?: string;
  prospectId?: string;
  leadId?: string;
  recordId?: string;
  lane?: LeadEngineLane;
}): MailEnrollResult {
  const email = (args.email || '').trim().toLowerCase();
  const leadKey = args.leadId || args.prospectId || args.recordId;
  if (!email || !leadKey || !mailCanAutopilot()) {
    createOfferTask({
      name: args.name,
      prospectId: args.prospectId,
      leadId: args.leadId,
      recordId: args.recordId,
      lane: args.lane,
    });
    return { enrolled: false, fallbackTask: true, reason: !email ? 'no_email' : 'needs_setup' };
  }

  const enrollment = enrollLeadInNurtureSequence({
    leadId: leadKey,
    sequenceId: SEQ_OFFER_PACK,
    tenantId: 'finely_cred',
    context: {
      email,
      fullName: args.name,
      prospectId: args.prospectId,
      leadId: args.leadId,
      recordId: args.recordId,
      lane: args.lane,
      source: 'marketing_desk_offer',
      funnelPath: '/pricing/business-credit',
      guideTitle: 'Partner offer pack',
    },
  });

  if (!enrollment) {
    createOfferTask({
      name: args.name,
      prospectId: args.prospectId,
      leadId: args.leadId,
      recordId: args.recordId,
      lane: args.lane,
    });
    return { enrolled: false, fallbackTask: true, reason: 'sequence_disabled' };
  }

  return { enrolled: true, enrollmentId: enrollment.id };
}

/** Booked confirm sequence (meeting invite is separate in handoff). */
export function enrollBookedConfirmMail(args: {
  leadId: string;
  email?: string;
  fullName?: string;
  recordId?: string;
}): MailEnrollResult {
  const email = (args.email || '').trim().toLowerCase();
  if (!email || !mailCanAutopilot()) {
    return { enrolled: false, reason: !email ? 'no_email' : 'needs_setup' };
  }

  const enrollment = enrollLeadInNurtureSequence({
    leadId: args.leadId,
    sequenceId: SEQ_BOOKED_CONFIRM,
    tenantId: 'finely_cred',
    context: {
      email,
      fullName: args.fullName,
      recordId: args.recordId,
      source: 'marketing_desk_booked',
      funnelPath: '/consultation',
      immediateWelcomeSent: false,
    },
  });

  return { enrolled: Boolean(enrollment), enrollmentId: enrollment?.id };
}

/** Inbound Board lead → welcome sequence when Mail Ready; else nurture to-do. */
export function enrollInboundWelcomeMail(args: {
  leadId: string;
  email?: string;
  fullName?: string;
  recordId?: string;
}): MailEnrollResult {
  const email = (args.email || '').trim().toLowerCase();
  if (!email || !mailCanAutopilot()) {
    if (args.leadId) {
      createMarketingTask({
        kind: 'nurture',
        title: `Inbound follow-up — ${args.fullName || email || 'lead'}`,
        prospectId: args.leadId,
        leadId: args.leadId,
        recordId: args.recordId,
        notes: email
          ? `Mail Needs setup or Paused. Manual welcome to ${email}.`
          : 'No email — add contact then enroll Mail on autopilot.',
        href: '/admin/marketing-desk?helper=board',
        meta: { email },
      });
    }
    return { enrolled: false, fallbackTask: true, reason: !email ? 'no_email' : 'needs_setup' };
  }

  const enrollment = enrollLeadInNurtureSequence({
    leadId: args.leadId,
    sequenceId: SEQ_INBOUND_WELCOME,
    tenantId: 'finely_cred',
    context: {
      email,
      fullName: args.fullName,
      recordId: args.recordId,
      source: 'marketing_desk_inbound',
      funnelPath: '/consultation',
    },
  });

  return { enrolled: Boolean(enrollment), enrollmentId: enrollment?.id };
}

/** Pause cold/nurture for a prospect or lead id (booked / trash). */
export function pauseMarketingSequencesForLead(leadId: string, reason = 'paused'): number {
  return cancelNurtureEnrollmentsForLead(leadId, reason);
}

/**
 * Stop-on-reply / bounce foundation — cancel active enrollments matching prospect email.
 * Called from webhook ingest/sync when reply/bounce events can be matched.
 */
export function pauseMarketingMailForEmail(
  email: string,
  reason: 'reply' | 'bounce' | 'complaint' | 'paused' = 'reply',
): { cancelled: number; prospectId?: string; email: string } {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { cancelled: 0, email: normalized };
  }
  let cancelled = cancelNurtureEnrollmentsForEmail(normalized, reason);
  const prospect = listProspects().find((p) =>
    (p.contact?.emails ?? []).some((e) => (e || '').trim().toLowerCase() === normalized),
  );
  if (prospect) {
    cancelled += pauseMarketingSequencesForLead(prospect.id, reason);
  }
  return { cancelled, prospectId: prospect?.id, email: normalized };
}

export function resolveEmailForProspect(prospectId: string): { email?: string; fullName?: string } {
  const p = getProspect(prospectId);
  if (!p) return {};
  return {
    email: p.contact?.emails?.[0],
    fullName: p.contact?.name || p.company?.name,
  };
}

export function resolveEmailForRecord(recordId: string): {
  email?: string;
  fullName?: string;
  leadId: string;
} {
  const r = getCrmRecord(recordId);
  if (!r) return { leadId: recordId };
  return {
    email: r.contact?.email,
    fullName: r.contact?.fullName || r.contact?.company,
    leadId: r.sourceRef?.id || r.id,
  };
}
