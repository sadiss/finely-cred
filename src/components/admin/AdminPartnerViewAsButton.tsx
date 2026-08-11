import React from 'react';
import { ExternalLink } from 'lucide-react';
import { openPortalAsPartner } from '../../lib/adminPartnerViewAs';
import { FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

type Props = {
  partnerId: string;
  label?: string;
  className?: string;
  portalPath?: string;
};

export function AdminPartnerViewAsButton({
  partnerId,
  label = 'View as partner',
  className,
  portalPath,
}: Props) {
  const id = (partnerId || '').trim();
  if (!id) return null;

  return (
    <button
      type="button"
      onClick={() => openPortalAsPartner(id, portalPath)}
      className={className ?? `${FINELY_OS_SECONDARY_BTN} inline-flex`}
      title="Set partner context and open Partner Portal dashboard in a new tab"
    >
      <ExternalLink size={14} aria-hidden="true" />
      {label}
    </button>
  );
}
