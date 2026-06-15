/** Event-scoped comms for billing/dunning automations (Phase 30 + 10). */
import type { AutomationRule } from '../domain/automationStudio';
import type { PlatformEvent } from '../domain/platformEvents';
import { getPartner } from '../data/partnersRepo';
import { getCommsTemplate, hasRecentCommsSend } from '../data/commsRepo';
import { sendEmailFromTemplate, sendPortalFromTemplate } from './commsEngine';
import { isFeatureEnabled } from '../data/settingsRepo';
import { buildMessageContext } from '../comms/buildMessageContext';

export type EventCommsResult = { sent: number; skipped: number; messages: string[] };

export async function runEventScopedCommsActions(
  rule: AutomationRule,
  event: PlatformEvent,
  opts?: { dryRun?: boolean },
): Promise<EventCommsResult> {
  const dryRun = opts?.dryRun ?? !isFeatureEnabled('commsDelivery');
  const partnerId = event.partnerId;
  if (!partnerId) return { sent: 0, skipped: 0, messages: ['No partnerId on event'] };

  const partner = await getPartner(partnerId);
  if (!partner) return { sent: 0, skipped: 0, messages: ['Partner not found'] };

  let sent = 0;
  let skipped = 0;
  const messages: string[] = [];
  const ctx = buildMessageContext({
    partner,
    extra: {
      daysSince: event.payload?.daysSince,
      daysSinceExpiry: event.payload?.daysSinceExpiry,
      portalBillingUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/billing`,
    },
  });

  for (const action of rule.actions ?? []) {
    if (action.type !== 'send_comms_template') continue;
    const tpl = getCommsTemplate(action.templateId);
    if (!tpl?.enabled) {
      skipped += 1;
      messages.push(`Template missing/disabled: ${action.templateId}`);
      continue;
    }
    const dedupeH = action.dedupeWithinHours ?? 48;
    if (dedupeH > 0 && hasRecentCommsSend({ templateId: tpl.id, partnerId, withinHours: dedupeH })) {
      skipped += 1;
      messages.push(`Deduped ${tpl.id}`);
      continue;
    }
    const channel = action.channel ?? tpl.channel;
    if (channel === 'email') {
      const res = await sendEmailFromTemplate({ template: tpl, partner, ctx, dryRun });
      messages.push(res.ok ? `Email ${dryRun ? 'dry' : 'sent'}: ${tpl.id}` : `Email failed: ${tpl.id}`);
      if (res.ok) sent += 1;
    } else if (channel === 'portal') {
      const res = sendPortalFromTemplate({ template: tpl, partner, ctx, dryRun });
      messages.push(res.ok ? `Portal ${dryRun ? 'dry' : 'sent'}: ${tpl.id}` : `Portal failed: ${tpl.id}`);
      if (res.ok) sent += 1;
    }
  }

  return { sent, skipped, messages };
}
