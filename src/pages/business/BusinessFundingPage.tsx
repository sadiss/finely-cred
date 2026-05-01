import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, FileText, LayoutGrid, Target, Users, Crown, Sparkles, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { LenderLogicEngine } from '../../components/dashboard';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export default function BusinessFundingPage() {
  const navigate = useNavigate();
  const [score, setScore] = useState(680);
  const [utilization, setUtilization] = useState(9);
  const [revenue, setRevenue] = useState(12000);
  const [timeMonths, setTimeMonths] = useState(12);
  const [zip, setZip] = useState('');
  const [hasRelationship, setHasRelationship] = useState(false);
  const [willingToOpenDeposits, setWillingToOpenDeposits] = useState(true);
  const [noDocPreference, setNoDocPreference] = useState(true);

  const inputs = useMemo(
    () => ({
      score,
      utilizationPct: utilization,
      revenueMonthly: revenue,
      timeInBusinessMonths: timeMonths,
    }),
    [score, utilization, revenue, timeMonths],
  );
  return (
    <PageShell
      badge="Business Portal"
      title="Lender Logic Engine"
      subtitle="AI‑assisted underwriting analysis: lender fit, readiness signals, and next‑best actions across multiple banks."
    >
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex flex-wrap gap-3">
          <button className={navBtn(false)} onClick={() => navigate('/business/dashboard')}>
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
          <button className={navBtn(true)} onClick={() => navigate('/business/lender-logic')}>
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

        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] via-amber-500/5 to-emerald-500/10 backdrop-blur-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-amber-300">
              <Sparkles size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Underwriting optics</span>
            </div>
            <div className="text-white/70 text-sm leading-relaxed">
              Use this engine to model lender fit and generate next actions. Small changes (utilization, time-in-business, revenue consistency)
              can shift approvals and limits dramatically.
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/business/billion-path')} className="fc-button-brand">
              Open Billion Path <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Business Credit'))}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Book free enlightenment session <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Inputs</div>
            <div className="space-y-3 text-sm text-white/70">
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Credit score</div>
                <input
                  type="number"
                  value={score}
                  min={300}
                  max={850}
                  onChange={(e) => setScore(parseInt(e.target.value || '680', 10))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Utilization %</div>
                <input
                  type="number"
                  value={utilization}
                  min={0}
                  max={100}
                  onChange={(e) => setUtilization(parseInt(e.target.value || '0', 10))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Monthly revenue (est.)</div>
                <input
                  type="number"
                  value={revenue}
                  min={0}
                  onChange={(e) => setRevenue(parseInt(e.target.value || '0', 10))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Time in business (months)</div>
                <input
                  type="number"
                  value={timeMonths}
                  min={0}
                  onChange={(e) => setTimeMonths(parseInt(e.target.value || '0', 10))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </label>
              <label className="block">
                <div className="text-[10px] uppercase tracking-widest text-white/40">ZIP (local picks within 50 miles)</div>
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="e.g. 75201"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Existing relationship</div>
                  <div className="text-white/60 text-xs">You already bank with a local institution</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasRelationship}
                  onChange={(e) => setHasRelationship(e.target.checked)}
                  className="accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Willing to open deposits</div>
                  <div className="text-white/60 text-xs">Relationship + deposits lane</div>
                </div>
                <input
                  type="checkbox"
                  checked={willingToOpenDeposits}
                  onChange={(e) => setWillingToOpenDeposits(e.target.checked)}
                  className="accent-amber-500"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40">No‑doc preference</div>
                  <div className="text-white/60 text-xs">Prioritize relationship/no‑doc leaning options</div>
                </div>
                <input
                  type="checkbox"
                  checked={noDocPreference}
                  onChange={(e) => setNoDocPreference(e.target.checked)}
                  className="accent-amber-500"
                />
              </label>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
              Tip: tune utilization + revenue consistency first—then re-run analysis for higher approvals.
            </div>
          </div>

          <div className="lg:col-span-8">
            <LenderLogicEngine
              userScore={inputs.score}
              utilizationPct={inputs.utilizationPct}
              revenueMonthly={inputs.revenueMonthly}
              timeInBusinessMonths={inputs.timeInBusinessMonths}
              zip={zip}
              radiusMiles={50}
              hasRelationship={hasRelationship}
              willingToOpenDeposits={willingToOpenDeposits}
              noDocPreference={noDocPreference}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

