import type { CrmRecordStage } from '../domain/crmRecords';
import type { PartnerJourneyStage } from '../domain/partners';
import { emitPlatformEvent } from '../domain/platformEvents';
import { FINELY_TENANT_ID } from '../domain/tenants';

/** Emit when a CRM record moves pipeline stage (Phase 14). */
export function emitCrmStageChanged(args: {
  recordId: string;
  previousStage: CrmRecordStage;
  stage: CrmRecordStage;
  target?: string;
  kind?: string;
  leadId?: string;
  score?: number;
}): void {
  if (args.previousStage === args.stage) return;
  try {
    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: FINELY_TENANT_ID,
      leadId: args.leadId,
      entityType: 'crm_record',
      entityId: args.recordId,
      payload: {
        kind: 'crm_stage_changed',
        previousStage: args.previousStage,
        stage: args.stage,
        target: args.target,
        recordKind: args.kind,
        score: args.score,
      },
    });
  } catch {
    // non-blocking
  }
}

/** Emit when a partner journey stage advances (Phase 14). */
export function emitPartnerStageChanged(args: {
  partnerId: string;
  previousStage?: PartnerJourneyStage;
  stage: PartnerJourneyStage;
  reason?: string;
}): void {
  if (args.previousStage === args.stage) return;
  try {
    emitPlatformEvent({
      type: 'automation.triggered',
      tenantId: FINELY_TENANT_ID,
      partnerId: args.partnerId,
      entityType: 'partner',
      entityId: args.partnerId,
      payload: {
        kind: 'partner_stage_changed',
        previousStage: args.previousStage,
        stage: args.stage,
        reason: args.reason,
      },
    });
  } catch {
    // non-blocking
  }
}
