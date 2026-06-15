import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { allPackages, categoryLabels, formatPrice, type PricingPackage } from '../../config/pricingCatalog';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_CHIP,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK} title="Back to Admin Dashboard">
            <ArrowLeft size={16} /> Admin dashboard
          </button>
          <button type="button" onClick={() => navigate('/pricing')} className={FINELY_OS_PRIMARY_BTN} title="Open the public pricing page">
            View public pricing <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FinelyOsOverviewStatTile icon={Package} label="Packages" value={packages.length} accent="amber" iconAccent="amber" />
          <FinelyOsOverviewStatTile icon={Package} label="Categories" value={grouped.length} accent="violet" iconAccent="violet" />
        </div>

        <div className={FINELY_OS_TOOLBAR}>
          <div>
            <div className={FINELY_OS_ENTITY_LABEL}>Catalog</div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              Showing <span className={`${FINELY_OS_ENTITY_VALUE} font-mono font-semibold`}>{packages.length}</span> package{packages.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
            <Search size={14} className="text-emerald-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages…"
              className={`bg-transparent outline-none text-sm min-w-[220px] ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
            />
          </div>
        </div>

        <div className="space-y-4">
          {grouped.map(([cat, pkgs]) => (
            <details key={cat} open className={`${finelyOsCatalogCard('violet')} !p-4 space-y-3`} data-fc-accent="violet">
              <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2">
                  <Package size={16} className="text-fuchsia-300" />
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{groupLabel(cat)}</div>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{pkgs.length}</div>
              </summary>

              <div className={`mt-4 overflow-x-auto ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                <table className="min-w-[860px] w-full text-sm">
                  <thead>
                    <tr className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] uppercase tracking-widest`}>
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
                      <tr key={p.id} className="border-t border-white/[0.08]">
                        <td className={`py-3 pr-4 font-mono ${FINELY_OS_ENTITY_BODY}`}>{p.id}</td>
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_BODY}`}>
                          <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{p.name}</div>
                          {p.tagline ? <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-xs`}>{p.tagline}</div> : null}
                        </td>
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{p.delivery}</td>
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{p.interval}</td>
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_VALUE}`}>{formatPrice(p.priceAmount)}</td>
                        <td className="py-3 pr-4">
                          <span className={p.isPublic ? finelyOsStatusChip('ok') : FINELY_OS_ENTITY_CHIP}>
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
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

