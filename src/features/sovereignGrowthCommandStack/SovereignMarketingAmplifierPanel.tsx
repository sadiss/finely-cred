import React, { useMemo, useState } from 'react';
import { channelCapabilities, buildDefaultMediaPlans } from './marketingIntelligenceVault';
import { createBatchVideoVoiceBriefs, buildMetaCreativeMatrix } from './mediaGeneratorCommandCenter';

export function SovereignMarketingAmplifierPanel() {
  const [channel, setChannel] = useState(channelCapabilities[0]?.id ?? 'meta');
  const selected = channelCapabilities.find((c) => c.id === channel) ?? channelCapabilities[0];
  const plans = useMemo(() => buildDefaultMediaPlans().filter((p) => p.channel === channel || p.ownerAgentIds.includes('social-commander')).slice(0, 8), [channel]);
  const briefs = useMemo(() => createBatchVideoVoiceBriefs(8), []);
  const matrix = useMemo(() => buildMetaCreativeMatrix(), []);
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/[0.04] to-amber-500/10 p-6">
        <div className="text-[10px] uppercase tracking-widest text-purple-200 font-black">Marketing amplifier</div>
        <h2 className="mt-2 text-3xl font-black text-white">Meta, social, video, voice, and lead capture in one flow</h2>
        <p className="mt-3 text-sm text-white/65 max-w-4xl">This does not simply create captions. It maps channel purpose, required setup, risk notes, owners, creative briefs, CTA links, and production steps so marketing has a real operating system.</p>
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <div className="xl:col-span-4 rounded-3xl border border-white/10 bg-black/30 p-5 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Channels</div>
          {channelCapabilities.map((c) => (
            <button key={c.id} onClick={() => setChannel(c.id)} className={`w-full rounded-2xl border p-4 text-left transition-all ${channel === c.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'}`}>
              <div className="text-white font-bold">{c.name}</div>
              <div className="mt-1 text-xs text-white/55">{c.purpose}</div>
            </button>
          ))}
        </div>
        <div className="xl:col-span-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Selected channel</div>
            <h3 className="mt-2 text-2xl font-black text-white">{selected.name}</h3>
            <p className="mt-2 text-white/65 text-sm">{selected.purpose}</p>
          </div>
          <GridBox title="Strongest for" items={selected.strongestFor} />
          <GridBox title="Content types" items={selected.contentTypes} />
          <GridBox title="Required setup" items={selected.requiredSetup} />
          <GridBox title="Risk notes" items={selected.riskNotes} />
          <GridBox title="Metrics" items={selected.metrics} />
          <GridBox title="Owners" items={selected.ownerAgentIds} />
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Media plans</div>
          <div className="mt-4 space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-widest text-white/40"><span>{plan.mediaType}</span><span>{plan.channel}</span><span>approval {plan.approvalLevel}</span></div>
                <div className="mt-2 text-white font-bold">{plan.title}</div>
                <div className="mt-2 text-sm text-white/60">{plan.angle}</div>
                <div className="mt-3 text-xs text-amber-100">CTA: {plan.cta}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Video and voice briefs</div>
          <div className="mt-4 space-y-3 max-h-[620px] overflow-auto pr-1">
            {briefs.map((brief) => (
              <div key={brief.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-white font-bold">{brief.title}</div>
                <div className="mt-2 text-xs text-white/50 uppercase tracking-widest">{brief.channel} / {brief.mediaType}</div>
                <p className="mt-3 text-sm text-white/65 line-clamp-4">{brief.script}</p>
                <div className="mt-3 text-xs text-white/50">Voice: {brief.voiceDirection}</div>
                <div className="mt-2 text-xs text-amber-100">Next: {brief.nextProductionStep}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Meta/social creative matrix</div>
        <div className="mt-4 grid lg:grid-cols-3 gap-3">
          {matrix.map((cell) => (
            <div key={cell.cellId} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-[10px] uppercase tracking-widest text-white/40">{cell.channel} / {cell.format}</div>
              <div className="mt-2 text-white font-bold">{cell.offer}</div>
              <div className="mt-3 space-y-2 text-xs text-white/65"><div>A: {cell.hookA}</div><div>B: {cell.hookB}</div><div>C: {cell.hookC}</div></div>
              <div className="mt-3 text-xs text-amber-100">{cell.cta}</div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{cell.risk}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GridBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">{items.map((x) => <span key={x} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{x}</span>)}</div>
    </div>
  );
}
