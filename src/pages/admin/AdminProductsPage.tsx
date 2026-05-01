import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { allPackages, categoryLabels, formatPrice, type PricingPackage } from '../../config/pricingCatalog';

function groupLabel(cat: string) {
  return (categoryLabels as any)?.[cat] || cat;
}

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const packages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pkgs = allPackages.slice().sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    if (!q) return pkgs;
    return pkgs.filter((p) => {
      const hay = [p.id, p.category, p.name, p.tagline, p.description, ...(p.highlights || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const grouped = useMemo(() => {
    const m = new Map<string, PricingPackage[]>();
    for (const p of packages) {
      const k = String(p.category || 'other');
      m.set(k, [...(m.get(k) || []), p]);
    }
    return Array.from(m.entries());
  }, [packages]);

  return (
    <PageShell
      badge="Admin"
      title="Products & Packages"
      subtitle="Read-only catalog view (pricingCatalog). Use this to audit what’s currently sellable and public."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={16} /> Admin dashboard
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              title="Open the public pricing page"
            >
              View public pricing <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">Catalog</div>
              <div className="mt-1 text-white/70 text-sm">
                Showing <span className="text-white/90 font-mono">{packages.length}</span> package{packages.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02]">
              <Search size={14} className="text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search packages…"
                className="bg-transparent outline-none text-white/80 placeholder:text-white/30 text-sm min-w-[220px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {grouped.map(([cat, pkgs]) => (
            <details key={cat} open className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
              <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <Package size={16} className="text-amber-300" />
                  <div className="text-white font-semibold">{groupLabel(cat)}</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{pkgs.length}</div>
              </summary>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className="text-white/50 text-[10px] uppercase tracking-widest">
                      <th className="text-left py-2 pr-4">ID</th>
                      <th className="text-left py-2 pr-4">Name</th>
                      <th className="text-left py-2 pr-4">Delivery</th>
                      <th className="text-left py-2 pr-4">Interval</th>
                      <th className="text-left py-2 pr-4">Price</th>
                      <th className="text-left py-2 pr-4">Public</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pkgs.map((p) => (
                      <tr key={p.id} className="border-t border-white/10">
                        <td className="py-3 pr-4 font-mono text-white/80">{p.id}</td>
                        <td className="py-3 pr-4 text-white/80">
                          <div className="font-semibold text-white">{p.name}</div>
                          {p.tagline ? <div className="text-white/50 text-xs">{p.tagline}</div> : null}
                        </td>
                        <td className="py-3 pr-4 text-white/70 font-mono">{p.delivery}</td>
                        <td className="py-3 pr-4 text-white/60 font-mono">{p.interval}</td>
                        <td className="py-3 pr-4 text-white/80">{formatPrice(p.priceAmount)}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                            p.isPublic ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-white/50'
                          }`}>
                            {p.isPublic ? 'yes' : 'no'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

