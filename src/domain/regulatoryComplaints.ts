export type RegulatoryBody = 'CFPB' | 'AG' | 'FTC' | 'BBB';

export type RegulatoryTargetType = 'bureau' | 'furnisher' | 'collector' | 'other';

export type RegulatoryComplaintStatus = 'draft' | 'submitted' | 'in_review' | 'resolved' | 'closed';

export type RegulatoryComplaint = {
  id: string;
  partnerId: string;
  createdAt: string;
  updatedAt: string;

  status: RegulatoryComplaintStatus;

  body: RegulatoryBody;
  targetType: RegulatoryTargetType;
  targetName: string;

  /** Optional linkage */
  caseId?: string;
  reportId?: string;
  disputeRound?: 'Round 1' | 'Round 2' | 'Round 3';

  /** Narrative draft (partner-authored). */
  narrative: string;

  /** Evidence attachments (Evidence Vault item ids). */
  evidenceIds: string[];

  /** Submission info */
  submittedAt?: string;
  referenceNumber?: string;
  submissionMethod?: 'online' | 'mail' | 'phone' | 'other';

  /** Response / resolution notes */
  outcomeNote?: string;
};

