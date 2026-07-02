import React from 'react';
import { ArrowRight, Layers3, MousePointerClick, PanelTop, Workflow } from 'lucide-react';
import { SitewideDeckRail, SitewideRailCard } from './SitewideDeckRail';
import { SITEWIDE_UX_RULES, SITEWIDE_UX_MISSIONS } from './uxPatternVault';

export function SitewidePatternGallery() {
  return (
    <div className="space-y-5">
      <SitewideDeckRail title="Replacement UI patterns" eyebrow="Design system" subtitle="Use these instead of side-by-side command pages, endless template lists, and full-page scroll walls." actionLabel="Open first mission">
        {SITEWIDE_UX_RULES.map((rule) => (
          <SitewideRailCard key={rule.id} title={rule.title} meta={rule.severity} body={rule.replacement} tone={rule.severity === 'protected' ? 'rose' : rule.severity === 'critical' ? 'gold' : 'default'} footer={<div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/55">{rule.appliesTo.length} targets <ArrowRight size={12} /></div>} />
        ))}
      </SitewideDeckRail>
      <section className="grid xl:grid-cols-3 gap-4">
        {SITEWIDE_UX_MISSIONS.map((mission) => (
          <article key={mission.id} className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] uppercase tracking-[0.30em] text-amber-300 font-black">{mission.owner}</div>
              {mission.id.includes('admin') ? <Workflow size={18} className="text-amber-300" /> : mission.id.includes('public') ? <MousePointerClick size={18} className="text-emerald-300" /> : <PanelTop size={18} className="text-sky-300" />}
            </div>
            <h3 className="mt-3 text-xl font-semibold text-white">{mission.title}</h3>
            <p className="mt-3 text-white/58 text-sm leading-relaxed">{mission.expectedOutcome}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {mission.pages.slice(0, 5).map((p) => <span key={p} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] text-white/55">{p}</span>)}
            </div>
            <div className="mt-5 space-y-2">
              {mission.acceptanceChecks.slice(0, 3).map((c) => (
                <div key={c} className="flex items-start gap-2 text-white/58 text-xs"><Layers3 size={12} className="mt-0.5 text-amber-300" />{c}</div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
