import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  accent?: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia' | 'rose';
  children: React.ReactNode;
};

/** Partner hub work surface — full width, solid shell, no backdrop blur overlay. */
const PARTNER_HUB_MODAL_SHELL =
  'relative z-[1] flex w-full max-w-[min(98vw,1760px)] flex-col overflow-hidden rounded-2xl border border-white/12 ' +
  'bg-gradient-to-b from-[#0e121c] to-[#080a10] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)] max-h-[min(94vh,960px)]';

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto p-2 sm:p-4 lg:p-6"
      data-fc-partner-hub-modal-root="1"
    >
      {/* Dim only — no backdrop-blur (blur made hub content unreadable) */}
      <button
        type="button"
        className="fixed inset-0 z-0 bg-black/70 border-0 cursor-default"
        onClick={onClose}
        aria-label="Close partner hub panel"
      />

      <div
        className={PARTNER_HUB_MODAL_SHELL}
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-hub-work-modal-title"
        onClick={(e) => e.stopPropagation()}
        data-fc-accent={accent}
        data-fc-partner-hub-modal="1"
      >
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 lg:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
