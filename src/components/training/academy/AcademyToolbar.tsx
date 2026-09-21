import React from 'react';
import { Gauge, Sparkles } from 'lucide-react';
import { AcademyLangChip } from './AcademyMotion';

export function AcademyToolbar({
  lang,
  setLang,
  progressPct,
  reduceMotion,
  onToggleReduceMotion,
}: {
  lang: 'en' | 'ht';
  setLang: (l: 'en' | 'ht') => void;
  progressPct: number;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[10px] font-black uppercase tracking-widest text-emerald-100/80">
        <Sparkles size={14} className="text-emerald-300" />
        Course {progressPct}%
      </div>
      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-[11px] text-white/60 cursor-pointer select-none">
        <input type="checkbox" checked={reduceMotion} onChange={() => onToggleReduceMotion()} className="rounded" />
        <Gauge size={14} />
        {lang === 'ht' ? 'Mwens mouvman' : 'Reduce motion'}
      </label>
      <div className="inline-flex rounded-xl border border-white/10 overflow-hidden p-0.5 gap-0.5 bg-black/30">
        <AcademyLangChip active={lang === 'en'} onClick={() => setLang('en')} reduceMotion={reduceMotion}>
          EN
        </AcademyLangChip>
        <AcademyLangChip active={lang === 'ht'} onClick={() => setLang('ht')} reduceMotion={reduceMotion}>
          HT
        </AcademyLangChip>
      </div>
    </div>
  );
}
