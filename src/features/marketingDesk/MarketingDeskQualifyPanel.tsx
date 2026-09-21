import React, { useState } from 'react';
import { GrokAskHero } from './GrokAskHero';
import { DESK_HELPERS, detectVertical } from './marketingDeskModel';
import { FC_CARD_GRID, FC_PAGE_SECTION, FC_SURFACE_CARD } from '../../styles/layoutSurfaces';

function qualifyCards(ask: string) {
  const v = detectVertical(ask).vertical;
  const base = [
    { label: 'Compliance tone', ok: !/\b(delete|remove negative|850)\b/i.test(ask), hint: 'No deletion-score promises in partner pitch.' },
    { label: 'Manual send', ok: true, hint: 'HQ never auto-blasts — owner copies into ESP/SMS.' },
    { label: 'Vertical fit', ok: v !== 'general', hint: v === 'general' ? 'Add vertical keywords (BHPH, tax, church…).' : `Detected: ${v}` },
  ];
  const ready = base.filter((b) => b.ok).length;
  return { base, ready, pct: Math.round((ready / base.length) * 100) };
}

export function MarketingDeskQualifyPanel() {
  const def = DESK_HELPERS.find((h) => h.id === 'qualify')!;
  const [ask, setAsk] = useState('');
  const [ran, setRan] = useState(false);
  const summary = ran ? qualifyCards(ask) : null;

  return (
    <div className={FC_PAGE_SECTION}>
      <GrokAskHero
        title={def.label}
        tagline={def.tagline}
        placeholder={def.placeholder}
        value={ask}
        onChange={setAsk}
        onSubmit={() => setRan(true)}
        exampleChips={def.exampleChips}
      />
      {summary ? (
        <>
          <div className={`grid md:grid-cols-3 ${FC_CARD_GRID.replace('grid ', '')}`}>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Readiness</div>
              <div className="text-3xl font-semibold text-white mt-1">{summary.pct}%</div>
            </div>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Checks passed</div>
              <div className="text-3xl font-semibold text-white mt-1">{summary.ready}</div>
            </div>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Note</div>
              <p className="text-sm text-white/75 mt-2">Run Find next for local names, then Draft for outreach.</p>
            </div>
          </div>
          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${FC_CARD_GRID.replace('grid ', '')}`}>
            {summary.base.map((c) => (
              <div key={c.label} className={FC_SURFACE_CARD}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-semibold">{c.label}</span>
                  <span className={c.ok ? 'text-emerald-300 text-xs font-bold' : 'text-amber-200 text-xs font-bold'}>
                    {c.ok ? 'OK' : 'Review'}
                  </span>
                </div>
                <p className="text-sm text-white/75 mt-2">{c.hint}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
