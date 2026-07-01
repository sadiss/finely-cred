import React, { useMemo, useState } from 'react';
import { Eye, Link2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { auditCurrentPageForCmo, type CmoPageAudit } from '../../lib/cmoPhase2/cmoSiteOps';

export function CmoPageInjectionPanel({ label = 'Current page' }: { label?: string }) {
  const [audit, setAudit] = useState<CmoPageAudit | null>(null);
  const summary = useMemo(() => {
    if (!audit) return 'Run a scan to let CMO Prime judge this page with love, math, and mild disrespect for weak CTAs.';
    if (audit.problems.length) return `${audit.problems.length} issue${audit.problems.length === 1 ? '' : 's'} found. Score ${audit.score}/150.`;
    return `Clean scan. Score ${audit.score}/150.`;
  }, [audit]);
  return (
    <section className="fc-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-amber-200"><Eye size={14} /> CMO Eyes</div>
          <h3 className="mt-3 text-xl font-black text-white">{label} conversion scan</h3>
          <p className="mt-1 text-sm text-white/55">{summary}</p>
        </div>
        <button type="button" onClick={() => setAudit(auditCurrentPageForCmo())} className="fc-button-brand text-xs"><RefreshCw size={14} /> Scan this page</button>
      </div>
      {audit ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <Card icon={Wand2} title="Problems" items={audit.problems} empty="No obvious problems." />
          <Card icon={Sparkles} title="Recommendations" items={audit.recommendations} empty="No recommendations yet." />
          <Card icon={Link2} title="CTAs detected" items={audit.ctas.slice(0, 8)} empty="No CTA detected." />
        </div>
      ) : null}
    </section>
  );
}

function Card({ icon: Icon, title, items, empty }: { icon: any; title: string; items: string[]; empty: string }) {
  return (
    <div className="fc-card p-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40"><Icon size={14} /> {title}</div>
      <div className="mt-3 space-y-2 text-sm text-white/60">
        {items.length ? items.map((x, idx) => <div key={idx} className="rounded-2xl border border-white/10 bg-black/25 px-3 py-2">{x}</div>) : <p>{empty}</p>}
      </div>
    </div>
  );
}
