/** Formal escalation / complaint from partner. */
export type EscalationTopic =
  | 'billing'
  | 'service'
  | 'dispute_process'
  | 'documents_access'
  | 'legal_letters'
  | 'other';

export type EscalationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type EscalationStatus = 'open' | 'in_review' | 'pending_partner' | 'resolved' | 'closed';

export type PartnerEscalation = {
  id: string;
  partnerId: string;
  topic: EscalationTopic;
  title: string;
  description: string;
  priority: EscalationPriority;
  status: EscalationStatus;
  createdAt: string;
  updatedAt: string;
  /** Linked dispute case (when escalation is about dispute process) */
  caseId?: string;
  disputeRound?: 'Round 1' | 'Round 2' | 'Round 3';
  /** Admin response or resolution note (when status is resolved/closed) */
  resolutionNote?: string;
};
