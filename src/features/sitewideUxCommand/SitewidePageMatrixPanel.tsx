import React from 'react';
import { CheckCircle2, FileCode2, Lock, Search, ShieldAlert } from 'lucide-react';
import { SITEWIDE_PAGE_AUDIT, type SitewidePageAuditRecord, type SitewidePageZone } from './pageRegistry';
import { buildPageRefactorChecklist, getSitewideRuleForPage, searchSitewidePages } from './sitewideUxEngine';

const zones: Array<{ id: SitewidePageZone | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'admin', label: 'Admin' },
  { id: 'public', label: 'Public' },
  { id: 'portal', label: 'Portal' },
  { id: 'business', label: 'Business' },
  { id: 'seller', label: 'Seller' },
  { id: 'au', label: 'AU' },
  { id: 'legal', label: 'Legal' },
  { id: 'protected_exclusion', label: 'Protected' },
];

function toneFor(page: SitewidePageAuditRecord) {
  if (page.doNotTouch) return 'border-rose-500/25 bg-rose-500/10';
  if (page.priority === 'critical') return 'border-amber-500/30 bg-amber-500/10';
  if (page.priority === 'high') return 'border-emerald-500/25 bg-emerald-500/10';
  return 'border-white/10 bg-white/[0.035]';
}

export function SitewidePageMatrixPanel() {
  const [query, setQuery] = React.useState('');
  const [zone, setZone] = React.useState<SitewidePageZone | 'all'>('all');
  const [selectedId, setSelectedId] = React.useState(SITEWIDE_PAGE_AUDIT.find((p) => p.priority === 'critical')?.id ?? SITEWIDE_PAGE_AUDIT[0]?.id ?? '');
  const results = searchSitewidePages(query, zone === 'all' ? undefined : zone);
  const selected = SITEWIDE_PAGE_AUDIT.find((p) => p.id === selectedId) ?? results[0] ?? SITEWIDE_PAGE_AUDIT[0];
  const rule = selected ? getSitewideRuleForPage(selected) : null;
  const checklist = selected ? buildPageRefactorChecklist(selected) : [];

  return (
    <section className="rounded-[34px] border border-white/10 bg-black/35 p-5 md:p-6 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.35em] text-amber-300 font-black">Github page sweep</div>
          <h2 className="mt-2 text-2xl md:text-3xl font-light text-white">Public + private layout command matrix</h2>
          <p className="mt-2 text-white/58 text-sm max-w-3xl">Every page is placed into a zone with a replacement pattern. The extracted credit-report negative-items layout is locked.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {zones.map((z) => (
            <button key={z.id} type="button" onClick={() => setZone(z.id)} className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${zone === z.id ? 'bg-amber-500 text-black border-amber-300' : 'bg-white/[0.04] border-white/10 text-white/65 hover:bg-white/[0.08]'}`}>{z.label}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 flex items-center gap-3">
        <Search size={16} className="text-white/35" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search page, route, issue, pattern…" className="w-full bg-transparent py-4 text-sm text-white/80 placeholder:text-white/30 outline-none" />
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <div className="xl:col-span-7 rounded-[28px] border border-white/10 bg-[#070b09]/80 p-4 overflow-hidden">
          <div className="h-[520px] overflow-y-auto pr-2 fc-scroll-area grid sm:grid-cols-2 gap-3 content-start">
            {results.map((page) => (
              <button key={page.id} type="button" onClick={() => setSelectedId(page.id)} className={`text-left rounded-2xl border p-4 transition-all ${selected?.id === page.id ? 'ring-2 ring-amber-400/60 ' : ''}${toneFor(page)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 font-black">{page.zone} • {page.priority}</div>
                    <div className="mt-2 text-white font-semibold truncate">{page.path.replace('src/pages/', '')}</div>
                    <div className="mt-1 text-white/45 text-xs truncate">{page.route}</div>
                  </div>
                  {page.doNotTouch ? <Lock size={15} className="text-rose-300 shrink-0" /> : <FileCode2 size={15} className="text-amber-300 shrink-0" />}
                </div>
                <div className="mt-3 text-white/58 text-xs leading-relaxed line-clamp-2">{page.currentIssue}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="xl:col-span-5 rounded-[28px] border border-white/10 bg-white/[0.035] p-5 space-y-4">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.35em] text-white/40 font-black">Selected page</div>
                  <h3 className="mt-2 text-xl font-semibold text-white break-all">{selected.path}</h3>
                  <div className="mt-1 text-white/50 text-sm">{selected.route}</div>
                </div>
                {selected.doNotTouch ? <ShieldAlert className="text-rose-300 shrink-0" size={22} /> : <CheckCircle2 className="text-emerald-300 shrink-0" size={22} />}
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Replacement rule</div>
                <div className="mt-2 text-white font-semibold">{rule?.title}</div>
                <p className="mt-2 text-white/58 text-sm leading-relaxed">{rule?.replacement}</p>
              </div>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-white/68 text-sm">
                    <CheckCircle2 size={15} className="text-amber-300 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
