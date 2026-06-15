import React, { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { ProspectTarget } from '../../domain/crmProspects';
import {
  LEAD_INTEL_SOURCES,
  suggestQueryRefinements,
  type LeadIntelSource,
  type LeadIntelSourceId,
} from './leadIntelSources';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../os/finelyOsLightUi';

type Props = {
  onRun: (args: { source: LeadIntelSource; target: ProspectTarget; query: string; location: string; enrich: boolean }) => void;
  busy?: boolean;
};

export function LeadIntelSourceWizard({ onRun, busy }: Props) {
  const [sourceId, setSourceId] = useState<LeadIntelSourceId>('google_web');
  const [target, setTarget] = useState<ProspectTarget>('clients');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('United States');
  const [enrich, setEnrich] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const source = useMemo(() => LEAD_INTEL_SOURCES.find((s) => s.id === sourceId)!, [sourceId]);
  const refinements = useMemo(() => suggestQueryRefinements(source, query || source.queryTemplate), [source, query]);

  const pickSource = (id: LeadIntelSourceId) => {
    const s = LEAD_INTEL_SOURCES.find((x) => x.id === id)!;
    setSourceId(id);
    setTarget(s.defaultTarget);
    setQuery(s.queryTemplate);
    setLocation(s.locationDefault ?? 'United States');
    setEnrich(s.enrichDefault ?? true);
    setStep(2);
  };

  return (
    <div className={`space-y-4 ${finelyOsGlassShell('panel', 'fuchsia')}`}>
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Find leads — step {step} of 3</div>

      {step === 1 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEAD_INTEL_SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pickSource(s.id)}
              className="text-left fc-light-glass-panel fc-light-chrome-panel rounded-xl p-4 hover:border-fuchsia-500/30 transition-all"
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold text-white text-sm">{s.label}</div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{s.description}</div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3 max-w-2xl">
          <div className="text-sm text-white/80">
            Source: <span className="font-semibold text-fuchsia-200">{source.label}</span>
          </div>
          <label>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Target audience</div>
            <select value={target} onChange={(e) => setTarget(e.target.value as ProspectTarget)} className={FINELY_OS_ENTITY_SELECT}>
              <option value="clients">Clients</option>
              <option value="affiliates">Affiliates</option>
              <option value="agents">Agents</option>
              <option value="teams">Teams</option>
              <option value="au_sellers">AU sellers</option>
              <option value="b2b_partners">B2B partners</option>
            </select>
          </label>
          <label>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Search query</div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder={source.queryTemplate} />
          </label>
          <label>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Geography</div>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
          </label>
          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
            <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} className="accent-fuchsia-500" />
            Enrich pages (emails, phones)
          </label>
          {source.complianceNote ? <p className={`${FINELY_OS_ENTITY_BODY} text-xs text-amber-200/80`}>{source.complianceNote}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className={FINELY_OS_SECONDARY_BTN}>Back</button>
            <button type="button" onClick={() => setStep(3)} className={FINELY_OS_PRIMARY_BTN}>Refine query →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2 text-fuchsia-200 text-sm">
            <Sparkles size={14} /> Suggested refinements
          </div>
          <div className="flex flex-wrap gap-2">
            {refinements.map((r) => (
              <button key={r} type="button" onClick={() => setQuery(r)} className={FINELY_OS_SECONDARY_BTN}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => setStep(2)} className={FINELY_OS_SECONDARY_BTN}>Back</button>
            <button
              type="button"
              disabled={busy || !query.trim()}
              onClick={() => onRun({ source, target, query: query.trim(), location: location.trim(), enrich })}
              className={FINELY_OS_PRIMARY_BTN}
            >
              {busy ? 'Searching…' : 'Run discovery'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
