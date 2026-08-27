import React from 'react';
import type { EvidenceItem } from '../../domain/evidence';
import { EvidenceVaultTiles } from './EvidenceVaultTiles';

/** Compact evidence grid — delegates to EvidenceVaultTiles (KPI-style tiles). */
export function EvidenceList({
  items,
  onDelete,
  onUpsert,
  showMailReview,
  needsMailReview,
  onApproveForMail,
}: {
  items: EvidenceItem[];
  onDelete: (id: string) => void;
  onUpsert?: (item: EvidenceItem) => void;
  showMailReview?: boolean;
  needsMailReview?: (item: EvidenceItem) => boolean;
  onApproveForMail?: (item: EvidenceItem) => void;
}) {
  return (
    <EvidenceVaultTiles
      items={items}
      onDelete={onDelete}
      onUpsert={onUpsert}
      showMailReview={showMailReview}
      needsMailReview={needsMailReview}
      onApproveForMail={onApproveForMail}
    />
  );
}
