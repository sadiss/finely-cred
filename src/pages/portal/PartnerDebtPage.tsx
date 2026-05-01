import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Scale, FileWarning, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { listDebtByPartner, createDebtCase } from '../../data/debtRepo';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { KpiCard } from '../../components/ui';

export default function PartnerDebtPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<'debt' | 'summons'>('debt');
  const [addAmount, setAddAmount] = useState('');
  const [addCaseNumber, setAddCaseNumber] = useState('');
  const cases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const openCount = cases.filter((c) => c.status === 'open' || c.status === 'in_review').length;
  const resolvedCount = cases.filter((c) => c.status === 'resolved').length;
  const disputedCount = cases.filter((c) => c.status === 'disputed').length;
  const totalDollars = useMemo(() => cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0), [cases]);

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;
    const amountCents = Math.round(parseFloat(addAmount || '0') * 100);
    if (!addName.trim() || amountCents < 0) return;
    const created = createDebtCase({
      partnerId: partner.id,
      type: addType,
      name: addName.trim(),
      amountCents,
      courtCaseNumber: addCaseNumber.trim() || undefined,
    });
    setShowAdd(false);
    setAddName('');
    setAddAmount('');
    setAddCaseNumber('');
    navigate(`/portal/debt/${created.id}`);
  };

  return (
    <PageShell
      badge="Partner Portal"
      title="Debt & Summons Center"
      subtitle="Validation requests, affidavits, summons answers (e.g. 35-day), and time-barred responses — with legal basis (FDCPA, contract law, banking law). Add a case to get personalized letter drafts."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.debt]}>
          {/* KPI row */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Cases" value={cases.length} hint="Total" tone="amber" />
            <KpiCard label="Active" value={openCount + disputedCount} hint="Open + disputed" tone="emerald" />
            <KpiCard label="Resolved" value={resolvedCount} hint="Done" tone="sky" />
            <KpiCard
              label="Total claimed"
              value={(totalDollars / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              hint="All cases"
              tone="violet"
            />
          </div>

          {cases.length === 0 ? (
            <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Finely Cred
            </button>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Letters & affidavits you can use</h2>
            <p className="text-white/70 text-sm">
              For each debt or summons case you add, you get personalized drafts and legal basis. Available letter types:
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-white/80">
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Validation request</strong> — FDCPA § 809, demand proof before collection</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Time-barred response</strong> — Assert statute of limitations</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Affidavit of dispute</strong> — Sworn statement; put claimant to proof</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Summons response / 35-day answer</strong> — Answer & affirmative defenses</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Cease & desist</strong> — FDCPA § 805(c), stop contact</li>
              <li className="flex items-center gap-2"><span className="text-amber-400">•</span> <strong>Debt dispute letter</strong> — General dispute, FCRA/FDCPA</li>
            </ul>
            <p className="text-white/60 text-xs">Contract law, banking law (UCC), and civil procedure (SOL) are explained on each case page.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-8 text-center">
            <Scale className="mx-auto text-amber-500/60 mb-4" size={48} />
            <p className="text-white/80 font-medium">No debt or summons cases yet</p>
            <p className="mt-2 text-white/50 text-sm max-w-md mx-auto">
              Add a case (creditor/plaintiff name, amount, optional court case #) to open the full legal workflow: strategy dates, recommended letter type, and draft language.
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              <Plus size={16} /> Add debt or summons case
            </button>
          </div>
          {showAdd && (
            <form onSubmit={handleAddCase} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
              <h3 className="text-white font-semibold">Add case</h3>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Type</label>
                <select value={addType} onChange={(e) => setAddType(e.target.value as 'debt' | 'summons')} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                  <option value="debt">Debt / collection</option>
                  <option value="summons">Summons / court</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Creditor or plaintiff name</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. ABC Collections" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Amount claimed ($)</label>
                <input type="number" step="0.01" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
              </div>
              {addType === 'summons' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Court case number (optional)</label>
                  <input type="text" value={addCaseNumber} onChange={(e) => setAddCaseNumber(e.target.value)} placeholder="e.g. 12345" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm">Add & open</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl border border-white/20 text-white/80 text-sm">Cancel</button>
              </div>
            </form>
          )}
            </div>
          ) : (
            <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Finely Cred
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
            >
              <Plus size={14} /> Add case
            </button>
          </div>
          {showAdd && (
            <form onSubmit={handleAddCase} className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-4">
              <h3 className="text-white font-semibold">Add debt or summons case</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Type</label>
                  <select value={addType} onChange={(e) => setAddType(e.target.value as 'debt' | 'summons')} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
                    <option value="debt">Debt / collection</option>
                    <option value="summons">Summons / court</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Amount ($)</label>
                  <input type="number" step="0.01" min="0" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Creditor or plaintiff name</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. ABC Collections" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" required />
              </div>
              {addType === 'summons' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">Court case number (optional)</label>
                  <input type="text" value={addCaseNumber} onChange={(e) => setAddCaseNumber(e.target.value)} placeholder="e.g. 12345" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30" />
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 text-black font-bold text-sm">Add & open</button>
                <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2 rounded-xl border border-white/20 text-white/80 text-sm">Cancel</button>
              </div>
            </form>
          )}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-white/80 text-sm">
              <strong>Validation requests</strong>, <strong>affidavits</strong>, <strong>summons answers (35-day)</strong>, and <strong>time-barred responses</strong> — open any case below for personalized letter drafts and legal basis (FDCPA, contract law, banking law).
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              {
                key: 'active',
                title: 'Active (open / in review / disputed)',
                items: cases.filter((c) => c.status === 'open' || c.status === 'in_review' || c.status === 'disputed'),
              },
              { key: 'resolved', title: 'Resolved', items: cases.filter((c) => c.status === 'resolved') },
            ].map((group) => (
              <details key={group.key} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5" open={group.key === 'active'}>
                <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
                  <div className="text-white font-semibold">{group.title}</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{group.items.length}</div>
                </summary>
                <div className="mt-4 grid gap-3">
                  {group.items.length === 0 ? (
                    <div className="text-white/55 text-sm">No cases in this group.</div>
                  ) : (
                    group.items.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => navigate(`/portal/debt/${c.id}`)}
                        className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {c.type === 'summons' ? (
                            <FileWarning size={20} className="text-amber-400 shrink-0" />
                          ) : (
                            <Scale size={20} className="text-amber-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{c.name}</div>
                            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                              {(c.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {c.type} · {c.status}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={16} className="text-white/40 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              </details>
            ))}
          </div>
            </div>
          )}
        </EntitlementGate>
      )}
    </PageShell>
  );
}
