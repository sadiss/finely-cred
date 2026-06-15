import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Action = { label: string; onClick: () => void };

type Accent = 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia';

const ACCENT_SUBLABEL: Record<Accent, string> = {
  emerald: 'text-emerald-300',
  violet: 'text-violet-300',
  amber: 'text-amber-300',
  sky: 'text-sky-300',
  fuchsia: 'text-fuchsia-300',
};

type Props = {
  title: string;
  body: string;
  accent?: Accent;
  primary?: Action;
  secondary?: Action;
  className?: string;
};

export function FinelyNowDoThisStrip({
  title,
  body,
  accent = 'amber',
  primary,
  secondary,
  className = '',
}: Props) {
  return (
    <div
      className={`fc-senior-simple ${finelyOsCatalogCard(accent)} !p-6 flex flex-wrap items-center justify-between gap-4 ${className}`}
      data-fc-accent={accent}
    >
      <div className="max-w-2xl space-y-2">
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} ${ACCENT_SUBLABEL[accent]}`}>Now do this</div>
        <p className={`${FINELY_OS_ENTITY_VALUE} text-xl font-semibold`}>{title}</p>
        <p className={`${FINELY_OS_ENTITY_BODY} text-base leading-relaxed`}>{body}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        {primary ? (
          <button type="button" className={`${FINELY_OS_PRIMARY_BTN} !py-4 !text-base justify-center`} onClick={primary.onClick}>
            {primary.label} <ArrowRight size={16} />
          </button>
        ) : null}
        {secondary ? (
          <button type="button" className={`${FINELY_OS_SECONDARY_BTN} !py-3 justify-center`} onClick={secondary.onClick}>
            {secondary.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
