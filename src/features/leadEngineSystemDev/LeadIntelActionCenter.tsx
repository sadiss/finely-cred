import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Download, Link2, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { FUNNEL_LABELS, findCity } from './citySourceVault';
import { approveAction, buildLeadEngineReport, listActions, listCandidates, listHandoffs } from './leadEngineSystemRepo';
import { buildActionForCandidate, buildTopActions, importAndHandoffCandidate, routeTopCandidates } from './actionCenterOps';
import { publicShortUrl } from './shortLinkRouter';

export function LeadIntelActionCenter() {
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const candidates = useMemo(() => listCandidates(), [version]);
  const actions = useMemo(() => listActions(), [version]);
  const handoffs = useMemo(() => listHandoffs(), [version]);
  const report = useMemo(() => buildLeadEngineReport('Action Center'), [version]);
  const refresh = () => setVersion((v) => v + 1);

  const top = candidates.filter((c) => c.score >= 60).slice(0, 30);

  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300 text-[10px] uppercase tracking-widest font-black">
            <ClipboardList size={16} /> Lead Intel Action Center
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Turn discovered leads into exact next steps</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/60">
            This is the missing dev layer: each candidate gets the right funnel, owner, short link, message draft, CRM import, and nurture handoff.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const made = buildTopActions(25, window.location.origin);
              setNotice(`Built ${made.length} action recommendations with tracked short links.`);
              refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110"
          >
            <Sparkles size={14} /> Build Top Actions
          </button>
          <button
            type="button"
            onClick={() => {
              const routed = routeTopCandidates(12);
              setNotice(`Routed ${routed.length} candidates into CRM and nurture handoff.`);
              refresh();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/15"
          >
            <Download size={14} /> Route Top To CRM
          </button>
        </div>
      </div>

      {notice && <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</div>}

      <div className="grid gap-3 md:grid-cols-5">
        {[
          ['Hot candidates', report.totals.hotCandidates],
          ['Actions', actions.length],
          ['Draft approvals', actions.filter((a) => a.approvalStatus === 'draft').length],
          ['Handoffs', handoffs.length],
          ['Tracked links', report.totals.shortLinks],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-white font-bold">Top candidates needing action</div>
          <div className="mt-4 max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {top.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">No hot candidates yet. Start the swarm and run ticks.</div>
            ) : top.map((candidate) => (
              <div key={candidate.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{candidate.title}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">{findCity(candidate.cityId).label} • {candidate.source} • score {candidate.score}</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100">{FUNNEL_LABELS[candidate.funnel]}</div>
                </div>
                <div className="mt-3 text-sm text-white/60 line-clamp-2">{candidate.snippet}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.fitReasons.slice(0, 3).map((r) => <span key={r} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/55">{r}</span>)}
                </div>
                {candidate.riskFlags.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100 flex gap-2"><ShieldAlert size={14} /> {candidate.riskFlags.join(', ')}</div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => { buildActionForCandidate(candidate.id, window.location.origin); setNotice('Action recommendation built.'); refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]"><Link2 size={13} /> Action + Link</button>
                  <button type="button" onClick={() => { importAndHandoffCandidate(candidate.id); setNotice('Imported to CRM and drafted nurture handoff.'); refresh(); }} className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/15"><ArrowRight size={13} /> CRM + Nurture</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-white font-bold">Action recommendations</div>
          <div className="mt-4 max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {actions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/55">No actions built yet. Click Build Top Actions.</div>
            ) : actions.map((action) => (
              <div key={action.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">{action.headline}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Owner: {action.owner.ownerName} • {action.owner.label}</div>
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest border ${action.complianceStatus === 'safe' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100' : action.complianceStatus === 'blocked' ? 'border-rose-500/25 bg-rose-500/10 text-rose-100' : 'border-amber-500/25 bg-amber-500/10 text-amber-100'}`}>{action.complianceStatus}</div>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60 break-all">
                  <Link2 size={13} className="inline mr-1 text-amber-300" /> {publicShortUrl(action.shortLink, window.location.origin)}
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white/65 whitespace-pre-wrap">
                  <MessageSquare size={14} className="inline mr-1 text-amber-300" /> {action.messageDraft}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={action.approvalStatus !== 'draft' || action.complianceStatus === 'blocked'} onClick={() => { approveAction(action.id); setNotice('Action approved. External send still follows your send settings.'); refresh(); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black hover:brightness-110 disabled:opacity-50"><CheckCircle2 size={13} /> Approve</button>
                  <span className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/45">{action.approvalStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
