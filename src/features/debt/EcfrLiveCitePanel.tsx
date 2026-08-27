import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import {
  loadEcfrCite,
  POST_JUDGMENT_ECFR_CITES,
  type EcfrCiteId,
  type EcfrCiteResult,
} from '../../lib/ecfrLiveCites';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';

const ACCENTS: FinelyOsGlowAccent[] = ['emerald', 'violet', 'sky'];

export function EcfrLiveCitePanel() {
  const [busyId, setBusyId] = useState<EcfrCiteId | null>(null);
  const [results, setResults] = useState<Partial<Record<EcfrCiteId, EcfrCiteResult>>>({});

  const handleLoad = async (id: EcfrCiteId) => {
    setBusyId(id);
    try {
      const result = await loadEcfrCite(id);
      setResults((prev) => ({ ...prev, [id]: result }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} space-y-5`}>
      <div className="flex items-start gap-3">
        <BookOpen size={24} className="text-violet-300 shrink-0 mt-1" />
        <div>
          <h2 className={FINELY_OS_ENTITY_TITLE}>Live eCFR cites</h2>
          <p className={`mt-2 text-base ${FINELY_OS_ENTITY_BODY}`}>
            Load a cached excerpt from the official eCFR when you need the current regulation text.
            Nothing is fetched until you tap a cite. Results vary · not legal advice.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {POST_JUDGMENT_ECFR_CITES.map((spec, idx) => {
          const loaded = results[spec.id];
          const accent = ACCENTS[idx % ACCENTS.length];
          return (
            <article key={spec.id} className={`${finelyOsCatalogCardCompact(accent)} flex flex-col gap-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{spec.label}</div>
              <p className="text-base font-bold text-white">{spec.why}</p>
              {loaded?.excerpt ? (
                <p className="text-base text-white/80 leading-relaxed flex-1">{loaded.excerpt}</p>
              ) : loaded?.error ? (
                <p className="text-base text-rose-200">
                  Live text unavailable ({loaded.error}). Use the official viewer.
                </p>
              ) : (
                <p className="text-base text-white/60 flex-1">Tap load for a cached official excerpt.</p>
              )}
              {loaded?.date ? (
                <p className="text-sm text-white/55">
                  eCFR date {loaded.date}
                  {loaded.cached ? ' · cached' : ''}
                  {loaded.stale ? ' · stale' : ''}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                <button
                  type="button"
                  disabled={busyId === spec.id}
                  onClick={() => handleLoad(spec.id)}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  {busyId === spec.id ? 'Loading…' : loaded ? 'Refresh cite' : 'Load live cite'}
                </button>
                <a
                  href={spec.viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                >
                  Open eCFR
                  <ExternalLink size={14} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
