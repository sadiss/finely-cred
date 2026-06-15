import { createTask, listTasksByPartner } from '../data/tasksRepo';
import { emitPlatformEvent } from '../domain/platformEvents';

/** Debt funnel onboarding — intake task before first case is added. */
export function onDebtLaneBootstrap(args: { partnerId: string; funnelId?: string; leadId?: string }) {
  const tag = 'debt_lane:intake';
  const existing = listTasksByPartner(args.partnerId).some(
    (t) => (t.tags ?? []).includes(tag) && t.status !== 'completed',
  );
  if (!existing) {
    createTask({
      partnerId: args.partnerId,
      title: 'Debt OS intake: list collectors & summons items',
      kind: 'general',
      stage: 'intake',
      status: 'pending',
      notes:
        'Casey (Debt Strategist): Add each collection or summons as a case in Debt & Summons Center. Request validation in writing before paying or admitting debt.',
      assignedTo: 'partner',
      tags: [tag, 'persona:debt_strategist', `funnel:${args.funnelId ?? 'debt_freedom'}`],
    });
  }

  emitPlatformEvent({
    type: 'automation.triggered',
    tenantId: 'finely_cred',
    partnerId: args.partnerId,
    leadId: args.leadId,
    payload: { kind: 'debt_lane_bootstrapped', funnelId: args.funnelId ?? 'debt_freedom' },
  });
}
