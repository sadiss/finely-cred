import React from 'react';
import type { EvidenceItem } from '../../domain/evidence';
import { EvidenceVaultTiles } from './EvidenceVaultTiles';

/** Compact evidence grid — delegates to EvidenceVaultTiles (KPI-style tiles). */
export function EvidenceList({
  items,
  onDelete,
  onUpsert,
}: {
  items: EvidenceItem[];
  onDelete: (id: string) => void;
  onUpsert?: (item: EvidenceItem) => void;
}) {
  return <EvidenceVaultTiles items={items} onDelete={onDelete} onUpsert={onUpsert} />;
}
