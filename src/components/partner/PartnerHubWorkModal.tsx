import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  type FinelyOsGlassAccent,
} from '../../features/os/finelyOsLightUi';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accent?: FinelyOsGlassAccent;
  children: React.ReactNode;
};

export function PartnerHubWorkModal({
  open,
  onClose,
  title,
  subtitle,
  accent = 'violet',
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-4">
      <div className={FINELY_OS_FIXED_OVERLAY} onClick={onClose} aria-hidden />
      <div
        className={`relative w-full max-w-4xl ${FINELY_OS_MODAL_SHELL}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-hub-work-modal-title"
        onClick={(e) => e.stopPropagation()}
        data-fc-accent={accent}
      >
        <div className="shrink-0 p-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner hub</div>
            <h2 id="partner-hub-work-modal-title" className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>
              {title}
            </h2>
            {subtitle ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !py-2 shrink-0`} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 max-h-[72vh]">
          <div className={`${finelyOsGlassShell('inner', accent)} space-y-4`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
