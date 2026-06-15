import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { PipelineForecast } from '../forecast/buildPipelineForecast';
import { formatForecastCents } from '../forecast/buildPipelineForecast';
import { finelyOsCatalogCard, finelyOsKpiTile } from '../../os/finelyOsLightUi';

export function CrmForecastPanel({ forecast }: { forecast: PipelineForecast }) {
  return (
    <div className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-3`} data-fc-accent="emerald">
      <div className="flex items-center gap-2 text-emerald-200">
        <TrendingUp size={16} />
        <span className="text-xs font-bold uppercase tracking-wider">Pipeline forecast</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={finelyOsKpiTile(1)}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/80">Open deals</div>
          <div className="text-xl font-bold text-white">{forecast.openCount}</div>
        </div>
        <div className={finelyOsKpiTile(2)}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200/80">Pipeline value</div>
          <div className="text-xl font-bold text-white">{formatForecastCents(forecast.totalPipelineCents)}</div>
        </div>
        <div className={`sm:col-span-2 ${finelyOsKpiTile(3)}`}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-violet-200/80">Weighted forecast</div>
          <div className="text-xl font-bold text-white">{formatForecastCents(forecast.weightedForecastCents)}</div>
        </div>
      </div>
    </div>
  );
}
