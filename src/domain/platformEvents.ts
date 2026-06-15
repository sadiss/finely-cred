/** Unified platform event bus — spine for automations, nurture, agents, and analytics. */

export type PlatformEventType =
  | 'lead.created'
  | 'lead.magnet_download'
  | 'guide.downloaded'
  | 'guide.audio_played'
  | 'funnel.step_completed'
  | 'email.sent'
  | 'email.opened'
  | 'task.created'
  | 'task.started'
  | 'task.completed'
  | 'task.overdue'
  | 'task.result_recorded'
  | 'project.outcome_achieved'
  | 'automation.triggered'
  | 'social.post_published'
  | 'chat.message_received'
  | 'lead.created'
  | 'purchase.completed'
  | 'library.opened';

export type PlatformEvent = {
  id: string;
  type: PlatformEventType;
  tenantId: string;
  entityType?: string;
  entityId?: string;
  leadId?: string;
  partnerId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

type PlatformEventListener = (event: PlatformEvent) => void;

const listeners = new Set<PlatformEventListener>();
const recentEvents: PlatformEvent[] = [];
const MAX_RECENT = 200;

function newEventId() {
  return `pev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emitPlatformEvent(
  partial: Omit<PlatformEvent, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): PlatformEvent {
  const event: PlatformEvent = {
    id: partial.id ?? newEventId(),
    createdAt: partial.createdAt ?? new Date().toISOString(),
    type: partial.type,
    tenantId: partial.tenantId,
    entityType: partial.entityType,
    entityId: partial.entityId,
    leadId: partial.leadId,
    partnerId: partial.partnerId,
    payload: partial.payload,
  };
  recentEvents.unshift(event);
  if (recentEvents.length > MAX_RECENT) recentEvents.pop();
  for (const fn of listeners) {
    try {
      fn(event);
    } catch {
      // listener errors must not break emitters
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finely:platform-event', { detail: event }));
  }
  return event;
}

export function onPlatformEvent(listener: PlatformEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentPlatformEvents(limit = 50): PlatformEvent[] {
  return recentEvents.slice(0, limit);
}

export function emitGuideDownloaded(args: {
  tenantId: string;
  guideId: string;
  guideTitle: string;
  leadId?: string;
  email?: string;
}) {
  return emitPlatformEvent({
    type: 'guide.downloaded',
    tenantId: args.tenantId,
    entityType: 'guide',
    entityId: args.guideId,
    leadId: args.leadId,
    payload: { guideTitle: args.guideTitle, email: args.email },
  });
}

export function emitGuideAudioPlayed(args: {
  tenantId: string;
  guideId: string;
  source: 'studio' | 'browser_preview';
}) {
  return emitPlatformEvent({
    type: 'guide.audio_played',
    tenantId: args.tenantId,
    entityType: 'guide',
    entityId: args.guideId,
    payload: { source: args.source },
  });
}

export function emitLeadMagnetDownload(args: {
  tenantId: string;
  leadId: string;
  funnelId: string;
  guideId?: string;
  email?: string;
}) {
  return emitPlatformEvent({
    type: 'lead.magnet_download',
    tenantId: args.tenantId,
    entityType: 'funnel',
    entityId: args.funnelId,
    leadId: args.leadId,
    payload: { guideId: args.guideId, email: args.email },
  });
}

export function emitFunnelStepCompleted(args: {
  tenantId: string;
  funnelId: string;
  step: string;
  leadId?: string;
  payload?: Record<string, unknown>;
}) {
  return emitPlatformEvent({
    type: 'funnel.step_completed',
    tenantId: args.tenantId,
    entityType: 'funnel',
    entityId: args.funnelId,
    leadId: args.leadId,
    payload: { step: args.step, ...args.payload },
  });
}

export function emitLeadCreated(args: {
  tenantId: string;
  leadId: string;
  funnelId?: string;
  email?: string;
  payload?: Record<string, unknown>;
}) {
  return emitPlatformEvent({
    type: 'lead.created',
    tenantId: args.tenantId,
    entityType: 'lead',
    entityId: args.leadId,
    leadId: args.leadId,
    payload: { funnelId: args.funnelId, email: args.email, ...args.payload },
  });
}

export function emitPurchaseCompleted(args: {
  tenantId: string;
  partnerId: string;
  productType: 'book' | 'package' | 'tradeline';
  productId: string;
  amountCents?: number;
  payload?: Record<string, unknown>;
}) {
  return emitPlatformEvent({
    type: 'purchase.completed',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: args.productType,
    entityId: args.productId,
    payload: { amountCents: args.amountCents, ...args.payload },
  });
}

export function emitLibraryOpened(args: {
  tenantId: string;
  partnerId: string;
  bookSlug: string;
  mode?: 'read' | 'listen';
}) {
  return emitPlatformEvent({
    type: 'library.opened',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'book',
    entityId: args.bookSlug,
    payload: { mode: args.mode ?? 'read', surface: 'library' },
  });
}

export function emitTaskCreated(args: {
  tenantId: string;
  partnerId: string;
  taskId: string;
  title: string;
  projectId?: string;
}) {
  return emitPlatformEvent({
    type: 'task.created',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'task',
    entityId: args.taskId,
    payload: { title: args.title, projectId: args.projectId },
  });
}

export function emitTaskStarted(args: { tenantId: string; partnerId: string; taskId: string }) {
  return emitPlatformEvent({
    type: 'task.started',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'task',
    entityId: args.taskId,
  });
}

export function emitTaskCompleted(args: {
  tenantId: string;
  partnerId: string;
  taskId: string;
  actualResult?: string;
}) {
  return emitPlatformEvent({
    type: 'task.completed',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'task',
    entityId: args.taskId,
    payload: { actualResult: args.actualResult },
  });
}

export function emitTaskResultRecorded(args: {
  tenantId: string;
  partnerId: string;
  taskId: string;
  actualResult: string;
  projectId?: string;
}) {
  return emitPlatformEvent({
    type: 'task.result_recorded',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'task',
    entityId: args.taskId,
    payload: { actualResult: args.actualResult, projectId: args.projectId },
  });
}

export function emitProjectOutcomeAchieved(args: {
  tenantId: string;
  partnerId: string;
  projectId: string;
  outcomeId: string;
  label: string;
}) {
  return emitPlatformEvent({
    type: 'project.outcome_achieved',
    tenantId: args.tenantId,
    partnerId: args.partnerId,
    entityType: 'project',
    entityId: args.projectId,
    payload: { outcomeId: args.outcomeId, label: args.label },
  });
}
