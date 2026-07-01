import React from 'react';
import { MapPin, Target } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { DEFAULT_OVERNIGHT50_CITIES } from '../../features/overnight50/queryExpander';

export default function AdminGeoWarRoomPage() {
  return (
    <PageShell badge="Admin" title="Geo War Room" subtitle="City clusters, offer focus, saturation warnings, and route-to-agent planning.">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-black/40 to-amber-500/10 p-6">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-[0.24em]"><MapPin size={16} /> City domination map</div>
          <h2 className="mt-3 text-3xl font-black text-white">Start with five cities, then expand only when the math asks for it.</h2>
          <p className="mt-2 text-white/65 max-w-3xl">Default cities: Dallas, Houston, Atlanta, Phoenix, Charlotte. Each city gets localized pages, source queues, budget cells, and attribution.</p>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          {DEFAULT_OVERNIGHT50_CITIES.map((city) => <article key={city} className="rounded-3xl border border-white/10 bg-black/30 p-5"><Target className="text-amber-300" /><h3 className="mt-3 text-white font-black text-xl">{city}</h3><div className="mt-2 text-white/55 text-sm">Focus: credit repair, business credit, funding readiness, partner recruiting, AU sellers.</div><div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[10px] uppercase tracking-widest text-white/40">Saturation: waiting for data</div></article>)}
        </div>
      </div>
    </PageShell>
  );
}
