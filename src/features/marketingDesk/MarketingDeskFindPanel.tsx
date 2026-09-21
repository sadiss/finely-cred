import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Radar } from 'lucide-react';
import { GrokAskHero } from './GrokAskHero';
import {
  METRO_CHIPS,
  parsePlaceFromQuery,
  resolveSearchCenter,
  rememberMetro,
  type GeoCenter,
} from './grokLocation';
import { DEFAULT_RADIUS_MI, DESK_HELPERS, detectVertical } from './marketingDeskModel';
import { runGrokFind, type FindResultRow } from './overpassFind';
import { FC_CARD_GRID, FC_PAGE_SECTION, FC_SURFACE_CARD } from '../../styles/layoutSurfaces';

export function MarketingDeskFindPanel() {
  const def = DESK_HELPERS.find((h) => h.id === 'find')!;
  const [ask, setAsk] = useState('');
  const [busy, setBusy] = useState(false);
  const [locBusy, setLocBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [center, setCenter] = useState<GeoCenter | null>(null);
  const [activeMetroId, setActiveMetroId] = useState<string | null>(null);
  const [results, setResults] = useState<FindResultRow[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [showCity, setShowCity] = useState(false);
  const [manualCity, setManualCity] = useState('');

  const bootstrapCenter = useCallback(async (metroId?: string | null) => {
    const chip = metroId ? METRO_CHIPS.find((m) => m.id === metroId) : null;
    const c = await resolveSearchCenter({
      placeFromQuery: null,
      metroChipQuery: chip?.query ?? null,
      preferGeo: false,
    });
    setCenter(c);
    setActiveMetroId(metroId ?? null);
  }, []);

  useEffect(() => {
    void bootstrapCenter();
  }, [bootstrapCenter]);

  const runSearch = async () => {
    const raw = ask.trim();
    if (!raw) return;
    setBusy(true);
    setErr(null);
    try {
      const { cleanedQuery, place } = parsePlaceFromQuery(raw);
      const spec = detectVertical(cleanedQuery || raw);
      let searchCenter = center;
      if (place || manualCity.trim()) {
        searchCenter = await resolveSearchCenter({
          placeFromQuery: place ?? manualCity.trim(),
          metroChipQuery: activeMetroId ? METRO_CHIPS.find((m) => m.id === activeMetroId)?.query : null,
          preferGeo: place === '__near_me__',
        });
        setCenter(searchCenter);
      } else if (!searchCenter) {
        searchCenter = await resolveSearchCenter({ placeFromQuery: null, preferGeo: true });
        setCenter(searchCenter);
      }
      rememberMetro(searchCenter.label);
      const { rows, provider: p } = await runGrokFind({
        naturalQuery: cleanedQuery || raw,
        center: searchCenter,
        spec,
        radiusMi: DEFAULT_RADIUS_MI,
        limit: 24,
      });
      setResults(rows);
      setProvider(p);
      if (rows.length === 0) {
        setErr('No matches in OpenStreetMap for that ask — try a broader phrase or another metro chip.');
      }
    } catch (e) {
      setErr((e as Error)?.message || 'Search failed');
      setResults([]);
    } finally {
      setBusy(false);
    }
  };

  const onUseLocation = async () => {
    setLocBusy(true);
    setErr(null);
    try {
      const c = await resolveSearchCenter({ placeFromQuery: '__near_me__', preferGeo: true });
      setCenter(c);
      setActiveMetroId(null);
    } catch {
      setErr('Location permission denied — pick a metro chip or type a place in your ask.');
    } finally {
      setLocBusy(false);
    }
  };

  const metroChips = useMemo(
    () =>
      METRO_CHIPS.map((m) => ({
        id: m.id,
        label: m.label,
        active: activeMetroId === m.id,
        onSelect: () => {
          void bootstrapCenter(m.id);
        },
      })),
    [activeMetroId, bootstrapCenter],
  );

  const kpi = useMemo(
    () => ({
      count: results.length,
      vertical: detectVertical(ask || 'general').vertical,
      radius: DEFAULT_RADIUS_MI,
    }),
    [results.length, ask],
  );

  return (
    <div className={FC_PAGE_SECTION}>
      <GrokAskHero
        title={def.label}
        tagline={def.tagline}
        placeholder={def.placeholder}
        value={ask}
        onChange={setAsk}
        onSubmit={() => void runSearch()}
        busy={busy}
        exampleChips={def.exampleChips}
        metroChips={metroChips}
        locationLabel={center?.label ?? null}
        onUseMyLocation={onUseLocation}
        locationBusy={locBusy}
        footer={
          <div className="text-sm text-white/60">
            <button
              type="button"
              className="text-[#fbbf24] underline underline-offset-2"
              onClick={() => setShowCity((v) => !v)}
            >
              {showCity ? 'Hide optional city override' : 'Optional city override'}
            </button>
            {showCity ? (
              <input
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Only if your ask omits a place — e.g. Tampa, FL"
                className="mt-2 w-full max-w-md rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white text-sm"
              />
            ) : null}
            <p className="mt-2 text-xs text-white/55">
              Parses places from your ask (“in Miami”, “near Tampa”). Default radius {DEFAULT_RADIUS_MI} mi · vertical from
              keywords · Overpass then Nominatim.
            </p>
          </div>
        }
      />

      {err ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{err}</p>
      ) : null}

      {(results.length > 0 || busy) && (
        <>
          <div className={`grid md:grid-cols-4 ${FC_CARD_GRID.replace('grid ', '')}`}>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Results</div>
              <div className="text-2xl font-semibold text-white mt-1">{kpi.count}</div>
            </div>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Vertical</div>
              <div className="text-2xl font-semibold text-white mt-1 capitalize">{kpi.vertical}</div>
            </div>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Radius</div>
              <div className="text-2xl font-semibold text-white mt-1">{kpi.radius} mi</div>
            </div>
            <div className={FC_SURFACE_CARD}>
              <div className="text-[10px] uppercase tracking-widest text-white/55">Provider</div>
              <div className="text-lg font-semibold text-white mt-1 flex items-center gap-2">
                <Radar size={16} className="text-[#fbbf24]" />
                {provider ?? '—'}
              </div>
            </div>
          </div>

          <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${FC_CARD_GRID.replace('grid ', '')}`}>
            {results.map((r) => (
              <article key={r.id} className={FC_SURFACE_CARD}>
                <h3 className="text-white font-semibold text-lg leading-snug">{r.title}</h3>
                <p className="text-white/75 text-sm mt-2 line-clamp-3">{r.subtitle}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
                  {r.distanceMi != null ? <span>{r.distanceMi.toFixed(1)} mi</span> : null}
                  <span className="uppercase tracking-wider">{r.source}</span>
                </div>
                <a
                  href={r.osmUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#fbbf24] hover:underline"
                >
                  OpenStreetMap <ExternalLink size={14} />
                </a>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
