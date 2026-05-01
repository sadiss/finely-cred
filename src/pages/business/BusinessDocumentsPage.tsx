import React from 'react';
import { ArrowLeft, Building2, FileText, LayoutGrid, Target, Users, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';

function navBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export default function BusinessDocumentsPage() {
  const navigate = useNavigate();
  return (
    <PageShell
      badge="Business Portal"
      title="Business Documents"
      subtitle="Document requirements, templates, and uploads for fundability."
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
          <button className={navBtn(false)} onClick={() => navigate('/business/lender-logic')}>
            <Target size={12} className="inline mr-2" /> Lender Logic
          </button>
          <button className={navBtn(true)} onClick={() => navigate('/business/documents')}>
            <FileText size={12} className="inline mr-2" /> Documents
          </button>
          <button className={navBtn(false)} onClick={() => navigate('/business/billion-path')}>
            <Crown size={12} className="inline mr-2" /> Billion Path
          </button>
        </div>

        <div className="fc-card p-6 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-white/40">Document checklist</p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Entity docs', desc: 'Articles, operating agreement, EIN letter, SOS filings.' },
              { title: 'Identity + ownership', desc: 'Owner ID, ownership structure, verification artifacts.' },
              { title: 'Banking', desc: 'Statements, balances, proof of revenue cadence.' },
              { title: 'Compliance', desc: 'Licenses, domain/email proofs, 411, insurance where needed.' },
            ].map((x) => (
              <div key={x.title} className="fc-panel p-6">
                <div className="text-white font-semibold">{x.title}</div>
                <div className="mt-2 text-white/60 text-sm">{x.desc}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/portal/documents')}
              className="fc-button-brand"
            >
              Open Documents Vault
            </button>
            <button
              type="button"
              onClick={() => navigate('/portal/messages')}
              className="fc-button-soft"
            >
              Ask support
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

