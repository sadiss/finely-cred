import React from 'react';
import { Loader2, MapPin, Search, Sparkles } from 'lucide-react';
import { FC_SECTION_SHELL } from '../../styles/layoutSurfaces';

export function GrokAskHero(props: {
  title: string;
  tagline: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy?: boolean;
  exampleChips?: string[];
  metroChips?: { id: string; label: string; active?: boolean; onSelect: () => void }[];
  locationLabel?: string | null;
  onUseMyLocation?: () => void;
  locationBusy?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <section className={FC_SECTION_SHELL}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase tracking-[0.35em]">
          <Sparkles size={14} /> Partner desk intelligence
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white">{props.title}</h2>
        <p className="text-white/75 text-sm sm:text-base max-w-2xl">{props.tagline}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSubmit();
        }}
      >
        <label className="block">
          <span className="sr-only">Ask in plain language</span>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/45" size={20} />
            <input
              value={props.value}
              onChange={(e) => props.onChange(e.target.value)}
              placeholder={props.placeholder}
              className="w-full rounded-2xl border border-white/15 bg-black/40 pl-12 pr-4 py-4 text-white text-base placeholder:text-white/45 focus:outline-none focus:border-[#fbbf24]/50 focus:ring-2 focus:ring-[#fbbf24]/20"
              autoComplete="off"
            />
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {props.locationLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-white/75">
              <MapPin size={14} className="text-[#fbbf24]" />
              {props.locationLabel}
            </span>
          ) : null}
          {props.onUseMyLocation ? (
            <button
              type="button"
              disabled={props.locationBusy}
              onClick={props.onUseMyLocation}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#fbbf24]/35 px-3 py-1 text-[#fbbf24] hover:bg-[#fbbf24]/10 disabled:opacity-50"
            >
              {props.locationBusy ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
              Use my location
            </button>
          ) : null}
          {props.metroChips?.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={chip.onSelect}
              className={`rounded-full px-3 py-1 border text-xs font-semibold transition-colors ${
                chip.active
                  ? 'border-[#fbbf24]/50 bg-[#fbbf24]/15 text-[#fbbf24]'
                  : 'border-white/15 text-white/70 hover:border-white/30 hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {props.exampleChips && props.exampleChips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {props.exampleChips.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => props.onChange(ex)}
                className="text-xs text-white/60 hover:text-[#fbbf24] underline underline-offset-2"
              >
                {ex}
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={props.busy || !props.value.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#fbbf24] text-black font-bold px-6 py-3 hover:bg-[#f5d565] disabled:opacity-40"
        >
          {props.busy ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Run
        </button>
      </form>

      {props.footer}
    </section>
  );
}
