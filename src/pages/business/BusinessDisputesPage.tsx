import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, FileText, LayoutGrid, Target, Users, Crown, AlertTriangle, Scale, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { createBusinessDispute, deleteBusinessDispute, listBusinessDisputes, upsertBusinessDispute } from '../../data/businessCreditRepo';
import type { BusinessBureau } from '../../domain/businessCredit';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export default function BusinessDisputesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [version, setVersion] = useState(0);
  const disputes = useMemo(() => (partner ? listBusinessDisputes(partner.id) : []), [partner?.id, version]);
  const [newTitle, setNewTitle] = useState('');
  const [newBureau, setNewBureau] = useState<BusinessBureau>('dnb');

  return (
    <PageShell
      badge="Business Portal"
      title="Business Disputes"
      subtitle="Track negative items on business bureau files, attach evidence, generate letters, and mail from the Letters Vault."
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
            <Scale size={12} className="inline mr-2" /> Bureaus & Scores
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/lender-logic')}>
            <Target size={12} className="inline mr-2" /> Lender Logic
          </button>
          <button className={navBtn(true)} onClick={() => navigate('/business/disputes')}>
            <AlertTriangle size={12} className="inline mr-2" /> Disputes
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/documents')}>
            <FileText size={12} className="inline mr-2" /> Documents
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/billion-path')}>
            <Crown size={12} className="inline mr-2" /> Billion Path
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="text-white font-semibold">Manual-first dispute workflow</div>
              <div className="text-white/60 text-sm">
                Add negative items, attach evidence, generate a PDF letter, and mail from Letters Vault (with address verification).
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate('/portal/letters/vault')} className="fc-button-brand">
                Open Letters Vault <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/portal/evidence')} className="fc-button-soft">
                Open Evidence Vault <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {!partner ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
            Sign in as a partner to create and track business disputes.
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-6 space-y-4">
              <div className="text-white font-semibold">Create a dispute</div>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partner) return;
                  const d = createBusinessDispute({ partnerId: partner.id, bureau: newBureau, title: newTitle.trim() || undefined });
                  setNewTitle('');
                  setVersion((v) => v + 1);
                  navigate(`/business/disputes/${d.id}`);
                }}
              >
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Bureau</div>
                  <select
                    value={newBureau}
                    onChange={(e) => setNewBureau(e.target.value as BusinessBureau)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/80"
                  >
                    <option value="dnb">D&B</option>
                    <option value="experian_business">Experian Business</option>
                    <option value="equifax_business">Equifax Business</option>
                  </select>
                </label>
                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Title</div>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white/80"
                    placeholder="e.g. Incorrect address + wrong trade line"
                  />
                </label>
                <button type="submit" className="fc-button-brand w-full">
                  <Plus size={14} /> Create dispute
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-white font-semibold">Disputes</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">{disputes.length}</div>
              </div>
              <div className="mt-4 grid gap-3">
                {disputes.length === 0 ? (
                  <div className="text-white/60 text-sm">No disputes yet. Create your first one on the left.</div>
                ) : (
                  disputes.map((d) => (
                    <div key={d.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/business/disputes/${d.id}`)}
                          className="min-w-0 text-left"
                        >
                          <div className="text-white font-semibold truncate">{d.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {d.bureau.replaceAll('_', ' ')} • items:{d.negativeItems.length} • {d.status}
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            title="Mark in progress"
                            onClick={() => {
                              upsertBusinessDispute({ ...d, status: d.status === 'draft' ? 'in_progress' : d.status });
                              setVersion((v) => v + 1);
                            }}
                          >
                            Start
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/90 transition-all"
                            title="Delete dispute"
                            onClick={() => {
                              const ok = window.confirm('Delete this dispute?');
                              if (!ok) return;
                              deleteBusinessDispute(partner.id, d.id);
                              setVersion((v) => v + 1);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

