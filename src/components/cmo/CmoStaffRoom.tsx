import React, { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Crown, Play, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { askCmoPrime, launchCmoPlaybookByIntent } from '../../lib/cmoPhase2/cmoStaffBrain';
import { buildDefaultPlaybooks, executeApprovedCampaignBuildout, runSafeCmoPlaybook } from '../../lib/cmoPhase2/cmoExecutionBridge';
import { listCmoCampaigns, listCmoDirectives, updateCmoSettings, getCmoSettings } from '../../data/cmoPhase2Repo';

export function CmoStaffRoom() {
  const [input, setInput] = useState('Build the next 200-leads/day campaign safely and tell me what needs approval.');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Array<{ role: 'admin' | 'cmo'; text: string }>>([
    { role: 'cmo', text: 'CMO Prime online. Give me the business goal. I will turn it into campaigns, assets, lead routing, and approved execution steps. Also, I will bully weak CTAs. Professionally.' },
  ]);
  const [version, setVersion] = useState(0);
  const playbooks = useMemo(() => buildDefaultPlaybooks(), []);
  const campaigns = useMemo(() => listCmoCampaigns(), [version]);
  const directives = useMemo(() => listCmoDirectives(8), [version]);
  const settings = useMemo(() => getCmoSettings(), [version]);

  const submit = async () => {
    const msg = input.trim();
    if (!msg) return;
    setLog((cur) => [...cur, { role: 'admin', text: msg }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await askCmoPrime(msg);
      setLog((cur) => [...cur, { role: 'cmo', text: reply.text }]);
      setVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  const launch = (playbookId: string) => {
    const out = runSafeCmoPlaybook({ playbookId });
    setLog((cur) => [...cur, { role: 'cmo', text: `Staged ${out.directive.title}. Assets created: ${out.assets.length}. Nothing external was published. The growth cannon is loaded, but the safety is still on.` }]);
    setVersion((v) => v + 1);
  };

  const launchFromIntent = () => {
    const out = launchCmoPlaybookByIntent(input || 'generate leads');
    setLog((cur) => [...cur, { role: 'cmo', text: `Intent playbook staged: ${out.directive.title}. Campaign: ${out.campaign?.title ?? 'created'}.` }]);
    setVersion((v) => v + 1);
  };

  const execute = (campaignId: string) => {
    const out = executeApprovedCampaignBuildout(campaignId);
    setLog((cur) => [...cur, { role: 'cmo', text: `Approved internal buildout complete. Comms templates: ${out.comms.templateIds.length}. Media project: ${out.mediaProjectId}. Scheduled posts: ${out.scheduledPostIds.length}. Tasks: ${out.taskIds.length}. Still no rogue auto-posting. We are civilized.` }]);
    setVersion((v) => v + 1);
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="fc-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200">
              <Crown size={14} /> CMO Staff Room
            </div>
            <h3 className="mt-3 text-xl font-black text-white">Talk to the CMO like staff.</h3>
            <p className="mt-1 text-sm text-white/55">It can stage campaigns, directives, audiences, Comms drafts, Media projects, scheduler posts, and follow-up tasks.</p>
          </div>
          <button type="button" className="fc-button-soft text-xs" onClick={() => { updateCmoSettings({ approvalMode: settings.approvalMode === 'safe_auto_execute' ? 'approve_then_execute' : 'safe_auto_execute' }); setVersion((v) => v + 1); }}>
            Mode: {settings.approvalMode.replace(/_/g, ' ')}
          </button>
        </div>

        <div className="mt-5 h-[420px] overflow-y-auto rounded-[28px] border border-white/10 bg-black/25 p-4 fc-scroll-area">
          <div className="space-y-3">
            {log.map((m, idx) => (
              <div key={idx} className={`max-w-[92%] rounded-3xl border px-4 py-3 ${m.role === 'admin' ? 'ml-auto border-amber-400/20 bg-amber-400/10 text-amber-50' : 'border-white/10 bg-white/[0.04] text-white/78'}`}>
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/38">{m.role === 'admin' ? <Send size={12} /> : <Bot size={12} />} {m.role}</div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="fc-input min-h-[76px] flex-1 resize-none text-sm" placeholder="Tell CMO Prime what to build, scale, audit, or stage..." />
          <div className="flex w-44 flex-col gap-2">
            <button type="button" disabled={busy} onClick={submit} className="fc-button-brand text-xs disabled:opacity-50"><Send size={14} /> Ask CMO</button>
            <button type="button" onClick={launchFromIntent} className="fc-button-soft text-xs"><Play size={14} /> Stage from intent</button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="fc-panel p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><Sparkles size={14} /> Playbooks</div>
          <div className="mt-3 space-y-2">
            {playbooks.map((p) => (
              <button key={p.id} type="button" onClick={() => launch(p.id)} className="w-full rounded-2xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-amber-400/30 hover:bg-amber-400/10">
                <div className="text-sm font-black text-white">{p.title}</div>
                <div className="mt-1 text-xs text-white/50">Target: {p.dailyLeadTarget}/day • {p.channels.slice(0, 4).join(', ')}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="fc-panel p-5">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><ShieldCheck size={14} /> Approved buildout</div>
          <div className="mt-3 space-y-2">
            {campaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-sm font-semibold text-white">{c.title}</div>
                <div className="mt-1 text-xs text-white/45">{c.status} • {c.score150 ?? '—'}/150 • {c.prospectIds.length} prospects</div>
                <button type="button" onClick={() => execute(c.id)} className="mt-3 fc-button-soft text-[11px]"><CheckCircle2 size={13} /> Create Comms + Media + Schedule + Tasks</button>
              </div>
            ))}
            {!campaigns.length ? <p className="text-sm text-white/55">Stage a playbook first.</p> : null}
          </div>
        </div>
        <div className="fc-panel p-5">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">Recent directives</div>
          <div className="mt-3 space-y-2">
            {directives.map((d) => <div key={d.id} className="rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white/75">{d.title}</div>)}
            {!directives.length ? <p className="text-sm text-white/55">No directives yet.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
