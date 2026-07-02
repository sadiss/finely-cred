import React from 'react';
import { ArrowLeft, Globe2, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { buildSitewideCursorPlan, buildSitewideUxSummary } from './sitewideUxEngine';
import { SitewideKpiCommandStrip } from './SitewideKpiCommandStrip';
import { SitewideNegativeItemsGuardPanel } from './SitewideNegativeItemsGuardPanel';
import { SitewidePageMatrixPanel } from './SitewidePageMatrixPanel';
import { SitewidePatternGallery } from './SitewidePatternGallery';

export function SitewideUxCommandPage() {
  const navigate = useNavigate();
  const summary = React.useMemo(() => buildSitewideUxSummary(), []);
  const plan = React.useMemo(() => buildSitewideCursorPlan(), []);
  const [tab, setTab] = React.useState<'overview' | 'pages' | 'patterns' | 'cursor'>('overview');

  return (
    <PageShell
      badge="Admin"
      title="Sitewide UX Command Stack"
      subtitle="Audit and refactor public, admin, portal, business, seller, and AU pages without touching the protected extracted negative-items credit report layout."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"><ArrowLeft size={16} /> Admin Dashboard</button>
          <div className="flex flex-wrap gap-2">
            {[['overview', 'Overview'], ['pages', 'Pages'], ['patterns', 'Patterns'], ['cursor', 'Cursor Plan']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id as any)} className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${tab === id ? 'bg-amber-500 text-black border-amber-300' : 'bg-white/[0.04] border-white/10 text-white/65 hover:bg-white/[0.08]'}`}>{label}</button>
            ))}
          </div>
        </div>

        {tab === 'overview' ? (
          <>
            <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#070b09]/90 p-6 md:p-8 shadow-2xl shadow-black/35">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[980px] rounded-full blur-3xl opacity-45" style={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,.24), transparent 65%)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-black/35" />
              </div>
              <div className="relative grid xl:grid-cols-12 gap-7 items-center">
                <div className="xl:col-span-7">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-amber-300 font-black"><Sparkles size={14} /> Sitewide refactor</div>
                  <h1 className="mt-4 text-4xl md:text-5xl font-light text-white leading-tight">Remove weak lists, cramped editors, and scroll walls across the app.</h1>
                  <p className="mt-4 text-white/62 text-base leading-relaxed max-w-3xl">This command layer tells Cursor exactly where to upgrade public and private pages while preserving the one protected credit-report negative-items layout.</p>
                </div>
                <div className="xl:col-span-5 grid sm:grid-cols-2 gap-3">
                  {[{ label: 'Critical pages', value: summary.criticalPages, icon: LayoutDashboard }, { label: 'Protected layouts', value: summary.protectedPages, icon: ShieldCheck }, { label: 'Total scanned', value: summary.totalPages, icon: Globe2 }, { label: 'Long-list risk', value: summary.longListRiskPages, icon: Sparkles }].map((x) => { const Icon = x.icon; return <div key={x.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"><Icon size={18} className="text-amber-300" /><div className="mt-4 text-3xl font-light text-white">{x.value}</div><div className="mt-1 text-[10px] uppercase tracking-widest text-white/42 font-black">{x.label}</div></div>; })}
                </div>
              </div>
            </section>
            <SitewideKpiCommandStrip summary={summary} />
            <SitewideNegativeItemsGuardPanel />
            <SitewidePatternGallery />
          </>
        ) : null}

        {tab === 'pages' ? <SitewidePageMatrixPanel /> : null}
        {tab === 'patterns' ? <><SitewidePatternGallery /><SitewideNegativeItemsGuardPanel /></> : null}
        {tab === 'cursor' ? (
          <section className="rounded-[34px] border border-white/10 bg-black/35 p-6 space-y-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.35em] text-amber-300 font-black">Cursor merge order</div>
              <h2 className="mt-2 text-2xl md:text-3xl font-light text-white">{plan.title}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {plan.order.map((step, idx) => (
                <div key={step} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="text-amber-300 text-[10px] uppercase tracking-widest font-black">Step {idx + 1}</div>
                  <div className="mt-2 text-white/75 text-sm leading-relaxed">{step}</div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

export default SitewideUxCommandPage;
