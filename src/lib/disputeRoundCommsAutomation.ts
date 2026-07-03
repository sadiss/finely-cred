import type { DisputeCase } from '../domain/cases';
import type { DisputeRoundLabel } from '../domain/disputeWorkflow';
import { getCommsTemplate } from '../data/commsRepo';
import { listPartnersLocal } from '../data/partnersRepo';
import { recordDisputeCaseAction } from '../data/disputeWorkflowRepo';
import { ensureProfessionalCommsTemplatesOnce } from '../data/commsProfessionalTemplateSeed';
import {
  isDisputeRoundCommsAutoEnabled,
  isDisputeRoundCommsLive,
} from '../data/commsEmailProviderRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { sendEmailFromTemplate, sendPortalFromTemplate, sendSmsFromTemplate } from './commsEngine';

export type DisputeCommsEvent = 'round_mailed' | 'response_received';

type TemplateBundle = { email?: string; sms?: string; portal?: string };

const MAILED_TEMPLATES: Record<DisputeRoundLabel, TemplateBundle> = {
  'Round 1': { email: 'tpl_dispute_r1_mailed', sms: 'sms_dispute_r1_mailed' },
  'Round 2': { email: 'tpl_dispute_r2_ready', sms: 'sms_round2_ready' },
  'Round 3': { email: 'tpl_dispute_r3_escalation_path', sms: 'sms_dispute_deadline_7d' },
  'Round 4': { email: 'tpl_dispute_r4_final_push', sms: 'sms_response_received' },
};

const RESPONSE_TEMPLATES: Record<DisputeRoundLabel, TemplateBundle> = {
  'Round 1': { email: 'tpl_dispute_r1_response_received', sms: 'sms_response_received' },
  'Round 2': { email: 'tpl_dispute_r2_ready', sms: 'sms_response_received' },
  'Round 3': { email: 'tpl_dispute_r3_escalation_path', sms: 'sms_complaint_filed' },
  'Round 4': { email: 'tpl_dispute_r4_final_push', sms: 'sms_response_received' },
};

function resolveDryRun(): boolean {
  if (!isFeatureEnabled('commsDelivery')) return true;
  if (!isDisputeRoundCommsLive()) return true;
  return false;
}

export async function runDisputeRoundCommsAutomation(args: {
  event: DisputeCommsEvent;
  disputeCase: DisputeCase;
  round: DisputeRoundLabel;
  notes?: string;
}): Promise<{ sent: number; errors: string[] }> {
  if (!isDisputeRoundCommsAutoEnabled()) {
    return { sent: 0, errors: [] };
  }

  ensureProfessionalCommsTemplatesOnce();
  const partner = listPartnersLocal().find((p) => p.id === args.disputeCase.partnerId);
  if (!partner) return { sent: 0, errors: ['Partner not found for comms automation'] };

  const bundle = args.event === 'round_mailed' ? MAILED_TEMPLATES[args.round] : RESPONSE_TEMPLATES[args.round];
  const dryRun = resolveDryRun();
  const ctx = {
    caseId: args.disputeCase.id,
    caseTitle: args.disputeCase.title,
    round: args.round,
    notes: args.notes ?? '',
    links: {
      disputes: `/portal/disputes/${encodeURIComponent(args.disputeCase.id)}`,
      letters: '/portal/letters',
      documents: '/portal/documents',
      portal: '/portal',
      messages: '/portal/messages?hub=team',
    },
  };

  let sent = 0;
  const errors: string[] = [];

  const attempts: Array<{ channel: 'email' | 'sms' | 'portal'; templateId?: string }> = [
    { channel: 'email', templateId: bundle.email },
    { channel: 'sms', templateId: bundle.sms },
    { channel: 'portal', templateId: bundle.portal },
  ];

  for (const { channel, templateId } of attempts) {
    if (!templateId) continue;
    const tpl = getCommsTemplate(templateId);
    if (!tpl?.enabled) continue;
    try {
      const res =
        channel === 'portal'
          ? sendPortalFromTemplate({ template: tpl, partner, ctx, dryRun })
          : channel === 'email'
            ? await sendEmailFromTemplate({ template: tpl, partner, ctx, dryRun })
            : await sendSmsFromTemplate({ template: tpl, partner, ctx, dryRun });
      if (res.ok) sent += 1;
      else if (res.log.error) errors.push(`${channel}: ${res.log.error}`);
    } catch (e: unknown) {
      errors.push(`${channel}: ${(e as Error)?.message ?? 'send failed'}`);
    }
  }

  if (sent > 0 || errors.length) {
    recordDisputeCaseAction({
      caseId: args.disputeCase.id,
      partnerId: args.disputeCase.partnerId,
      round: args.round,
      type: 'note',
      title: `Comms automation — ${args.event.replace(/_/g, ' ')}`,
      body: [
        `${sent} message(s) ${dryRun ? 'dry-run logged' : 'sent'} for ${args.round}.`,
        errors.length ? `Errors: ${errors.join('; ')}` : '',
      ]
        .filter(Boolean)
        .join(' '),
      createdBy: 'system',
      href: '/admin/comms?room=inbox',
    });
  }

  return { sent, errors };
}
