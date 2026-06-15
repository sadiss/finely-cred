import { addAuditEvent } from '../data/auditRepo';
import type { AuditActorType } from '../domain/audit';

export type SecurityAuditArgs = {
  action: string;
  actorType?: AuditActorType;
  actorUserId?: string;
  actorEmail?: string;
  partnerId?: string;
  entityType?: string;
  entityId?: string;
  tenantId?: string;
  meta?: Record<string, unknown>;
};

/** Record security-sensitive actions for admin audit trail (Phase 39). */
export function recordSecurityAudit(args: SecurityAuditArgs) {
  return addAuditEvent({
    actorType: args.actorType ?? 'system',
    actorUserId: args.actorUserId,
    actorEmail: args.actorEmail,
    partnerId: args.partnerId,
    action: args.action,
    entityType: args.entityType,
    entityId: args.entityId,
    tenantId: args.tenantId,
    meta: args.meta,
  });
}
