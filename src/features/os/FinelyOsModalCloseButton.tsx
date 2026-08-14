import React from 'react';
import { X } from 'lucide-react';
import { FINELY_OS_MODAL_CLOSE } from './finelyOsLightUi';

export function FinelyOsModalCloseButton({
  onClick,
  disabled,
  className,
  'aria-label': ariaLabel = 'Close',
  title = 'Close',
  iconSize = 20,
  sticky = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  title?: string;
  iconSize?: number;
  /** Pin to top-right inside scrollable modals (uses sticky + elevated z-index). */
  sticky?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-fc-modal-close=""
      className={[
        FINELY_OS_MODAL_CLOSE,
        sticky ? 'sticky top-0 z-20 self-start' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={ariaLabel}
      title={title}
    >
      <X size={iconSize} strokeWidth={2.5} aria-hidden className="pointer-events-none" />
    </button>
  );
}
