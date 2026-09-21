import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessJourneyShell } from '../../components/business/BusinessJourneyShell';

export default function BusinessDocumentsPage() {
  const navigate = useNavigate();
  return (
    <PageShell
      badge="Business Portal"
      title="Business Documents"
      subtitle="Document requirements, templates, and uploads for fundability."
    >
      <BusinessJourneyShell activeStepId="docs_funding">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back"
        >
          <ArrowLeft size={16} /> Back
        </button>

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
      </BusinessJourneyShell>
    </PageShell>
  );
}

