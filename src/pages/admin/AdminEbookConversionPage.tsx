import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Phone, Radio, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { fetchEbookConversionLeads, type EbookConversionFetchResult } from '../../data/ebookConversionRepo';
import {
  buildEbookConversionSnapshot,
  type EbookConversionPeriod,
} from '../../lib/ebookConversionMetrics';
import { BRAND_EBOOK_COVERS } from '../../components/leadmagnet/brandEbookCovers';

const PERIODS: EbookConversionPeriod[] = [7, 14, 30];

export default function AdminEbookConversionPage({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<EbookConversionPeriod>(14);
  const [fetchState, setFetchState] = useState<EbookConversionFetchResult | null>(null);
  const [busy, setBusy] = useState(true);

  const reload = () => {
    setBusy(true);
    void fetchEbookConversionLeads()
      .then(setFetchState)
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const snapshot = useMemo(
    () => buildEbookConversionSnapshot(fetchState?.leads ?? [], period),
    [fetchState, period],
  );

  const sourceHint = fetchState?.supabaseConfigured
    ? fetchState.error
      ? `Supabase read failed — showing local captures. ${fetchState.error}`
      : `Read-only lead_captures (${fetchState.source}). ${fetchState.remoteCount} remote · ${fetchState.localCount} local.`
    : 'Supabase not configured — this browser’s local captures only. Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY for live counts.';

  return (
    <AdminWorkstationFrame
      embedded={embedded}
      kind="ebook-conversion-workstation"
      badge="Admin"
      title="Ebook conversion"
      subtitle="How many people claimed the free English and Kreyòl guides — and whether they left a phone."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/partner-library')}>
              Partner library
            </button>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={reload} disabled={busy}>
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <Sparkles size={18} className="text-amber-300 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>{sourceHint}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PERIODS.map((d) => (
            <button key={d} type="button" className={finelyOsViewTab(period === d)} onClick={() => setPeriod(d)}>
              Last {d} days
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <FinelyOsOverviewStatTile icon={BookOpen} label="All captures" value={snapshot.total} accent="violet" hint={`${period}-day window`} />
          <FinelyOsOverviewStatTile icon={BookOpen} label="Free English guide" value={snapshot.freeGuide} accent="amber" iconAccent="violet" hint="/free-guide · credit_dispute" />
          <FinelyOsOverviewStatTile icon={BookOpen} label="Free Kreyòl guide" value={snapshot.kreyolGuide} accent="emerald" hint="/free-kreyol-guide · kreyol_companion" />
          <FinelyOsOverviewStatTile icon={Phone} label="With phone" value={`${snapshot.phonePct}%`} accent="sky" hint={`${snapshot.withPhone} of ${snapshot.total}`} />
          <FinelyOsOverviewStatTile icon={Radio} label="Other magnets" value={snapshot.otherMagnets} accent="rose" hint="Debt, business, partner-refer, untagged" />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <a href="/free-guide" className={`${finelyOsCatalogCard('amber')} overflow-hidden group`} data-fc-accent="amber">
            <img
              src={BRAND_EBOOK_COVERS.en}
              alt="Restore for Wealth — English cover"
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <div className={FINELY_OS_ENTITY_TITLE}>Restore for Wealth</div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>English `/free-guide` · wealth stairs · gold + ink</p>
            </div>
          </a>
          <a href="/free-kreyol-guide" className={`${finelyOsCatalogCard('emerald')} overflow-hidden group`} data-fc-accent="emerald">
            <img
              src={BRAND_EBOOK_COVERS.kreyol}
              alt="Gid Kredi an Kreyòl — cover"
              className="w-full aspect-video object-cover"
            />
            <div className="p-4">
              <div className={FINELY_OS_ENTITY_TITLE}>Gid Kredi an Kreyòl</div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>Haitian `/free-kreyol-guide` · desk culture · gold + ink</p>
            </div>
          </a>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <div className={`lg:col-span-8 ${finelyOsCatalogCard('violet')} p-5 space-y-4`} data-fc-accent="violet">
            <div>
              <div className={FINELY_OS_ENTITY_TITLE}>By funnel_id</div>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} mt-1`}>English and Haitian guides first. Counts use lead_captures when Supabase is readable.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className={`${FINELY_OS_ENTITY_SUBLABEL} border-b border-white/10`}>
                    <th className="py-2 pr-3 font-semibold">Funnel</th>
                    <th className="py-2 pr-3 font-semibold">Path</th>
                    <th className="py-2 pr-3 font-semibold tabular-nums">Captures</th>
                    <th className="py-2 pr-3 font-semibold tabular-nums">Phone</th>
                    <th className="py-2 font-semibold tabular-nums">UTM / ref</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.byFunnel.map((row) => (
                    <tr key={row.funnelId} className="border-b border-white/5">
                      <td className="py-2.5 pr-3">
                        <div className={FINELY_OS_ENTITY_VALUE}>{row.label}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>{row.funnelId}</div>
                      </td>
                      <td className={`py-2.5 pr-3 font-mono text-xs ${FINELY_OS_ENTITY_BODY}`}>{row.path || '—'}</td>
                      <td className={`py-2.5 pr-3 tabular-nums ${FINELY_OS_ENTITY_VALUE}`}>{row.captures}</td>
                      <td className={`py-2.5 pr-3 tabular-nums ${FINELY_OS_ENTITY_BODY}`}>
                        {row.withPhone} · {row.phonePct}%
                      </td>
                      <td className={`py-2.5 tabular-nums ${FINELY_OS_ENTITY_BODY}`}>
                        {row.withUtmOrRef} · {row.utmPct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`lg:col-span-4 ${finelyOsCatalogCard('sky')} p-5 space-y-3`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_TITLE}>UTM / ref</div>
            <p className={FINELY_OS_ENTITY_BODY}>Top attribution keys in this window. Empty means the visitor arrived without a campaign tag.</p>
            {snapshot.utmRows.length ? (
              <div className="space-y-2">
                {snapshot.utmRows.map((row) => (
                  <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className={`${FINELY_OS_ENTITY_BODY} truncate`}>{row.key}</span>
                    <span className={`${FINELY_OS_ENTITY_VALUE} tabular-nums`}>{row.captures}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={FINELY_OS_ENTITY_BODY}>No captures in this window yet.</p>
            )}
          </div>
        </div>

        {!embedded ? <FinelyOsPageFooter /> : null}
      </div>
    </AdminWorkstationFrame>
  );
}
