import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DashboardMetricCard } from '../../lib/dashboardMetrics';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsOverviewStatTile,
} from '../../features/os/finelyOsLightUi';

const accentTile: Record<NonNullable<DashboardMetricCard['accent']>, 'amber' | 'emerald' | 'sky' | 'violet'> = {
  amber: 'amber',
  emerald: 'emerald',
  sky: 'sky',
  neutral: 'violet',
};

const accentValue: Record<NonNullable<DashboardMetricCard['accent']>, string> = {
  amber: 'text-fuchsia-300',
  emerald: 'text-emerald-300',
  sky: 'text-sky-300',
  neutral: FINELY_OS_ENTITY_VALUE,
};

export function DashboardHeroMetrics({ cards }: { cards: DashboardMetricCard[] }) {
  const navigate = useNavigate();
  if (!cards.length) return null;

  return (
    <div className="flex flex-wrap gap-6 items-start">
      {cards.map((card) => {
        const accent = card.accent ?? 'neutral';
        return (
          <div key={card.id} className={`group hover:-translate-y-0.5 transition-all duration-300 w-full md:min-w-[280px] md:flex-1 md:max-w-sm ${finelyOsOverviewStatTile(accentTile[accent])}`}>
            <p className={`${FINELY_OS_ENTITY_SUBLABEL} mb-6`}>{card.label}</p>
            <div className={`text-5xl md:text-6xl font-extralight tabular-nums leading-none ${accentValue[accent]}`}>{card.value}</div>
            {card.sublabel ? <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY} mt-4 max-w-xs`}>{card.sublabel}</p> : null}
            {card.actionPath && card.actionLabel ? (
              <button type="button" onClick={() => navigate(card.actionPath!)} className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-violet-300 hover:text-violet-200">
                {card.actionLabel} <ArrowRight size={12} />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
