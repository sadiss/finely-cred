import React, { useMemo, useState } from 'react';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { listEvidenceByPartner } from '../../data/evidenceRepo';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { KpiCard } from '../../components/ui/KpiCards';
import { openUrlInNewTab } from '../../utils/download';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function PartnerAnalysisVaultPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [showAll, setShowAll] = useState(false);
  const LIMIT = 12;

  const items = useMemo(() => {
    if (!partner) return [];
    const all = listEvidenceByPartner(partner.id);
    return all
      .filter((e) => (e.tags ?? []).includes('analysis_report'))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [partner]);

  const openPdf = async (blobRef: string, mimeType?: string) => {
    const res = await getBlobUrl(blobRef, { mimeType: mimeType || 'application/pdf' });
    if (!res?.url) return;
    openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Analysis Vault"
      subtitle="Your saved Credit Analysis Reports (PDF). Generate new ones from Reports, and keep versions here."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/reports')}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back to Reports
            </button>
            {items.length > LIMIT ? (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-sm font-semibold text-white/80 transition-all"
              >
                {showAll ? 'Show less' : `Show all (${items.length})`}
              </button>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Saved reports" value={items.length} hint="Credit Analysis PDFs" tone="violet" />
            <KpiCard label="Latest" value={items.length ? 1 : 0} hint={items[0]?.createdAt ? fmtWhen(items[0].createdAt) : '—'} tone="amber" />
            <KpiCard label="Source reports" value={new Set(items.map((x) => x.reportId).filter(Boolean)).size} hint="Different uploaded reports" tone="sky" />
            <KpiCard label="Vault" value={items.length} hint="Stored in Documents" tone="emerald" onClick={() => navigate('/portal/documents')} />
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/70">
              No analysis reports saved yet. Go to <span className="text-white font-semibold">Reports</span> and click{' '}
              <span className="text-white font-semibold">Generate PDF</span> on a parsed report.
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {(showAll ? items : items.slice(0, LIMIT)).map((e) => (
                <div key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-amber-400">
                        <FileText size={18} />
                        <div className="text-white font-semibold truncate">{e.caption || e.filename}</div>
                      </div>
                      <div className="mt-2 text-[12px] text-white/60">
                        {fmtWhen(e.createdAt)}
                        {e.reportId ? <span className="text-white/30"> • </span> : null}
                        {e.reportId ? <span className="text-white/50">report: {String(e.reportId).slice(0, 8)}</span> : null}
                      </div>
                      <div className="mt-1 text-[12px] text-white/50 truncate">{e.filename}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openPdf(e.blobRef, e.mimeType)}
                      className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold hover:brightness-110 transition-all"
                    >
                      Open <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

