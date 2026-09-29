import React, { useEffect, useState } from 'react';
import { Loader2, MapPin, Radar } from 'lucide-react';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import {
  MARKETING_FIND_FALLBACK_METROS,
  marketingFindAskPlaceholder,
} from './marketingDeskFindAsk';
import { ensureMarketingFindBrowserMetro } from './marketingDeskFindGeo';
import {
  getMarketingFindEffectiveLocation,
  getMarketingFindGeo,
  getMarketingFindGeoRecord,
  resolveMarketingDeskFindRequest,
  setMarketingFindGeo,
  type MarketingDeskFindRequest,
} from './marketingDeskHunt';

type Props = {
  busy?: boolean;
  placeholder?: string;
  submitLabel?: string;
  initialQuery?: string;
  onSubmit: (request: MarketingDeskFindRequest) => void;
  onDailyPack?: (request: MarketingDeskFindRequest) => void;
};

export function MarketingDeskEasyAskBar({
  busy,
  placeholder,
  submitLabel = 'Find',
  initialQuery,
  onSubmit,
  onDailyPack,
}: Props) {
  const [text, setText] = useState(initialQuery || '');
  const [city, setCity] = useState('');
  const [pickMetro, setPickMetro] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (initialQuery) setText((prev) => prev || initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const onStore = () => setTick((n) => n + 1);
    window.addEventListener('finely:store', onStore);
    return () => window.removeEventListener('finely:store', onStore);
  }, []);

  useEffect(() => {
    void ensureMarketingFindBrowserMetro();
  }, []);

  void tick;
  const record = getMarketingFindGeoRecord();
  const storedMetro = getMarketingFindGeo();
  const effective = getMarketingFindEffectiveLocation(city.trim() || undefined);
  const geoBlocked = record.status === 'denied' || record.status === 'unavailable';
  const showChips = pickMetro || geoBlocked || !storedMetro;

  const submit = (kind: 'find' | 'pack') => {
    const request = resolveMarketingDeskFindRequest({ ask: text, city });
    if (kind === 'pack' && onDailyPack) onDailyPack(request);
    else onSubmit(request);
  };

  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) submit('find');
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">Ask</span>
          <input
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder || marketingFindAskPlaceholder()}
            className="w-full rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-4 text-lg text-white outline-none placeholder:text-white/35 focus:border-emerald-300/50"
          />
        </label>
        <button type="submit" disabled={busy} className={FINELY_OS_PRIMARY_BTN}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Radar size={16} />}
          {busy ? 'Finding…' : submitLabel}
        </button>
        {onDailyPack ? (
          <button
            type="button"
            disabled={busy}
            className={FINELY_OS_SECONDARY_BTN}
            onClick={() => submit('pack')}
          >
            Daily pack
          </button>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
        <MapPin size={14} className="text-emerald-300" />
        {storedMetro ? (
          <span>
            Near <span className="font-medium text-white">{storedMetro}</span>
          </span>
        ) : (
          <span>
            No city needed. This run uses <span className="font-medium text-white">{effective}</span>.
          </span>
        )}
        {geoBlocked ? (
          <span className="text-amber-200/90">Location access is off — pick a metro.</span>
        ) : null}
        <button
          type="button"
          className="text-emerald-300/90 underline-offset-2 hover:underline"
          onClick={() => setPickMetro((v) => !v)}
        >
          {showChips ? 'Hide metros' : 'Pick a metro'}
        </button>
      </div>

      {showChips ? (
        <div className="flex flex-wrap gap-2">
          {MARKETING_FIND_FALLBACK_METROS.map((metro) => {
            const on = storedMetro.toLowerCase() === metro.location.toLowerCase();
            return (
              <button
                key={metro.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  setMarketingFindGeo(metro.location, { source: 'chip', status: 'granted', city: metro.label });
                  setCity('');
                  setPickMetro(false);
                }}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  on ? 'bg-emerald-400/20 text-white' : 'bg-white/[0.06] text-white/80 hover:bg-white/[0.1]'
                }`}
              >
                {metro.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <details className="text-sm text-white/70">
        <summary className="cursor-pointer select-none text-white/55">City (optional)</summary>
        <label className="mt-3 block max-w-sm">
          <span className="sr-only">City</span>
          <input
            value={city}
            disabled={busy}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Leave blank to use your area"
            className="mt-1 w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/30"
          />
        </label>
      </details>
    </div>
  );
}
