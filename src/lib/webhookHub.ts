import { dispatchWebhooksForEvent, seedDefaultWebhookEndpoints } from '../data/webhooksRepo';
import { onPlatformEvent, type PlatformEvent } from '../domain/platformEvents';

const WEBHOOK_EVENT_TYPES = new Set([
  'lead.created',
  'purchase.completed',
  'automation.triggered',
  'task.created',
  'task.completed',
  'task.overdue',
]);

function handleWebhookDispatch(event: PlatformEvent) {
  if (!WEBHOOK_EVENT_TYPES.has(event.type)) return;
  dispatchWebhooksForEvent(event.type, {
    id: event.id,
    type: event.type,
    tenantId: event.tenantId,
    partnerId: event.partnerId,
    leadId: event.leadId,
    payload: event.payload,
    createdAt: event.createdAt,
  });
}

let wired = false;

export function wireWebhookHub() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  seedDefaultWebhookEndpoints();
  onPlatformEvent(handleWebhookDispatch);
}

if (typeof window !== 'undefined') {
  wireWebhookHub();
}
