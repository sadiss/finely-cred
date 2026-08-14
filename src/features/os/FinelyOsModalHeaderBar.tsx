import React from 'react';
import { FINELY_OS_MODAL_HEADER } from './finelyOsLightUi';
import { FinelyOsModalCloseButton } from './FinelyOsModalCloseButton';

/** Sticky modal header row — title block left, 44px close control right. */
export function FinelyOsModalHeaderBar({
  children,
  onClose,
  closeDisabled,
  closeLabel = 'Close',
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  closeLabel?: string;
  className?: string;
}) {
  return (
    <div className={[FINELY_OS_MODAL_HEADER, className].filter(Boolean).join(' ')}>
      <div className="min-w-0 flex-1">{children}</div>
      <FinelyOsModalCloseButton onClick={onClose} disabled={closeDisabled} aria-label={closeLabel} title={closeLabel} />
    </div>
  );
}
