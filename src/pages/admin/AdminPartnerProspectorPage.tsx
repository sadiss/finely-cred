import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Filter, Play, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { KpiCard } from '../../components/ui';
import { executeProspectReferralPartners } from '../../agents/tools/prospectReferralPartners';
import { getFeatureFlags } from '../../data/settingsRepo';
import {
  latestProspectorBatchId,
  listPartnerProspects,
  listProspectorRuns,
  markProspectsStatus,
} from '../../data/partnerProspectsRepo';
import {
  csvFilename,
  DEFAULT_METRO_IDS,
  PARTNER_VERTICALS,
  prospectsToCsv,
  SFL_METROS,
  VERTICAL_LABELS,
  type IcpFit,
  type PartnerProspect,
  type PartnerVertical,
  type ProspectorRunResult,
} from '../../domain/partnerProspector/index.ts';
import { downloadText } from '../../utils/download';

const VERTICAL_OPTIONS: PartnerVertical[] = [...PARTNER_VERTICALS];

function fitTone(fit: IcpFit): 'emerald' | 'amber' | 'violet' {
  if (fit === 'strong') return 'emerald';
  if (fit === 'maybe') return 'amber';
  return 'violet';
}

export default function AdminPartnerProspectorPage() {
  const navigate = useNavigate();
  const features = useMemo(() => getFeatureFlags(), []);
  const enabled = (features as any).partnerProspector !== false;

  const [metros, setMetros] = useState<string[]>([...DEFAULT_METRO_IDS]);
  const [verticals, setVerticals] = useState<PartnerVertical[]>(['tax', 'bhph', 'realtor', 'mortgage', 'immigration']);
  const [limit, setLimit] = useState(50);
  const [dedupe, setDedupe] = useState(true);
  const [enrich, setEnrich] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<ProspectorRunResult | null>(null);

  const [fitFilter, setFitFilter] = useState<IcpFit | 'all'>('all');
  const [verticalFilter, setVerticalFilter] = useState<PartnerVertical | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const batchId = lastRun?.batchId ?? latestProspectorBatchId();
  const runs = listProspectorRuns();
  const rows = listPartnerProspects({
    batchId: batchId ?? undefined,
    vertical: verticalFilter,
    fit: fitFilter,
  });
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  const kpis = useMemo(() => {
    const all = listPartnerProspects({ batchId: batchId ?? undefined });
    return {
      total: all.length,
      strong: all.filter((p) => p.icpFit === 'strong').length,
      maybe: all.filter((p) => p.icpFit === 'maybe').length,
      missing: all.filter((p) => !p.phone && !p.email).length,
    };
  }, [batchId, lastRun]);

  const toggleMetro = (id: string) => {
    setMetros((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const toggleVertical = (id: PartnerVertical) => {
    setVerticals((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const run = async () => {
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      if (!enabled) throw new Error('Partner Prospector is disabled (Feature Flags).');
      if (!metros.length) throw new Error('Pick at least one metro.');
      if (!verticals.length) throw new Error('Pick at least one vertical.');
      const result = await executeProspectReferralPartners({
        metros,
        verticals,
        limit,
        dedupe,
        enrich,
      });
      setLastRun(result);
      setSelectedId(result.prospects[0]?.id ?? null);
      setNotice(
        `Batch ${result.batchId} · ${result.stats.kept} kept (${result.stats.strong} strong / ${result.stats.maybe} maybe) · ${result.stats.deduped} deduped · ${result.stats.skipped} skipped. Outreach is draft/export only.`,
      );
    } catch (e: any) {
      setErr(e?.message || 'Run failed.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const all = listPartnerProspects({ batchId: batchId ?? undefined, fit: 'all' });
    if (!all.length) return;
    downloadText({
      text: prospectsToCsv(all),
      filename: csvFilename(batchId || 'latest'),
      mimeType: 'text/csv;charset=utf-8',
    });
    markProspectsStatus(
      all.filter((p) => p.status === 'new').map((p) => p.id),
      'exported',
    );
    setNotice(`Exported ${all.length} rows. Nothing was emailed.`);
  };

  return (
    <PageShell
      badge="Admin"
      title="Partner Prospector"
      subtitle="Outbound-quality SFL / Haitian-corridor referral partners — shared engine for admin and site agents. Public data only. Draft/export only."
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="sticky top-20 z-20 rounded-2xl border border-white/10 bg-[#070b09]/90 backdrop-blur-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run()}
              disabled={busy || !enabled}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
            >
              <Play size={14} /> {busy ? 'Running…' : 'Run Partner Prospector'}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!rows.length}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/crm')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70"
            >
              CRM <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {!enabled && (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 text-white/75 text-sm">
            Partner Prospector is disabled. Enable it in Admin Settings → Feature Flags.
          </div>
        )}

        {notice && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5" />
            <div>{notice}</div>
          </div>
        )}
        {err && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-rose-100 text-sm flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5" />
            <div>{err}</div>
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-4">
          <KpiCard label="In batch" value={kpis.total} hint={batchId ? `Batch ${batchId.slice(-8)}` : 'No run yet'} tone="amber" />
          <KpiCard label="Strong" value={kpis.strong} hint="Contact + site + ICP" tone="emerald" />
          <KpiCard label="Maybe" value={kpis.maybe} hint="Website or contact only" tone="violet" />
          <KpiCard label="Missing contact" value={kpis.missing} hint="No public phone/email yet" tone="sky" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-5">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Run configuration</span>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Metros (SFL first)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SFL_METROS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMetro(m.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                    metros.includes(m.id)
                      ? 'bg-amber-500/15 text-amber-100 border-amber-500/30'
                      : 'bg-white/[0.02] text-white/60 border-white/10'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">Verticals</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {VERTICAL_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVertical(v)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                    verticals.includes(v)
                      ? 'bg-amber-500/15 text-amber-100 border-amber-500/30'
                      : 'bg-white/[0.02] text-white/60 border-white/10'
                  }`}
                >
                  {VERTICAL_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="text-sm text-white/70">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Limit</div>
              <input
                type="number"
                min={1}
                max={80}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(80, Number(e.target.value || 50))))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/80"
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-white/70 pt-6">
              <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
              Dedupe vs CRM + prior batches
            </label>
            <label className="flex items-center gap-3 text-sm text-white/70 pt-6">
              <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} />
              Enrich official sites (public mailto/tel only)
            </label>
          </div>
          <p className="text-white/50 text-xs">
            Seeded SFL directory always runs. Optional search API (Serper via <span className="font-mono">partner-prospector</span> edge
            function) adds more when configured. Scheduled GitHub Action stays off until secrets are set. No auto-email.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-white/40" />
          <select
            value={fitFilter}
            onChange={(e) => setFitFilter(e.target.value as IcpFit | 'all')}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
          >
            <option value="all">All fit</option>
            <option value="strong">Strong</option>
            <option value="maybe">Maybe</option>
            <option value="skip">Skip</option>
          </select>
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value as PartnerVertical | 'all')}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
          >
            <option value="all">All verticals</option>
            {VERTICAL_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABELS[v]}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-white/40">{runs.length} stored runs</div>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-3">
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">
                Run a batch to see referral partners. Default ~50, balanced across verticals.
              </div>
            ) : (
              VERTICAL_OPTIONS.filter((v) => rows.some((r) => r.vertical === v)).map((v) => {
                const group = rows.filter((r) => r.vertical === v);
                return (
                  <details key={v} className="rounded-2xl border border-white/10 bg-black/30 p-5" open>
                    <summary className="cursor-pointer select-none text-white font-semibold">
                      {VERTICAL_LABELS[v]} · {group.length}
                    </summary>
                    <div className="mt-4 grid gap-3">
                      {group.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedId(p.id)}
                          className={`text-left rounded-2xl border p-4 transition-colors ${
                            selected?.id === p.id
                              ? 'border-amber-500/40 bg-amber-500/10'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-semibold">{p.businessName}</div>
                              <div className="mt-1 text-white/50 text-xs">
                                {p.city} · {p.category}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                                p.icpFit === 'strong'
                                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
                                  : 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                              }`}
                            >
                              {p.icpFit}
                            </span>
                          </div>
                          <div className="mt-2 text-white/60 text-sm line-clamp-2">{p.whyFit}</div>
                        </button>
                      ))}
                    </div>
                  </details>
                );
              })
            )}
          </div>

          <div className="lg:col-span-5">
            <DetailPanel prospect={selected} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function DetailPanel({ prospect }: { prospect: PartnerProspect | null }) {
  if (!prospect) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/55 text-sm">
        Select a prospect to review facts and the draft stub. Nothing is sent from this screen.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">Focused prospect</div>
        <div className="mt-1 text-white font-semibold text-lg">{prospect.businessName}</div>
        <div className="text-white/50 text-sm">
          {prospect.city} · {prospect.category} · {prospect.icpFit}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Website" value={prospect.website} href={prospect.website} />
        <Field label="Phone" value={prospect.phone || '—'} />
        <Field label="Email" value={prospect.email || '—'} />
        <Field label="Status" value={prospect.status} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">Why fit</div>
        <p className="mt-2 text-white/70 text-sm">{prospect.whyFit}</p>
      </div>
      <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <summary className="cursor-pointer text-white font-semibold text-sm">Draft stub (not sent)</summary>
        <pre className="mt-3 whitespace-pre-wrap text-white/70 text-sm">{prospect.draftStub}</pre>
      </details>
    </div>
  );
}

function Field({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 text-amber-200 text-xs break-all hover:underline">
          {value}
        </a>
      ) : (
        <div className="mt-1 text-white/80 text-xs break-all">{value}</div>
      )}
    </div>
  );
}
