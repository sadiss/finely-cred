import React, { useMemo, useState } from 'react';
import { BarChart3, Link2, MousePointerClick, RefreshCw, UserPlus, type LucideIcon } from 'lucide-react';
import { FUNNEL_LABELS, findCity } from './citySourceVault';
import { buildLeadEngineReport, listShortLinks, recordShortLinkLead } from './leadEngineSystemRepo';
import { publicShortUrl } from './shortLinkRouter';

export function TrackedLinksReportPanel() {
  const [version, setVersion] = useState(0);
  const links = useMemo(() => listShortLinks(), [version]);
  const report = useMemo(() => buildLeadEngineReport('Tracked Links'), [version]);
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black"><BarChart3 size={16} /> Link, funnel, and attribution reporting</div>
          <h2 className="mt-2 text-2xl font-black text-white">Know exactly what the swarm produced</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">Every action recommendation gets a short link. Every lead capture should pass slug/source/city/funnel back into reporting.</p>
        </div>
        <button type="button" onClick={() => setVersion((v) => v + 1)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]"><RefreshCw size={14} /> Refresh</button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {([
          { label: 'Short links', value: report.totals.shortLinks, Icon: Link2 },
          { label: 'Clicks', value: report.cities.reduce((sum, c) => sum + c.clicks, 0), Icon: MousePointerClick },
          { label: 'Leads', value: report.totals.leads, Icon: UserPlus },
          { label: 'Bookings', value: report.totals.bookings, Icon: BarChart3 },
        ] satisfies Array<{ label: string; value: number; Icon: LucideIcon }>).map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40"><Icon size={13} /> {label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-white font-bold">Tracked links</div>
        <div className="mt-4 space-y-3">
          {links.length === 0 ? <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">No tracked links yet. Build actions first.</div> : links.map((link) => (
            <div key={link.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold">{FUNNEL_LABELS[link.funnel]}</div>
                  <div className="mt-1 text-xs text-white/45">{link.cityId ? `${findCity(link.cityId).label}, ${findCity(link.cityId).state}` : 'All cities'} • {link.source ?? 'lead engine'}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-white/55">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"><div className="text-white font-bold">{link.clicks}</div><div>clicks</div></div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"><div className="text-white font-bold">{link.leads}</div><div>leads</div></div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"><div className="text-white font-bold">{link.bookings}</div><div>booked</div></div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/60 break-all">{publicShortUrl(link, window.location.origin)}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => { recordShortLinkLead(link.slug); setVersion((v) => v + 1); }} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/15"><UserPlus size={13} /> Simulate lead capture</button>
                <a href={link.destinationUrl} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]"><Link2 size={13} /> Open destination</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
