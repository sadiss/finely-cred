import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, Eye, LayoutDashboard, RefreshCcw, ShieldCheck } from 'lucide-react';
import {
  addCmoSiteChanges,
  listCmoPageSignals,
  saveCmoLayoutAudit,
  saveCmoPageSignal,
} from '../../data/cmoFinalRepo';
import { CmoLayoutAudit, CmoPageSignal, CmoSiteChange } from '../../domain/cmoFinal';
import {
  auditCurrentPageLayout,
  comparePageSignals,
  createPageSignalFromDocument,
  watchDomForCmoChanges,
} from '../../lib/cmo/siteChangeDetector';

interface CMOSiteWatchPanelProps {
  route?: string;
  autoWatch?: boolean;
  onSignal?: (signal: CmoPageSignal) => void;
}

export function CMOSiteWatchPanel({ route, autoWatch = true, onSignal }: CMOSiteWatchPanelProps) {
  const resolvedRoute = route ?? (typeof window !== 'undefined' ? window.location.pathname : '/admin/marketing-agent');
  const [signal, setSignal] = useState<CmoPageSignal | undefined>();
  const [audit, setAudit] = useState<CmoLayoutAudit | undefined>();
  const [changes, setChanges] = useState<CmoSiteChange[]>([]);
  const previous = useMemo(() => listCmoPageSignals().find((item) => item.route === resolvedRoute), [resolvedRoute, signal?.scannedAt]);

  const scan = () => {
    if (typeof document === 'undefined') return;
    const nextSignal = createPageSignalFromDocument(document, resolvedRoute);
    const nextChanges = comparePageSignals(previous, nextSignal);
    const nextAudit = auditCurrentPageLayout(nextSignal);
    saveCmoPageSignal(nextSignal);
    saveCmoLayoutAudit(nextAudit);
    addCmoSiteChanges(nextChanges);
    setSignal(nextSignal);
    setAudit(nextAudit);
    setChanges(nextChanges);
    onSignal?.(nextSignal);
  };

  useEffect(() => {
    scan();
    if (!autoWatch) return undefined;
    return watchDomForCmoChanges(scan);
  }, [resolvedRoute]);

  const score = audit?.score ?? 0;
  const scoreLabel = score >= 90 ? 'Luxury-ready' : score >= 75 ? 'Good, needs polish' : score >= 60 ? 'Leaking conversion' : 'Fix immediately';

  return (
    <section className="fc-panel rounded-3xl border border-white/10 bg-slate-950/85 p-5 shadow-xl shadow-black/25">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
            <Eye className="h-3.5 w-3.5" /> Site Watch
          </div>
          <h3 className="text-xl font-black text-white">CMO eyes on this page</h3>
          <p className="mt-1 text-sm text-slate-300">Detects site changes, CTA drift, affiliate/Shorts gaps, and layout quality issues.</p>
        </div>
        <button type="button" onClick={scan} className="fc-button-soft inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold">
          <RefreshCcw className="h-4 w-4" /> Scan now
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={<LayoutDashboard className="h-4 w-4" />} label="Layout score" value={`${score}/100`} hint={scoreLabel} />
        <MetricCard icon={<Activity className="h-4 w-4" />} label="CTA candidates" value={String(signal?.ctas.length ?? 0)} hint="Book/apply/watch/join" />
        <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Tracked links" value={String(signal?.links.length ?? 0)} hint="Affiliate, Shorts, booking" />
        <MetricCard icon={<AlertTriangle className="h-4 w-4" />} label="Changes" value={String(changes.length)} hint="Since last snapshot" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <h4 className="font-bold text-white">What changed</h4>
          <div className="mt-3 space-y-2">
            {changes.length === 0 ? (
              <p className="text-sm text-slate-400">No meaningful change detected yet. Quiet page, for once behaving itself.</p>
            ) : (
              changes.slice(0, 5).map((change) => (
                <div key={change.id} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-amber-100">{change.changeType.replaceAll('_', ' ')}</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs uppercase text-slate-300">{change.severity}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{change.recommendedAction}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
          <h4 className="font-bold text-white">Beauty + usability fixes</h4>
          <div className="mt-3 space-y-2">
            {(audit?.recommendedFixes ?? ['Run a scan to generate exact layout fixes.']).slice(0, 6).map((fix) => (
              <div key={fix} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-5 text-slate-300">
                {fix}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <span className="text-amber-200">{icon}</span> {label}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
