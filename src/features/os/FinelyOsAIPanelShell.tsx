import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { FinelyOsIconBadge } from './FinelyOsIconBadge';
import { FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_PRIMARY_BTN, finelyOsGlassShell } from './finelyOsLightUi';

type Accent = 'fuchsia' | 'violet' | 'emerald';

const TITLE_CLASS: Record<Accent, string> = {
  fuchsia: 'text-fuchsia-300',
  violet: 'text-violet-300',
  emerald: 'text-emerald-300',
};

type Props = {
  icon: LucideIcon;
  accent?: Accent;
  title: string;
  actionLabel: string;
  onAction: () => void;
  busy?: boolean;
  children?: React.ReactNode;
};

/** Shared header shell for analyze-style AI copilot panels (Work, CRM, etc.). */
export function FinelyOsAIPanelShell({
  icon: Icon,
  accent = 'fuchsia',
  title,
  actionLabel,
  onAction,
  busy = false,
  children,
}: Props) {
  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', accent)}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FinelyOsIconBadge icon={Icon} accent={accent} size={16} className="p-2" />
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} ${TITLE_CLASS[accent]}`}>{title}</span>
        </div>
        <button type="button" disabled={busy} onClick={onAction} className={FINELY_OS_PRIMARY_BTN}>
          {busy ? <Loader2 size={12} className="inline animate-spin" /> : actionLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
