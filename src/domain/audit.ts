export type AuditActorType = 'partner' | 'admin' | 'agent' | 'system';

export type AuditEvent = {
  id: string;
  createdAt: string;
  /** Tenant this event belongs to */
  tenantId: string;
  actorType: AuditActorType;
  /** User ID of the actor (Supabase auth or mock) */
  actorUserId?: string;
  actorEmail?: string;
  partnerId?: string;
  action: string; // e.g. 'case.created', 'letter.generated', 'document.downloaded'
  entityType?: string; // e.g. 'case', 'letter', 'evidence', 'partner'
  entityId?: string;
  meta?: Record<string, any>;
};

