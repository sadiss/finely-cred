import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, Handshake, Mail, Phone, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import {
  listPartnerOutreachLibrary,
  partnerOutreachLibraryFacets,
  partnerOutreachLibraryMasterCount,
  partnerOutreachLibraryStats,
} from '../../data/partnerOutreachLibraryRepo';
import { partnerOutreachExportCsv, type PartnerOutreachCorridor } from '../../domain/partnerOutreachLibrary';

type CorridorFilter = 'all' | PartnerOutreachCorridor;

export default function AdminPartnerOutreachLibraryPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const navigate = useNavigate();
  const [corridor, setCorridor] = useState<CorridorFilter>('all');
  const [metro, setMetro] = useState('all');
  const [category, setCategory] = useState('all');
  const [phoneEmailOnly, setPhoneEmailOnly] = useState(false);
  const [holdOnly, setHoldOnly] = useState(true);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const all = useMemo(() => listPartnerOutreachLibrary(), []);
  const facets = useMemo(() => partnerOutreachLibraryFacets(all), [all]);
  const masterCount = partnerOutreachLibraryMasterCount();

  const filtered = useMemo(
    () =>
      listPartnerOutreachLibrary({
        corridor,
        metro,
        category,
        hasPhoneAndEmail: phoneEmailOnly,
        outreachHold: holdOnly,
        q,
      }),
    [corridor, metro, category, phoneEmailOnly, holdOnly, q],
  );

  const stats = useMemo(() => partnerOutreachLibraryStats(filtered), [filtered]);
  const selected = filtered.find((r) => r.partnerId === selectedId) ?? filtered[0] ?? null;

  const exportVisible = () => {
    const csv = partnerOutreachExportCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finely-partner-outreach-library.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminWorkstationFrame
      embedded={embedded}
      kind="partner-outreach-library-workstation"
      badge="Admin"
      title="Partner library"
      subtitle="Researched referral partners — browse here. Outreach is HOLD. Nothing is emailed."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/ebook-conversions')}>
              Ebook conversion
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={exportVisible}>
              <Download size={14} /> Export visible
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <ShieldAlert size={18} className="text-amber-300 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>
            {masterCount} researched partners are loaded on this site. Filter instead of downloading a spreadsheet. Outreach stays HOLD — Finely Cred does not auto-email partners.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <FinelyOsOverviewStatTile icon={Handshake} label="Showing" value={stats.total} accent="violet" hint={`of ${masterCount} researched`} />
          <FinelyOsOverviewStatTile icon={Handshake} label="Haitian corridor" value={stats.haitian} accent="emerald" hint="Door A / Haitian community" />
          <FinelyOsOverviewStatTile icon={Handshake} label="General corridor" value={stats.general} accent="sky" hint="National / metro packs" />
          <FinelyOsOverviewStatTile icon={Phone} label="Phone + email" value={stats.contactReady} accent="amber" iconAccent="violet" hint="Ready to call, not email-blast" />
          <FinelyOsOverviewStatTile icon={Mail} label="Outreach HOLD" value={stats.outreachHold} accent="rose" hint="Not sent" />
        </div>

        <div className={`${finelyOsCatalogCard('sky')} p-4 space-y-3`} data-fc-accent="sky">
          <div className="flex flex-wrap gap-2">
            {(['all', 'haitian', 'general'] as const).map((c) => (
              <button key={c} type="button" className={finelyOsViewTab(corridor === c)} onClick={() => setCorridor(c)}>
                {c === 'all' ? 'All corridors' : c === 'haitian' ? 'Haitian' : 'General'}
              </button>
            ))}
            <button type="button" className={finelyOsViewTab(phoneEmailOnly)} onClick={() => setPhoneEmailOnly((v) => !v)}>
              Has phone + email
            </button>
            <button type="button" className={finelyOsViewTab(holdOnly)} onClick={() => setHoldOnly((v) => !v)}>
              Outreach HOLD
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="Search name, business, city, phone…"
            />
            <select value={metro} onChange={(e) => setMetro(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
              <option value="all">All metros</option>
              {facets.metros.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
              <option value="all">All categories</option>
              {facets.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#0a100e] p-4 space-y-3 text-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-amber-100/70 border-b border-white/10">
                    <th className="py-2 pr-3 font-semibold">Partner</th>
                    <th className="py-2 pr-3 font-semibold">Corridor</th>
                    <th className="py-2 pr-3 font-semibold">Metro</th>
                    <th className="py-2 pr-3 font-semibold">Category</th>
                    <th className="py-2 font-semibold">Contact</th>
                  </tr>
                </thead>
              </table>
            </div>
            <FinelyOsPaginatedStack
              items={filtered}
              pageSize={12}
              emptyMessage="No partners match these filters."
              itemSpacingClassName="space-y-0"
              renderItem={(row) => (
                <button
                  key={row.partnerId}
                  type="button"
                  onClick={() => setSelectedId(row.partnerId)}
                  className={`w-full text-left grid grid-cols-5 gap-2 px-2 py-2.5 border-b border-white/10 hover:bg-white/10 ${
                    selected?.partnerId === row.partnerId ? 'bg-amber-400/15' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{row.businessName || row.personName || row.partnerId}</div>
                    <div className="font-mono text-[11px] text-amber-100/60">{row.partnerId}</div>
                  </div>
                  <div className="capitalize text-white/80">{row.corridor}</div>
                  <div className="truncate text-white/80">{row.metro}</div>
                  <div className="truncate text-white/80">{row.category}</div>
                  <div className="truncate text-white/80">
                    {row.hasPhoneAndEmail ? 'Phone + email' : row.hasPhone ? 'Phone' : row.hasEmail ? 'Email' : 'Missing'}
                  </div>
                </button>
              )}
            />
          </div>

          <aside className={`lg:col-span-4 ${finelyOsCatalogCard('emerald')} p-5 space-y-3`} data-fc-accent="emerald">
            {selected ? (
              <>
                <div className={FINELY_OS_ENTITY_VALUE}>{selected.businessName || selected.personName}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{selected.partnerId}</div>
                <p className={FINELY_OS_ENTITY_BODY}>{selected.whyFit}</p>
                <div className="space-y-1 text-sm">
                  <div className={FINELY_OS_ENTITY_BODY}>{selected.personName || '—'} · {selected.title || '—'}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{selected.city}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{selected.phone || 'No phone'}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{selected.email || 'No email'}</div>
                  {selected.website ? (
                    <a href={selected.website} target="_blank" rel="noreferrer" className="text-amber-200 hover:text-white text-sm">
                      {selected.website}
                    </a>
                  ) : null}
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>{selected.outreachStatus}</div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                  Credit restore referrals only. Do not pitch “credit repair.” Do not send this list as a blast.
                </p>
              </>
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>Select a row to read the fit note.</p>
            )}
          </aside>
        </div>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </AdminWorkstationFrame>
  );
}
