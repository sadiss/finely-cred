import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

export default function RentReportingPage() {
  return (
    <PageShell
      badge="Rent reporting"
      title="Rent & utility reporting hub"
      subtitle="Education on rent reporting tradelines — eligibility varies; we document; we do not promise score outcomes."
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 text-white/75 text-sm leading-relaxed space-y-3">
          <div className="inline-flex items-center gap-2 text-[#fbbf24] font-bold text-xs uppercase tracking-widest">
            <Home size={16} /> What this is
          </div>
          <p>
            Rent and utility reporting can help thin files when reported to bureaus that accept the data. Programs differ by landlord,
            processor, and bureau acceptance.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Confirm your lease and payment method qualify before enrolling.</li>
            <li>Pair with personal restore when negative items block progress.</li>
            <li>Track results in your portal reports vault — no hype dashboards.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/services/personal-credit-building" className="fc-button-brand text-xs">
            Personal building services <ArrowRight size={14} />
          </Link>
          <Link to="/resources" className="fc-button-soft text-xs">Resource library</Link>
          <Link to="/enlightenment-session" className="fc-button-soft text-xs">Ask a specialist</Link>
        </div>
      </div>
    </PageShell>
  );
}
