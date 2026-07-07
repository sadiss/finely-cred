import React, { useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { EMOJI_CATEGORIES, EMOJI_LIST, PREMIUM_EMOJI_CATEGORIES } from './emojiData';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

type Props = {
  onPick: (emoji: string) => void;
  className?: string;
};

export function FinelyPremiumEmojiPicker({ onPick, className = '' }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return EMOJI_LIST.filter((em) => em.includes(q)).slice(0, 120);
  }, [query]);

  return (
    <div className={`rounded-2xl border-2 border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-500/[0.1] via-[#0a1210] to-[#070b09] p-3 shadow-[0_18px_50px_-28px_rgba(217,70,239,0.55)] max-h-56 overflow-y-auto ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} className="text-fuchsia-300" />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Premium emoji studio</span>
      </div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emojis…"
          className="w-full bg-fc-input border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder:text-white/30"
        />
      </div>

      {filtered ? (
        <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto">
          {filtered.map((em, idx) => (
            <button
              key={`${em}_${idx}`}
              type="button"
              onClick={() => onPick(`${em} `)}
              className="w-9 h-9 rounded-xl hover:bg-fuchsia-500/15 text-xl transition-all hover:scale-110"
            >
              {em}
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
          {PREMIUM_EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <span className="text-[9px] uppercase tracking-[0.28em] text-amber-200/85 font-black">{cat.label}</span>
              <div className="grid grid-cols-10 gap-0.5 mt-1.5">
                {cat.emojis.map((em, idx) => (
                  <button
                    key={`${cat.label}_${em}_${idx}`}
                    type="button"
                    onClick={() => onPick(`${em} `)}
                    className="w-8 h-8 rounded-xl hover:bg-amber-500/12 text-lg transition-all hover:scale-110"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {EMOJI_CATEGORIES.slice(0, 3).map((cat) => (
            <div key={cat.label}>
              <span className="text-[9px] uppercase tracking-widest text-white/40">{cat.label}</span>
              <div className="grid grid-cols-10 gap-0.5 mt-1">
                {cat.emojis.slice(0, 30).map((em, idx) => (
                  <button
                    key={`${cat.label}_${em}_${idx}`}
                    type="button"
                    onClick={() => onPick(`${em} `)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 text-lg"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}