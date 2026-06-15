import type { CommsTemplate } from '../domain/comms';
import { getCommsTemplate, upsertCommsTemplate } from './commsRepo';

export const FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID = 'funnel_session_confirmation';

const FUNNEL_SESSION_TEMPLATE: CommsTemplate = {
  id: FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID,
  name: 'Funnel session request confirmation',
  channel: 'email',
  enabled: true,
  subjectTemplate: 'We received your strategy call request',
  bodyTemplate: `Hi {{firstName}},

Thanks for booking a strategy call with Finely Cred.

Preferred time: {{slotLabel}}
Focus area: {{focus}}

{{paymentNote}}

Our team will confirm your calendar invite shortly. Reply to this email if you need to adjust your time.

— {{agentName}}
Educational only · not legal advice`,
  tags: ['funnel', 'calendar', 'automation'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** Seed funnel session confirmation template (Phase 11/12). */
export function ensureFunnelSessionCommsTemplates(): number {
  if (getCommsTemplate(FUNNEL_SESSION_CONFIRMATION_TEMPLATE_ID)) return 0;
  upsertCommsTemplate(FUNNEL_SESSION_TEMPLATE);
  return 1;
}
