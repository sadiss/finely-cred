import React from 'react';
import { defaultLeadCaptureRoutes } from './marketingIntelligenceVault';
import { auditAllLeadCaptureRoutes, buildConversationPath, buildTrackedShortLink } from './leadCaptureAmplifier';

export function SovereignLeadCaptureAmplifierPanel() {
  const audits = auditAllLeadCaptureRoutes();
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.04] to-amber-500/10 p-6">
        <div className="text-[10px] uppercase tracking-widest text-emerald-200 font-black">Lead capture amplifier</div>
        <h2 className="mt-2 text-3xl font-black text-white">Every campaign gets a page, link, owner, conversation, and nurture route</h2>
        <p className="mt-3 text-sm text-white/65 max-w-4xl">This is the missing bridge between Lead Intel and revenue: discovered lead to tracked short link to premium landing page to CRM to nurture to appointment or sales owner.</p>
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {defaultLeadCaptureRoutes.map((route) => {
          const audit = audits.find((a) => a.routeId === route.id)!;
          return (
            <div key={route.id} className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{route.audience}</div>
                  <h3 className="mt-2 text-xl font-black text-white">{route.name}</h3>
                </div>
                <div className="rounded-2xl bg-amber-400 text-black px-3 py-2 text-sm font-black">{audit.readiness}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Tracked links</div>
                <div className="mt-2 grid md:grid-cols-2 gap-2">
                  {route.sourceChannels.slice(0, 4).map((source) => (
                    <div key={source} className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-white/70 break-all">{source}: {buildTrackedShortLink(route, source, 'Dallas')}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Conversation route</div>
                <ol className="mt-3 space-y-2 text-sm text-white/65 list-decimal pl-5">
                  {buildConversationPath(route, 'Dallas').map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <SmallBox title="Owners" items={route.ownerAgentIds} />
                <SmallBox title="Fields" items={route.requiredFields} />
                <SmallBox title="Sources" items={route.sourceChannels} />
                <SmallBox title="Compliance" items={route.complianceNotes} />
              </div>
              {audit.missing.length > 0 && <SmallBox title="Still missing" items={audit.missing} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">{items.map((x) => <span key={x} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/70">{x}</span>)}</div>
    </div>
  );
}
