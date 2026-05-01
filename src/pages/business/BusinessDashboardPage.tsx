import React, { useMemo } from 'react';
import { ArrowRight, Building2, FileText, LayoutGrid, Target, Users, Crown, Sparkles, ShieldCheck, Layers, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { BusinessCreditLadderPanel } from '../../components/business/BusinessCreditLadderPanel';
import { BusinessCreditRoadmapPanel } from '../../components/business/BusinessCreditRoadmapPanel';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  return (
    <PageShell
      badge="Business Portal"
      title="Business Dashboard"
      subtitle="Fundability, structure, and vendor sequencing. This is the entry point for EIN-focused builds and business funding readiness."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <button className={navBtn(true)} onClick={() => navigate('/business/dashboard')}>
            <LayoutGrid size={12} className="inline mr-2" /> Dashboard
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/profile')}>
            <Building2 size={12} className="inline mr-2" /> Profile
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/vendors')}>
            <Users size={12} className="inline mr-2" /> Vendors
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/bureaus')}>
            <BookOpen size={12} className="inline mr-2" /> Bureaus & Scores
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/lender-logic')}>
            <Target size={12} className="inline mr-2" /> Lender Logic
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/disputes')}>
            <AlertTriangle size={12} className="inline mr-2" /> Disputes
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/documents')}>
            <FileText size={12} className="inline mr-2" /> Documents
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/billion-path')}>
            <Crown size={12} className="inline mr-2" /> Billion Path
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/[0.03] to-emerald-500/10 backdrop-blur-xl p-6 md:p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-amber-300">
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Business Credit OS</span>
              </div>
              <div className="text-3xl md:text-4xl font-light text-white leading-tight">
                Build EIN fundability with <span className="text-amber-500">sequencing</span>, not luck.
              </div>
              <div className="text-white/60 text-sm leading-relaxed">
                This portal is your execution layer: profile hygiene → vendor stacking → lender logic → underwriting docs → relationship tracking (Billion Path).
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/business/profile')} className="fc-button-brand">
                Start with profile <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Business Credit'))}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Book free enlightenment session <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { icon: Layers, t: 'Foundation', d: 'Entity + address hygiene + compliance signals' },
              { icon: ShieldCheck, t: 'Sequence', d: 'Vendor stack → credit products when ready' },
              { icon: Crown, t: 'Capital readiness', d: 'Docs + relationships + underwriting package' },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.t} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Icon size={16} />
                    <div className="text-xs font-semibold uppercase tracking-wider">{x.t}</div>
                  </div>
                  <div className="mt-2 text-white/70 text-sm">{x.d}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="fc-card p-6 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40">What this portal does</p>
            <ul className="list-disc pl-5 text-white/70 text-sm space-y-2">
              <li>Turns your business into a “person” with its own fundability signals and operating profile.</li>
              <li>Keeps sequencing clean: profile → vendors → lender logic → documents.</li>
              <li>Gives you a single checklist you can execute without guessing.</li>
            </ul>
          </div>
          <div className="fc-panel p-6 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Fast actions</p>
            <div className="grid gap-3">
              <button
                onClick={() => navigate('/business/profile')}
                className="text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5"
              >
                <div className="text-white font-semibold">Complete business profile</div>
                <div className="mt-1 text-white/60 text-sm">Entity, address, NAICS, compliance signals, and reporting readiness.</div>
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                  Open profile <ArrowRight size={12} />
                </div>
              </button>
              <button
                onClick={() => navigate('/business/vendors')}
                className="text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5"
              >
                <div className="text-white font-semibold">Vendor center</div>
                <div className="mt-1 text-white/60 text-sm">Sequenced vendor stack with readiness discipline.</div>
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                  Open vendors <ArrowRight size={12} />
                </div>
              </button>

              <button
                onClick={() => navigate('/business/lender-logic')}
                className="text-left rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5"
              >
                <div className="text-white font-semibold">Run Lender Logic</div>
                <div className="mt-1 text-white/60 text-sm">Model lender fit and generate next-best actions from your inputs.</div>
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                  Open engine <ArrowRight size={12} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {partner ? <BusinessCreditLadderPanel partnerId={partner.id} /> : null}
        {partner ? <BusinessCreditRoadmapPanel partnerId={partner.id} /> : null}
        <BusinessReadinessChecklist />
      </div>
    </PageShell>
  );
}

