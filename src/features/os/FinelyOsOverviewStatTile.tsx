import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { FinelyOsIconBadge, type FinelyOsIconAccent } from './FinelyOsIconBadge';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsOverviewStatTile,
  type FinelyOsGlassAccent,
} from './finelyOsLightUi';

type Props = {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  accent?: FinelyOsGlassAccent;
  iconAccent?: FinelyOsIconAccent;
  hint?: string;
};

export function FinelyOsOverviewStatTile({
  icon,
  label,
  value,
  accent = 'violet',
  iconAccent,
  hint,
}: Props) {
  const badgeAccent = iconAccent ?? (accent as FinelyOsIconAccent);

  return (
    <div className={finelyOsOverviewStatTile(accent)} data-fc-accent={accent === 'amber' ? 'violet' : accent}>
      <div className="flex items-start gap-4">
        <FinelyOsIconBadge icon={icon} accent={badgeAccent === 'amber' ? 'violet' : badgeAccent} size={22} className="p-3.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
          <div className={`mt-2 text-3xl lg:text-4xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{value}</div>
          {hint ? <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{hint}</div> : null}
        </div>
      </div>
    </div>
  );
}