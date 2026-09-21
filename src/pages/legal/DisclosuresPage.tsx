import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

const LAST_UPDATED = '2026-02-05';

export default function DisclosuresPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Legal"
      title="Disclosures"
      subtitle="Regulatory notices, service limitations, and links to full legal policies."
    >
      <div className="max-w-3xl mx-auto space-y-6 text-white/80 text-sm leading-relaxed">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="rounded-2xl border border-[#fbbf24]/25 bg-[#0b1110] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#fbbf24]">
            <FileText size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Summary</span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Last updated: {LAST_UPDATED}</p>
          <p>
            Finely Cred provides educational credit documentation workflows and software. We are not a law firm, tax preparer, or lender.
            We do not guarantee credit score increases, deletions, approvals, or funding outcomes.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Personal and business credit strategies vary by bureau, creditor, and underwriting policy.</li>
            <li>Tradeline and AU products are subject to eligibility and issuer rules.</li>
            <li>Debt-related content is educational — consult licensed counsel for legal advice.</li>
          </ul>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Link to="/terms" className="rounded-xl border border-white/15 bg-black/30 p-4 hover:border-white/25 text-center text-white font-semibold text-sm">
            Terms of service
          </Link>
          <Link to="/privacy" className="rounded-xl border border-white/15 bg-black/30 p-4 hover:border-white/25 text-center text-white font-semibold text-sm">
            Privacy policy
          </Link>
          <Link to="/disclaimer" className="rounded-xl border border-white/15 bg-black/30 p-4 hover:border-white/25 text-center text-white font-semibold text-sm">
            Full disclaimer
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
