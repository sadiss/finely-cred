import React from 'react';
import type { Partner } from '../../domain/partners';
import type { IngestUploadResult } from '../../lib/ingestUploadedEvidence';
import { SmartProofUploader } from './SmartProofUploader';

type Props = {
  partner: Partner;
  email?: string;
  compact?: boolean;
  onUploaded?: () => void;
};

/** @deprecated Use SmartProofUploader directly — kept for dashboard compatibility. */
export function ProofDocumentsHub({ partner, email, compact, onUploaded }: Props) {
  const handleUploaded = (_result: IngestUploadResult) => {
    onUploaded?.();
  };

  return (
    <SmartProofUploader
      partner={partner}
      email={email}
      compact={compact}
      uploadContext="general"
      onUploaded={handleUploaded}
    />
  );
}
