import React from 'react';
import type { StudioUxKpi } from './types';

const toneClass: Record<StudioUxKpi['tone'], string> = {
  amber: 'from-amber-500/18 to-yellow-500/5 border-amber-400/25 text-amber-100',
  emerald: 'from-emerald-500/18 to-teal-500/5 border-emerald-400/25 text-emerald-100',
  sky: 'from-sky-500/18 to-blue-500/5 border-sky-400/25 text-sky-100',
  violet: 'from-violet-500/18 to-fuchsia-500/5 border-violet-400/25 text-violet-100',
  rose: 'from-rose-500/18 to-red-500/5 border-rose-400/25 text-rose-100',
  slate: 'from-white/10 to-white/[0.02] border-white/10 text-white/80',
};

export function StudioKpiCards({ items }: { items: StudioUxKpi[] }) {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((k) => (
        <div key={k.label} className={`rounded-3xl border bg-gradient-to-br ${toneClass[k.tone]} p-5 shadow-2xl shadow-black/20`}>
          <div className="text-[10px] uppercase tracking-[0.24em] text-white/45 font-black">{k.label}</div>
          <div className="mt-3 text-3xl font-black text-white">{k.value}</div>
          <div className="mt-2 text-sm text-white/60 leading-relaxed">{k.hint}</div>
        </div>
      ))}
    </div>
  );
}

export function StudioActionDeck<T extends { id: string; title: string; summary?: string }>({
  items,
  activeId,
  onSelect,
  renderMeta,
}: {
  items: T[];
  activeId?: string | null;
  onSelect?: (item: T) => void;
  renderMeta?: (item: T) => React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-4 min-w-full">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item)}
              className={`text-left shrink-0 w-[280px] rounded-3xl border p-5 transition-all ${
                active ? 'border-amber-400/40 bg-amber-500/10 shadow-lg shadow-amber-500/5' : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06]'
              }`}
            >
              <div className="text-white font-black leading-tight">{item.title}</div>
              {item.summary ? <div className="mt-3 text-sm text-white/60 leading-relaxed line-clamp-3">{item.summary}</div> : null}
              {renderMeta ? <div className="mt-4">{renderMeta(item)}</div> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StudioSection({ eyebrow, title, children, right }: { eyebrow?: string; title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-black/35 backdrop-blur-xl p-6 md:p-8 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300 font-black">{eyebrow}</div> : null}
          <h2 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
