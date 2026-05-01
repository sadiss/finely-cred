import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <PageShell
      badge="404"
      title="Page not found"
      subtitle="That route doesn’t exist. Use the buttons below to get back to the live site."
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/70">
          <div className="inline-flex items-center gap-2 text-amber-400">
            <Search size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Navigation</span>
          </div>
          <p className="mt-3 text-white/60 text-sm">
            If you reached this from a link, the page may have moved. For launch readiness we only expose routes that are fully implemented.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Home
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 font-black uppercase tracking-widest text-[10px] transition-all"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
        </div>
      </div>
    </PageShell>
  );
}

