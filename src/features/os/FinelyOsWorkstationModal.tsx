import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  type FinelyOsGlowAccent,
} from './finelyOsLightUi';

const ACCENT_BORDER: Record<FinelyOsGlowAccent, string> = {
  emerald: 'border-emerald-400/30',
  fuchsia: 'border-fuchsia-400/30',
  sky: 'border-sky-400/30',
  amber: 'border-amber-400/30',
  rose: 'border-rose-400/30',
  violet: 'border-violet-400/30',
};

export function FinelyOsWorkstationModal({
  open,
  title,
  subtitle,
  accent = 'emerald',
  size = 'default',
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  accent?: FinelyOsGlowAccent;
  size?: 'default' | 'large';
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  const sizeClass =
    size === 'large'
      ? 'w-full sm:max-w-3xl lg:max-w-5xl max-h-[94vh] sm:max-h-[88vh]'
      : 'w-full sm:max-w-2xl lg:max-w-4xl max-h-[92vh] sm:max-h-[72vh]';

  return createPortal(
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[8800] flex items-end sm:items-center justify-center p-0 sm:p-4`}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div
        className={`${FINELY_OS_MODAL_SHELL} relative z-[1] flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl border ${ACCENT_BORDER[accent]} ${sizeClass}`}
      >
        <div className="shrink-0 flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{subtitle ?? 'Workstation'}</div>
            <h2 className={`text-lg font-bold truncate ${FINELY_OS_ENTITY_VALUE}`}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} className={`${FINELY_OS_SECONDARY_BTN} !p-2`} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer ? <div className="shrink-0 border-t border-white/10 px-4 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function FinelyOsWorkstationLauncherButton({
  label,
  hint,
  accent,
  onClick,
}: {
  label: string;
  hint: string;
  accent: FinelyOsGlowAccent;
  onClick: () => void;
}) {
  const styles: Record<FinelyOsGlowAccent, string> = {
    emerald: 'from-emerald-600/25 to-teal-900/20 border-emerald-400/35 text-emerald-50',
    fuchsia: 'from-fuchsia-600/25 to-violet-900/20 border-fuchsia-400/35 text-fuchsia-50',
    sky: 'from-sky-600/25 to-cyan-900/20 border-sky-400/35 text-sky-50',
    amber: 'from-amber-600/25 to-orange-900/20 border-amber-400/35 text-amber-50',
    rose: 'from-rose-600/25 to-red-900/20 border-rose-400/35 text-rose-50',
    violet: 'from-violet-600/25 to-indigo-900/20 border-violet-400/35 text-violet-50',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border bg-gradient-to-r px-4 py-4 sm:py-5 text-left transition-all hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] min-h-[4.25rem] ${styles[accent]}`}
    >
      <div className="text-sm font-bold tracking-tight">{label}</div>
      <div className="mt-0.5 text-[11px] opacity-75 leading-snug">{hint}</div>
    </button>
  );
}
