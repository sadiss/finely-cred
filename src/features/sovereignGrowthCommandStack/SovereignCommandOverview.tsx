import React, { useEffect, useMemo, useState } from 'react';
import { buildSovereignSnapshot, loadSovereignStore, resetSovereignStore } from './sovereignGrowthRepo';
import { sovereignAgents, sovereignDepartments } from './sovereignAgentDirectory';
import { channelCapabilities } from './marketingIntelligenceVault';

export function SovereignCommandOverview() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:sovereign-growth-store', onStore as EventListener);
    return () => window.removeEventListener('finely:sovereign-growth-store', onStore as EventListener);
  }, []);
  const snapshot = useMemo(() => buildSovereignSnapshot(), [version]);
  const store = useMemo(() => loadSovereignStore(), [version]);
  const healthLabel = snapshot.health.replace(/_/g, ' ').toUpperCase();
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/15 via-white/[0.05] to-black/40 p-7 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.13),transparent_38%)]" />
        <div className="relative grid lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="text-[10px] uppercase tracking-[0.35em] text-amber-200 font-black">Sovereign Growth Command Stack</div>
            <h1 className="mt-3 text-3xl md:text-5xl font-black text-white tracking-tight">High-command marketing floor</h1>
            <p className="mt-4 text-white/70 max-w-3xl text-sm md:text-base leading-relaxed">
              One organized command layer for staff identity, lead capture, Meta/social, video/voice generation, geo growth, notifications, and mission execution. This sits above the Lead Engine and Human Staff OS so the system feels understandable, alive, and action-oriented.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Staff hierarchy', 'Mission owners', 'Tracked CTAs', 'Video briefs', 'Geo cells', 'Compliance gates'].map((x) => (
                <span key={x} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] uppercase tracking-widest text-white/70 font-bold">{x}</span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              ['Intelligence', `${snapshot.intelligenceScore}%`],
              ['Agents', String(snapshot.agents)],
              ['Routes', String(snapshot.leadRoutes)],
              ['Media plans', String(snapshot.mediaPlans)],
              ['Missions', String(snapshot.openMissions)],
              ['Health', healthLabel],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
                <div className="mt-2 text-2xl font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Organization</div>
          <div className="mt-2 text-2xl font-black text-white">{sovereignDepartments.length} departments</div>
          <p className="mt-2 text-white/60 text-sm">Staff is grouped by executive, lead intel, geo, capture, nurture, appointments, sales, social, video/voice, PR, analytics, automation, and compliance.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Marketing reach</div>
          <div className="mt-2 text-2xl font-black text-white">{channelCapabilities.length} channels</div>
          <p className="mt-2 text-white/60 text-sm">Meta, Instagram, TikTok, YouTube, LinkedIn, SEO, email, SMS, partner loops, PR, and community-safe pathways are mapped to owners and risks.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">System readiness</div>
          <div className="mt-2 text-2xl font-black text-white">{snapshot.missingSetup.length ? `${snapshot.missingSetup.length} blockers` : 'Clear'}</div>
          <p className="mt-2 text-white/60 text-sm">The dashboard shows blockers instead of pretending the system is fully live. It is built to push action, not mystery.</p>
        </div>
      </div>

      {snapshot.missingSetup.length > 0 && (
        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
          <div className="text-[10px] uppercase tracking-widest text-amber-200 font-black">Current blockers</div>
          <div className="mt-3 grid md:grid-cols-2 gap-2">
            {snapshot.missingSetup.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/75">{item}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => { resetSovereignStore(); setVersion((v) => v + 1); }} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] uppercase tracking-widest text-white/70 font-black hover:bg-white/[0.06]">Reset command demo data</button>
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">Store: local fallback until Supabase is wired</div>
      </div>
    </div>
  );
}
