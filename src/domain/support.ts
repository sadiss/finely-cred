export type SupportTopic =
  | 'general'
  | 'billing'
  | 'disputes'
  | 'documents'
  | 'debt_summons'
  | 'identity_theft'
  | 'business'
  | 'au'
  | 'credit_specialist_program'
  | 'affiliate_program'
  | 'other';

export type SupportThreadStatus = 'new' | 'triaged' | 'waiting_on_partner' | 'waiting_on_team' | 'resolved' | 'closed';

export type SupportAttachment = {
  /** Evidence ID (Documents Vault item) */
  evidenceId: string;
};

export type SupportMessage = {
  id: string;
  threadId: string;
  partnerId: string;
  topic: SupportTopic;
  fromPartner: boolean;
  createdAt: string;
  subject?: string;
  body: string;
  attachments?: SupportAttachment[];
};

export type SupportThreadKind = 'general' | 'direct' | 'team';

export type SupportThread = {
  id: string;
  partnerId: string;
  topic: SupportTopic;
  subject: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  /** Direct message vs multi-person team thread */
  threadKind?: SupportThreadKind;
  /** Finely team contact ids (see teamContacts) invited on this thread */
  participantIds?: string[];
  /** Optional linkage for flow-driven support */
  relatedCaseId?: string;
  relatedLetterId?: string;
  relatedReportId?: string;
  /** ISO — first staff reply (SLA tracking). */
  firstResponseAt?: string;
  /** ISO — SLA deadline for first response (default 4 business hours from create). */
  slaDueAt?: string;
  /** Agent persona assigned for AI-assisted replies. */
  assignedPersonaId?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

