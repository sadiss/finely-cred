import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from './FinelyOsIconBadge';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_LUXURY_PAGINATION_BTN,
  finelyOsGlassShell,
  type FinelyOsGlassAccent,
} from './finelyOsLightUi';

type Props = {
  icon: LucideIcon;
  label: string;
  title: string;
  subtitle?: string;
  accent?: FinelyOsGlassAccent;
  iconAccent?: FinelyOsIconAccent;
  onClose: () => void;
  footer?: ReactNode;
  widthClass?: string;
  children: ReactNode;
};

export function FinelyOsSidePanel({
  icon,
  label,
  title,
  subtitle,
  accent = 'violet',
  iconAccent,
  onClose,
  footer,
  widthClass = 'w-full lg:w-[420px]',
  children,
}: Props) {
  const badgeAccent = iconAccent ?? (accent as FinelyOsIconAccent);

  return (
    <aside
      className={`${widthClass} shrink-0 flex flex-col max-h-[calc(100vh-6rem)] overflow-hidden ${finelyOsGlassShell('panel', accent)}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4 shrink-0">
        <div className="flex items-start gap-3 min-w-0">
          <FinelyOsIconBadge icon={icon} accent={badgeAccent} size={18} className="p-2.5 shrink-0" />
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
            <h2 className={`${FINELY_OS_ENTITY_TITLE} truncate`}>{title}</h2>
            {subtitle ? <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} truncate`}>{subtitle}</p> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`${FINELY_OS_LUXURY_PAGINATION_BTN} p-2`}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-5 space-y-4 min-h-0">{children}</div>

      {footer ? (
        <div className="shrink-0 border-t border-white/[0.08] pt-4 flex flex-wrap items-center justify-between gap-3">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
