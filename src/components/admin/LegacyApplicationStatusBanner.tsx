import React from 'react';
import type { Partner } from '../../domain/partners';
import { LEGACY_APPLICATION_STATUS_LABELS } from '../../lib/legacySqlParser';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

type Props = {
  partner: Partner;
  className?: string;
};

export function LegacyApplicationStatusBanner({ partner, className }: Props) {
  const signals = partner.journeySignals ?? {};
  const legacyStatus = Number(signals.legacyApplicationStatus ?? 0);
  if (!legacyStatus || legacyStatus < 1) return null;

  const label =
    (signals.legacyApplicationStatusLabel as string | undefined) ??
    LEGACY_APPLICATION_STATUS_LABELS[legacyStatus] ??
    `Legacy step ${legacyStatus}`;

  return (
    <FinelyOsAlertBanner
      tone="info"
      className={className}
      message={`Legacy Laravel journey — step ${legacyStatus}/12: ${label}. Mapped to Finely stage “${partner.journeyStage ?? 'intake'}”.`}
    />
  );
}
