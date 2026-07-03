import React from 'react';
import type { Partner } from '../../domain/partners';
import { SmartProofUploader } from '../evidence/SmartProofUploader';
import { finelyOsCatalogCardCompact } from '../../features/os/finelyOsLightUi';

export function DebtProofCaptureStrip({
  partner,
  debtCaseId,
  bankruptcyCaseId,
  accent = 'emerald',
  uploadContext = 'debt',
}: {
  partner: Partner;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
  accent?: 'emerald' | 'fuchsia' | 'sky' | 'amber' | 'rose';
  uploadContext?: 'debt' | 'foreclosure' | 'repossession' | 'bankruptcy' | 'validation' | 'court';
}) {
  const ctx =
    uploadContext === 'foreclosure'
      ? 'foreclosure'
      : uploadContext === 'repossession'
        ? 'repossession'
        : uploadContext === 'bankruptcy'
          ? 'bankruptcy'
          : 'debt';

  return (
    <div
      className={finelyOsCatalogCardCompact(
        accent === 'fuchsia'
          ? 'fuchsia'
          : accent === 'sky'
            ? 'sky'
            : accent === 'amber'
              ? 'amber'
              : accent === 'rose'
                ? 'rose'
                : 'emerald',
      )}
    >
      <SmartProofUploader
        partner={partner}
        email={partner.profile.email}
        debtCaseId={debtCaseId}
        bankruptcyCaseId={bankruptcyCaseId}
        uploadContext={ctx}
        compact
      />
    </div>
  );
}
