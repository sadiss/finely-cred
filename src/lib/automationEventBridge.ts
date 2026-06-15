/** Bridges platform events to automation rules — preview logs + lightweight live actions (Phase 10). */
import { onPlatformEvent, type PlatformEvent } from '../domain/platformEvents';
import { listAutomationRules, addAutomationRun } from '../data/automationStudioRepo';
import { createNotification } from '../data/notificationsRepo';
import { platformEventMatchesTrigger } from './automationEventMatcher';
import { runEventScopedCommsActions } from './automationEventComms';
import { ruleHasLiveOpsActions, runEventScopedOpsActions } from './automationEventOps';
import { sendFunnelSessionConfirmationFromEvent } from './funnelSessionEmail';
import { dispatchAutomationRunner } from './serverAutomationClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { newId } from '../utils/ids';
import { nowIso } from '../domain/cases';

function runLightweightActions(rule: { id: string; name: string; actions: Array<{ type: string; title?: string; body?: string; personaId?: string; sequenceId?: string }> }, event: PlatformEvent) {
  for (const action of rule.actions) {
    if (action.type === 'notify_admin') {
      createNotification({
        audience: 'admin',
        kind: 'system',
        title: action.title ?? `Automation: ${rule.name}`,
        body: action.body ?? `Triggered by ${event.type}`,
        href: '/admin/automations',
        meta: { ruleId: rule.id, eventId: event.id },
      });
    }
    if (action.type === 'assign_agent_persona' && event.leadId) {
      createNotification({
        audience: 'admin',
        kind: 'system',
        title: 'Persona assigned to lead thread',
        body: `${action.personaId ?? 'agent'} · lead ${event.leadId}`,
        href: '/admin/leads',
      });
    }
  }
}

function handlePlatformEvent(event: PlatformEvent) {
  const autopilotLive = isFeatureEnabled('automationAutopilot');

  void dispatchAutomationRunner({
    eventType: event.type,
    payload: { ...(event.payload ?? {}), entityId: event.entityId, leadId: event.leadId, partnerId: event.partnerId },
    dryRun: !autopilotLive,
  });

  if (event.type === 'automation.triggered' && event.payload?.kind === 'funnel_session_booked') {
    void sendFunnelSessionConfirmationFromEvent(event);
  }

  const rules = listAutomationRules().filter((r) => r.enabled && r.trigger && r.trigger.type !== 'manual' && r.trigger.type !== 'interval');
  for (const rule of rules) {
    if (!platformEventMatchesTrigger(event, rule.trigger)) continue;

    const hasOps = ruleHasLiveOpsActions(rule);
    const hasComms = (rule.actions ?? []).some((a) => a.type === 'send_comms_template');
    const runMode = autopilotLive && (hasOps || hasComms) ? 'live' : 'dry_run';

    addAutomationRun({
      id: newId('run'),
      ruleId: rule.id,
      mode: runMode,
      startedAt: nowIso(),
      finishedAt: nowIso(),
      summary: `Event matched: ${event.type} → ${rule.name}`,
      actions: [{ type: 'info', message: `Rule "${rule.name}" matched platform event ${event.type}`, meta: { eventId: event.id } }],
    });

    if (!hasOps) {
      runLightweightActions(rule as any, event);
    }

    if (event.partnerId && hasComms) {
      void runEventScopedCommsActions(rule, event, { dryRun: !autopilotLive }).then((res) => {
        if (res.sent || res.messages.length) {
          addAutomationRun({
            id: newId('run'),
            ruleId: rule.id,
            mode: runMode,
            startedAt: nowIso(),
            finishedAt: nowIso(),
            summary: `Event comms: ${res.sent} sent, ${res.skipped} skipped`,
            actions: res.messages.map((m) => ({ type: 'info' as const, message: m })),
          });
        }
      });
    }

    if (hasOps) {
      void runEventScopedOpsActions(rule, event, { dryRun: !autopilotLive }).then((res) => {
        if (res.skipped && !res.messages.length) return;
        addAutomationRun({
          id: newId('run'),
          ruleId: rule.id,
          mode: res.mode,
          startedAt: nowIso(),
          finishedAt: nowIso(),
          summary: `Event ops (${res.mode}): ${res.messages.length} action(s)`,
          actions: res.messages.map((m) => ({ type: 'info' as const, message: m })),
        });
      });
    }
  }
}

let wired = false;

export function wireAutomationEventBridge() {
  if (wired || typeof window === 'undefined') return;
  wired = true;
  onPlatformEvent(handlePlatformEvent);
}

if (typeof window !== 'undefined') {
  wireAutomationEventBridge();
}
