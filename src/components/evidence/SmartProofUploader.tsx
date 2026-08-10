import React from 'react';
import type { Partner } from '../../domain/partners';
import type { DebtCase } from '../../domain/debt';
import type { IngestUploadResult } from '../../lib/ingestUploadedEvidence';
import { UnifiedEvidenceCapture } from './UnifiedEvidenceCapture';

type Props = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  disputeCaseId?: string;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
  debt?: DebtCase | null;
  onDebtChange?: (d: DebtCase) => void;
  onUploaded?: (result: IngestUploadResult) => void;
  uploadContext?: 'general' | 'bureau' | 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy';
  /** Default true — scrape intel panel beside the capture deck. */
  enableScrape?: boolean;
};

/**
 * Backward-compatible entry point → {@link UnifiedEvidenceCapture}.
 * Prefer importing UnifiedEvidenceCapture for new surfaces.
 */
export function SmartProofUploader({
  partner,
  email,
  compact,
  disputeCaseId,
  debtCaseId,
  bankruptcyCaseId,
  debt,
  onDebtChange,
  onUploaded,
  uploadContext = 'general',
  enableScrape = true,
}: Props) {
  return (
    <UnifiedEvidenceCapture
      partner={partner}
      email={email}
      compact={compact}
      disputeCaseId={disputeCaseId}
      debtCaseId={debtCaseId}
      bankruptcyCaseId={bankruptcyCaseId}
      debt={debt}
      onDebtChange={onDebtChange}
      onUploaded={onUploaded}
      uploadContext={uploadContext}
      enableScrape={enableScrape}
    />
  );
}
