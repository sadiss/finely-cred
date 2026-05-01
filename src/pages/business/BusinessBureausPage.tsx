import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Building2, FileText, LayoutGrid, Target, Users, Crown, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { deleteBusinessScoreSnapshot, listBusinessScoreSnapshots, upsertBusinessScoreSnapshot } from '../../data/businessCreditRepo';
import type { BusinessBureau, BusinessScoreType } from '../../domain/businessCredit';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export default function BusinessBureausPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const snapshots = useMemo(() => (partner ? listBusinessScoreSnapshots(partner.id) : []), [partner?.id]);

  const [bureau, setBureau] = useState<BusinessBureau>('dnb');
  const [scoreType, setScoreType] = useState<BusinessScoreType>('PAYDEX');
  const [scoreValue, setScoreValue] = useState<string>('');
  const [reportedTradelines, setReportedTradelines] = useState<string>('');
  const [reportedPaidPayments, setReportedPaidPayments] = useState<string>('');
  const [derogFlags, setDerogFlags] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  return (
    <PageShell
      badge="Business Portal"
      title="Business Bureaus & Scores"
      subtitle="Guided knowledge for D&B, Experian Business, and Equifax Business. Learn what matters, what to avoid, and how to align your profile across the board."
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
          <button className={navBtn(true)} onClick={() => navigate('/business/bureaus')}>
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
            <div className="inline-flex items-center gap-2 text-amber-300">
              <ShieldCheck size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">A→Z guidance</span>
            </div>
            <div className="text-white/75 text-sm leading-relaxed">
              This hub will be expanded into a full roadmap and score tracker. For now, use it as your “what matters” reference and link-out
              point from Profile, Vendors, and Lender Logic.
            </div>
            <button onClick={() => navigate('/business/profile')} className="fc-button-brand">
              Improve profile readiness <ArrowRight size={14} />
            </button>
          </div>

          <details className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden" open>
            <summary className="cursor-pointer select-none px-5 py-4 hover:bg-white/[0.03] transition-colors">
              <div className="text-white font-semibold">What bureaus do (high level)</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Expand</div>
            </summary>
            <div className="px-5 pb-5 text-white/70 text-sm space-y-3">
              <div>
                <span className="text-white/85 font-semibold">Dun & Bradstreet (D&B)</span>: establishes a commercial identity (D‑U‑N‑S) and
                payment behavior signals.
              </div>
              <div>
                <span className="text-white/85 font-semibold">Experian Business</span>: business credit file and payment/trade reporting signals.
              </div>
              <div>
                <span className="text-white/85 font-semibold">Equifax Business</span>: commercial file + risk signals often referenced by certain
                lenders and reporting vendors.
              </div>
            </div>
          </details>

          <details className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <summary className="cursor-pointer select-none px-5 py-4 hover:bg-white/[0.03] transition-colors">
              <div className="text-white font-semibold">Profile consistency rules</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">Expand</div>
            </summary>
            <div className="px-5 pb-5 text-white/70 text-sm space-y-2">
              <div className="text-white/80 font-semibold">Everything should match across the board:</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Legal business name + suffix (LLC/Inc) exactly</li>
                <li>Address format + suite/unit</li>
                <li>Phone + 411 listing + website/domain</li>
                <li>EIN and state records</li>
              </ul>
              <div className="text-white/50 text-xs">
                We’ll expand this into guided checklists and “what to put / not to put” steps in the next phases.
              </div>
            </div>
          </details>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="text-white font-semibold">Manual score tracker (for now)</div>
            <div className="text-white/60 text-sm">
              Add score snapshots per bureau. Track <span className="text-white/85 font-semibold">reported tradelines</span> and{' '}
              <span className="text-white/85 font-semibold">reported paid payments</span>—these are key inputs to improving business profiles over time.
            </div>
            {!partner ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm">
                Sign in as a partner to store score snapshots.
              </div>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partner) return;
                  const v = scoreValue.trim() ? Number(scoreValue) : null;
                  const tl = reportedTradelines.trim() ? Number(reportedTradelines) : null;
                  const pp = reportedPaidPayments.trim() ? Number(reportedPaidPayments) : null;
                  upsertBusinessScoreSnapshot({
                    partnerId: partner.id,
                    bureau,
                    scoreType,
                    scoreValue: Number.isFinite(v as any) ? (v as any) : null,
                    reportedTradelines: Number.isFinite(tl as any) ? (tl as any) : null,
                    reportedPaidPayments: Number.isFinite(pp as any) ? (pp as any) : null,
                    derogFlags: derogFlags
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean),
                    notes: notes.trim() || undefined,
                  });
                  setScoreValue('');
                  setReportedTradelines('');
                  setReportedPaidPayments('');
                  setDerogFlags('');
                  setNotes('');
                }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Bureau</div>
                    <select
                      value={bureau}
                      onChange={(e) => setBureau(e.target.value as BusinessBureau)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                    >
                      <option value="dnb">D&B</option>
                      <option value="experian_business">Experian Business</option>
                      <option value="equifax_business">Equifax Business</option>
                    </select>
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Score type</div>
                    <select
                      value={scoreType}
                      onChange={(e) => setScoreType(e.target.value as BusinessScoreType)}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                    >
                      <option value="PAYDEX">PAYDEX</option>
                      <option value="IntelliscorePlus">Intelliscore Plus</option>
                      <option value="EquifaxBusinessScore">Equifax Business Score</option>
                      <option value="FICO_SBSS">FICO SBSS</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Score</div>
                    <input
                      value={scoreValue}
                      onChange={(e) => setScoreValue(e.target.value.replace(/[^\d.]/g, '').slice(0, 6))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                      placeholder="e.g. 80"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Tradelines</div>
                    <input
                      value={reportedTradelines}
                      onChange={(e) => setReportedTradelines(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                      placeholder="e.g. 5"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Paid payments</div>
                    <input
                      value={reportedPaidPayments}
                      onChange={(e) => setReportedPaidPayments(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                      placeholder="e.g. 12"
                    />
                  </label>
                </div>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Derog flags (comma separated)</div>
                  <input
                    value={derogFlags}
                    onChange={(e) => setDerogFlags(e.target.value)}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                    placeholder="e.g. collections, lien, bankruptcy"
                  />
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Notes</div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 w-full min-h-[84px] bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                    placeholder="Optional notes about what changed."
                  />
                </label>
                <button type="submit" className="fc-button-brand w-full">
                  Add snapshot
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white font-semibold">Snapshots</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{snapshots.length}</div>
            </div>
            <div className="mt-4 grid gap-3">
              {snapshots.length === 0 ? (
                <div className="text-white/60 text-sm">No snapshots yet. Add your first score snapshot on the left.</div>
              ) : (
                snapshots.slice(0, 20).map((s) => (
                  <div key={s.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-white font-semibold">
                          {s.bureau.replaceAll('_', ' ')} • {s.scoreType}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {new Date(s.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      {partner ? (
                        <button
                          type="button"
                          onClick={() => {
                            deleteBusinessScoreSnapshot(partner.id, s.id);
                          }}
                          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          title="Delete snapshot"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-3 grid md:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Score</div>
                        <div className="mt-1 text-white font-semibold">{s.scoreValue ?? '—'}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Tradelines</div>
                        <div className="mt-1 text-white font-semibold">{s.reportedTradelines ?? '—'}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Paid payments</div>
                        <div className="mt-1 text-white font-semibold">{s.reportedPaidPayments ?? '—'}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Derogs</div>
                        <div className="mt-1 text-white/80 text-sm">{(s.derogFlags ?? []).length ? s.derogFlags.join(', ') : '—'}</div>
                      </div>
                    </div>
                    {s.notes ? <div className="mt-3 text-white/60 text-sm">{s.notes}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

