import type { PlatformEvent } from '../domain/platformEvents';
import type { AutomationTrigger } from '../domain/automationStudio';

/** Match platform events to automation trigger definitions (Phase 10). */
export function platformEventMatchesTrigger(
  event: PlatformEvent,
  trigger: AutomationTrigger,
): boolean {
  const t = trigger.type;

  if (t === 'manual' || t === 'interval') return false;

  if (t === 'funnel_signup') {
    if (event.type !== 'lead.created' && event.type !== 'lead.magnet_download') return false;
    const fid = trigger.funnelId;
    if (fid && event.entityId !== fid && event.payload?.funnelId !== fid) return false;
    return true;
  }

  if (t === 'funnel_session_booked') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'funnel_session_booked') return false;
    const fid = trigger.funnelId;
    if (fid && event.payload?.funnelId !== fid) return false;
    return true;
  }

  if (t === 'form_submit') {
    return event.type === 'lead.created' || event.type === 'funnel.step_completed';
  }

  if (t === 'library_open') {
    if (event.type !== 'library.opened' && event.type !== 'guide.downloaded') return false;
    if (trigger.bookSlug && event.entityId !== trigger.bookSlug) return false;
    return true;
  }

  if (t === 'voice_asset_rendered') {
    return event.type === 'guide.audio_played';
  }

  if (t === 'trial_expiring') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'trial_expiring';
  }

  if (t === 'billing_past_due') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'billing_past_due') return false;
    const min = trigger.daysSince ?? 0;
    const days = Number(event.payload?.daysSince ?? 0);
    return days >= min;
  }

  if (t === 'win_back') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'win_back') return false;
    const min = trigger.daysSinceExpiry ?? 0;
    const days = Number(event.payload?.daysSinceExpiry ?? 0);
    return days >= min;
  }

  if (t === 'purchase_completed') {
    if (event.type !== 'purchase.completed') return false;
    if (trigger.productType && event.payload?.productType !== trigger.productType) return false;
    return true;
  }

  if (t === 'task_created') {
    return event.type === 'task.created';
  }

  if (t === 'task_completed') {
    return event.type === 'task.completed';
  }

  if (t === 'task_result_recorded') {
    return event.type === 'task.result_recorded';
  }

  if (t === 'course_lesson_agent_run') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'course_lesson_agent_run') return false;
    if (trigger.courseId && event.payload?.courseId !== trigger.courseId) return false;
    return true;
  }

  if (t === 'task_overdue') {
    return event.type === 'task.overdue';
  }

  if (t === 'dispute_letter_mailed') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'dispute_letter_mailed';
  }

  if (t === 'lead_scored') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'lead_scored') return false;
    const min = trigger.minScore ?? 0;
    const score = Number(event.payload?.score ?? 0);
    if (score < min) return false;
    if (trigger.band && event.payload?.band !== trigger.band) return false;
    return true;
  }

  if (t === 'report_uploaded') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'report_uploaded';
  }

  if (t === 'dispute_evidence_ready') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'dispute_evidence_ready';
  }

  if (t === 'complaint_detected') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'complaint_detected';
  }

  if (t === 'meta_lead_form') {
    return event.type === 'lead.created' && event.payload?.source === 'meta';
  }

  if (t === 'meta_message_received') {
    if (event.type !== 'chat.message_received') return false;
    if (event.payload?.source !== 'meta' || event.payload?.direction !== 'inbound') return false;
    if (trigger.channel && event.payload?.channel !== trigger.channel) return false;
    return true;
  }

  if (t === 'webhook_inbound') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'webhook_inbound';
  }

  if (t === 'crm_record_created') {
    return event.type === 'automation.triggered' && event.payload?.kind === 'crm_record_created';
  }

  if (t === 'crm_stage_changed') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'crm_stage_changed') return false;
    if (trigger.stage && event.payload?.stage !== trigger.stage) return false;
    return true;
  }

  if (t === 'partner_stage_changed') {
    if (event.type !== 'automation.triggered' || event.payload?.kind !== 'partner_stage_changed') return false;
    if (trigger.stage && event.payload?.stage !== trigger.stage) return false;
    return true;
  }

  return false;
}
