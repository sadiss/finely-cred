export type SupportTopic =
  | 'general'
  | 'billing'
  | 'disputes'
  | 'documents'
  | 'debt_summons'
  | 'identity_theft'
  | 'business'
  | 'au'
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

export type SupportThread = {
  id: string;
  partnerId: string;
  topic: SupportTopic;
  subject: string;
  status: SupportThreadStatus;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  /** Optional linkage for flow-driven support */
  relatedCaseId?: string;
  relatedLetterId?: string;
  relatedReportId?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

