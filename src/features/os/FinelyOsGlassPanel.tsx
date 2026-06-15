import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from './FinelyOsIconBadge';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_TITLE, finelyOsCatalogCard, type FinelyOsGlassAccent } from './finelyOsLightUi';

type GlassVariant = 'panel' | 'inner' | 'catalog';

type FinelyOsGlassPanelProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: FinelyOsGlassAccent;
  iconAccent?: FinelyOsIconAccent;
  variant?: GlassVariant;
  actions?: ReactNode;
  headerless?: boolean;
  className?: string;
  children: ReactNode;
};

export function FinelyOsGlassPanel({
  icon,
  title,
  subtitle,
  accent = 'violet',
  iconAccent,
  variant = 'panel',
  actions,
  headerless = false,
  className = '',
  children,
}: FinelyOsGlassPanelProps) {
  const catalogAccent = (accent === 'rose' ? 'fuchsia' : accent) as 'violet' | 'emerald' | 'sky' | 'amber' | 'fuchsia';
  const shell = `${finelyOsCatalogCard(catalogAccent)} ${variant === 'inner' ? '!p-4 fc-surface-harmony' : variant === 'catalog' ? '!p-5' : '!p-6'}`;
  const badgeAccent = iconAccent ?? (accent as FinelyOsIconAccent);

  return (
    <section className={`fc-light-black-scope ${shell} ${className}`.trim()} data-fc-accent={accent}>
      {!headerless ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <FinelyOsIconBadge icon={icon} accent={badgeAccent} size={18} className="p-2.5 shrink-0" />
            <div className="min-w-0">
              <h2 className={FINELY_OS_ENTITY_TITLE}>{title}</h2>
              {subtitle ? <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
