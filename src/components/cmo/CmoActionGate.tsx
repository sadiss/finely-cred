import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, MessageSquareText, ShieldCheck, Zap } from 'lucide-react';
import { routeEngagementText } from '../../lib/cmoPhase2/cmoExecutionBridge';
import { scoreConversionCopy150 } from '../../lib/cmoPhase2/cmoLearningEngine';

export function CmoActionGate() {
  const [copy, setCopy] = useState('Most business owners apply for funding before they are actually ready. Book a Finely Cred funding readiness review before you collect another expensive denial. Results vary, strategy matters.');
  const [engagement, setEngagement] = useState('How much is it and can you help me get funding?');
  const [notice, setNotice] = useState<string | null>(null);
  const scored = useMemo(() => scoreConversionCopy150(copy), [copy]);

  const classify = () => {
    const out = routeEngagementText({ text: engagement, source: 'manual' });
    setNotice(`Classified as ${out.intent} (${Math.round(out.confidence * 100)}%). Reply draft saved for review.`);
  };

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="fc-panel p-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><ShieldCheck size={14} /> Copy/compliance gate</div>
        <textarea value={copy} onChange={(e) => setCopy(e.target.value)} className="mt-3 fc-input min-h-[180px] text-sm" />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="fc-card p-3"><div className="text-[10px] uppercase tracking-widest text-white/40">Score</div><div className="mt-1 text-2xl font-black text-white">{scored.score}/150</div></div>
          <div className="fc-card p-3"><div className="text-[10px] uppercase tracking-widest text-white/40">Risk</div><div className="mt-1 text-lg font-black text-amber-200 capitalize">{scored.riskLevel}</div></div>
          <div className="fc-card p-3"><div className="text-[10px] uppercase tracking-widest text-white/40">Flags</div><div className="mt-1 text-lg font-black text-white">{scored.complianceFlags.length}</div></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <List title="Strengths" items={scored.strengths} good />
          <List title="Fixes" items={scored.fixes} />
        </div>
      </div>
      <div className="fc-panel p-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/45"><MessageSquareText size={14} /> Inbox triage gate</div>
        <textarea value={engagement} onChange={(e) => setEngagement(e.target.value)} className="mt-3 fc-input min-h-[180px] text-sm" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={classify} className="fc-button-brand text-xs"><Zap size={14} /> Classify + draft reply</button>
          {notice ? <span className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100"><CheckCircle2 size={14} /> {notice}</span> : null}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-white/60">
          This is where imported comments, DMs, SMS replies, and email replies should land before any response is approved or sent.
        </div>
      </div>
    </section>
  );
}

function List({ title, items, good }: { title: string; items: string[]; good?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/40">{good ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {title}</div>
      <ul className="mt-2 space-y-1 text-xs text-white/58">
        {items.length ? items.map((item, idx) => <li key={idx}>• {item}</li>) : <li>None yet.</li>}
      </ul>
    </div>
  );
}
