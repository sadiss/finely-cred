import type { Bureau } from './creditReports';
import type { BusinessBureau } from './businessCredit';

export type LetterType = 'dispute' | 'validation' | 'court';

export type LetterStatus =
  | 'generated'
  | 'mail_pending'
  | 'mail_failed'
  | 'mailed'
  | 'waiting_response'
  | 'completed';

export type DisputeLetterMeta = {
  bureau: Bureau;
  round: string;
  tone: 'formal' | 'neutral' | 'conversational';
  /** Optional override for the opening paragraphs (editable draft). */
  introOverride?: string;
  /** Optional override for the closing/footer block (editable draft). */
  footerOverride?: string;
  candidateIds: string[];
  evidenceByCandidateId: Record<string, string | undefined>;
  reasonsByCandidateId: Record<string, string[]>;
  /** Optional AI narratives keyed by candidateId (SelectedDispute.key). */
  aiNarrativeByCandidateKey?: Record<string, string>;
  /** Optional AI follow-up questions shown during drafting. */
  aiQuestions?: string[];
};

export type BusinessDisputeLetterMeta = {
  /** Source module/context (business bureau dispute workflow). */
  context: 'business_dispute';
  bureauKind: 'business';
  businessBureau: BusinessBureau;
  businessDisputeId: string;
};

export type ValidationLetterMeta = {
  /** Source module/context (ex: debt case / DV workflow). */
  context: 'debt';
  debtId?: string;
  letterSpecId?: string;
  scenario?: string;
} | {
  /** Template library export saved as a partner-owned letter. */
  context: 'template';
  templateBaseId: string;
  templateVariantId: string;
  templateTone: string;
  templateVersion: number;
  templateCategory?: string;
};

export type CourtLetterMeta = {
  context: 'debt';
  debtId?: string;
  letterSpecId?: string;
  scenario?: string;
  courtCaseNumber?: string;
  jurisdictionState?: string;
} | {
  /** Template library export saved as a partner-owned letter. */
  context: 'template';
  templateBaseId: string;
  templateVariantId: string;
  templateTone: string;
  templateVersion: number;
  templateCategory?: string;
};

export type LetterMeta = DisputeLetterMeta | BusinessDisputeLetterMeta | ValidationLetterMeta | CourtLetterMeta;

export type LetterRecord = {
  id: string;
  partnerId: string;
  type: LetterType;
  title: string;
  createdAt: string;
  /** Partner-safe archive (undoable). */
  archivedAt?: string | null;
  body: string;
  status?: LetterStatus;
  /** Stored PDF artifact for the vault (BlobStore ref). */
  pdfBlobRef?: string;
  pdfFilename?: string;
  /** Optional mailing metadata (in-app mail integration). */
  mailing?: {
    /** White-label mail provider id (always Finely-branded in UI). */
    provider: 'finely' | 'lob';
    /** Provider letter id (available once sent). */
    providerId?: string;
    createdAt: string;
    expectedDeliveryDate?: string;
    /** Provider status snapshot (best-effort). */
    status?: string;
    /** Last error (for failed attempts). */
    lastError?: string;
    to: { name: string; addressLine1: string; addressLine2?: string; city: string; state: string; zip: string };
    from: { name: string; addressLine1: string; addressLine2?: string; city: string; state: string; zip: string };
  };
  relatedReportId?: string;
  relatedEvidenceIds?: string[];
  meta?: LetterMeta;
};

