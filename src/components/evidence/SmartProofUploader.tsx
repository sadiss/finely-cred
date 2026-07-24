import React from 'react';
import type { Partner } from '../../domain/partners';
import type { IngestUploadResult } from '../../lib/ingestUploadedEvidence';
import { UnifiedEvidenceCapture } from './UnifiedEvidenceCapture';

type Props = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  disputeCaseId?: string;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
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
      onUploaded={onUploaded}
      uploadContext={uploadContext}
      enableScrape={enableScrape}
    />
  );
}
