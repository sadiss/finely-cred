import React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { StudioUxKpi } from './types';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsSolidIconChip,
  type FinelyOsPublicAccent,
} from '../os/finelyOsLightUi';
import { accentAt } from '../workspaceLightPreview/product/workspaceAccentArrangement';
import type { WorkspaceProductAccent } from '../workspaceLightPreview/product/workspaceProductTokens';

function toFinelyAccent(tone: StudioUxKpi['tone'], index: number): FinelyOsPublicAccent {
  if (tone === 'emerald' || tone === 'violet' || tone === 'sky' || tone === 'rose') {
    return tone;
  }
  return accentAt(index) as FinelyOsPublicAccent;
}

export function StudioKpiCards({ items }: { items: StudioUxKpi[] }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      {items.map((k, index) => {
        const accent = toFinelyAccent(k.tone, index);
        return (
          <div
            key={k.label}
            className={`${finelyOsCatalogCard(accent)} fc-surface-harmony space-y-3`}
            data-fc-accent={accent}
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{k.value}</div>
            <div className={`${FINELY_OS_ENTITY_BODY} text-white/70`}>{k.hint}</div>
          </div>
        );
      })}
    </div>
  );
}

export function StudioActionDeck<T extends { id: string; title: string; summary?: string }>({
  items,
  activeId,
  onSelect,
  renderMeta,
  variant = 'horizontal',
  icon: ItemIcon,
}: {
  items: T[];
  activeId?: string | null;
  onSelect?: (item: T) => void;
  renderMeta?: (item: T) => React.ReactNode;
  variant?: 'horizontal' | 'vertical';
  icon?: LucideIcon;
}) {
  const renderCard = (item: T, index: number) => {
    const accent = accentAt(index) as FinelyOsPublicAccent;
    const active = item.id === activeId;
    const Icon = ItemIcon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect?.(item)}
        className={`${finelyOsCatalogCard(accent)} text-left transition-all fc-surface-harmony ${
          variant === 'horizontal' ? 'shrink-0 w-[300px]' : 'w-full'
        } ${active ? 'ring-2 ring-white/25 scale-[1.01]' : 'hover:scale-[1.005]'}`}
        data-fc-accent={accent}
        data-active={active ? 'true' : undefined}
      >
        <div className="flex items-start gap-4">
          {Icon ? (
            <span className={finelyOsSolidIconChip(accent, 'md')}>
              <Icon size={18} strokeWidth={2.2} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <div className={`${FINELY_OS_ENTITY_TITLE} text-xl lg:text-2xl leading-tight`}>{item.title}</div>
            {item.summary ? (
              <div className={`mt-3 text-base font-semibold leading-relaxed text-white/75 line-clamp-3`}>
                {item.summary}
              </div>
            ) : null}
            {renderMeta ? <div className="mt-4">{renderMeta(item)}</div> : null}
          </div>
        </div>
      </button>
    );
  };

  if (variant === 'vertical') {
    return <div className="space-y-4">{items.map((item, index) => renderCard(item, index))}</div>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-full">{items.map((item, index) => renderCard(item, index))}</div>
    </div>
  );
}

const SECTION_ACCENTS: WorkspaceProductAccent[] = ['violet', 'emerald', 'sky', 'rose'];

export function StudioSection({
  eyebrow,
  title,
  children,
  right,
  accentIndex = 0,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  accentIndex?: number;
}) {
  const accent = SECTION_ACCENTS[accentIndex % SECTION_ACCENTS.length] as FinelyOsPublicAccent;

  return (
    <section
      className={`${finelyOsCatalogCard(accent)} fc-surface-harmony space-y-5 lg:space-y-6`}
      data-fc-accent={accent}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <div className={FINELY_OS_ENTITY_SUBLABEL}>{eyebrow}</div> : null}
          <h2 className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
