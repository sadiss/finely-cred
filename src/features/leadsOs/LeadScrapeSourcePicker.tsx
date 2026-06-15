import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LEAD_INTEL_SOURCES, suggestQueryRefinements, type LeadIntelSource } from '../leadIntel/leadIntelSources';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_PANEL_INNER,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,} from '../os/finelyOsLightUi';

type Props = {
  onSelect: (source: LeadIntelSource, suggestedQuery: string) => void;
  selectedId?: string;
};

export function LeadScrapeSourcePicker({ onSelect, selectedId }: Props) {
  return (
    <div className="space-y-3">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Scrape & discovery sources</div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {LEAD_INTEL_SOURCES.map((source) => {
          const suggestions = suggestQueryRefinements(source, source.queryTemplate);
          const active = selectedId === source.id;
          return (
            <button
              key={source.id}
              type="button"
              onClick={() => onSelect(source, suggestions[0] ?? source.queryTemplate)}
              className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-left p-4 transition-all hover:border-emerald-500/35 ${
                active ? 'border-emerald-500/50 bg-emerald-500/10' : ''
              }`}
            >
              <div className="text-2xl mb-2">{source.icon}</div>
              <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{source.label}</div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1 line-clamp-2`}>{source.description}</div>
              {source.complianceNote ? (
                <div className="text-[10px] text-amber-200/80 mt-2">{source.complianceNote}</div>
              ) : null}
              <div className={`${FINELY_OS_SECONDARY_BTN} mt-3 !text-[10px] !py-1 inline-flex items-center gap-1`}>
                Use template <ArrowRight size={12} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
