import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { SITEWIDE_NEGATIVE_ITEMS_EXCLUSION } from './pageRegistry';

export function SitewideNegativeItemsGuardPanel() {
  return (
    <section className="rounded-[34px] border border-rose-500/25 bg-rose-500/10 p-6 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rose-500/10 via-transparent to-black/30" />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-rose-200 font-black"><Lock size={14} />Protected layout</div>
          <h2 className="mt-3 text-2xl md:text-3xl font-light text-white">Negative-items extracted report view stays untouched.</h2>
          <p className="mt-3 text-white/68 text-sm leading-relaxed">This sitewide refactor explicitly excludes <span className="font-mono text-white/90">{SITEWIDE_NEGATIVE_ITEMS_EXCLUSION.path}</span>. Cursor should not modify the negative items, collections, late payment, inquiry, or extracted report review layout unless Preston separately approves that exact area.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/25 p-5 min-w-[260px]">
          <div className="flex items-center gap-2 text-emerald-200 text-sm font-semibold"><ShieldCheck size={16} /> Guard active</div>
          <div className="mt-3 text-white/55 text-xs leading-relaxed">Protected tabs: {SITEWIDE_NEGATIVE_ITEMS_EXCLUSION.protectedTabs.join(', ')}</div>
        </div>
      </div>
    </section>
  );
}
