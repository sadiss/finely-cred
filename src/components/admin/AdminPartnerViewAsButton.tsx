import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { enterPartnerView } from '../../lib/adminPartnerViewAs';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../../features/os/finelyOsLightUi';

type Props = {
  partnerId: string;
  label?: string;
  className?: string;
  portalPath?: string;
  /** When true, opens a new browser tab instead of navigating in the current tab. */
  newTab?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AdminPartnerViewAsButton({
  partnerId,
  label = 'See what this partner sees',
  className,
  portalPath,
  newTab = false,
  variant = 'secondary',
}: Props) {
  const navigate = useNavigate();
  const id = (partnerId || '').trim();
  if (!id) return null;

  const btnClass =
    className ??
    (variant === 'primary' ? `${FINELY_OS_PRIMARY_BTN} inline-flex` : `${FINELY_OS_SECONDARY_BTN} inline-flex`);

  return (
    <button
      type="button"
      onClick={() =>
        enterPartnerView(id, {
          path: portalPath,
          newTab,
          navigate: newTab ? undefined : navigate,
        })
      }
      className={btnClass}
      title="Preview the live partner portal scoped to this partner file"
    >
      {newTab ? <ExternalLink size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
      {label}
    </button>
  );
}
