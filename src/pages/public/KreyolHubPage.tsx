import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, MessageCircle, ArrowRight } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';

/**
 * `/kreyol` — Kreyòl funnel hub (not a duplicate of the full Haitian community desk).
 */
export default function KreyolHubPage() {
  return (
    <PageShell
      badge="Kreyòl"
      title="Chimen Kreyòl Finely Cred"
      subtitle="Kat gratis, biwo kominote, ak sesyon edikatif — pa menm paj ak tout bagay sou /haitian."
    >
      <div className="max-w-3xl mx-auto grid gap-4">
        <Link
          to="/free-kreyol-guide"
          className="rounded-2xl border-2 border-[#fbbf24]/40 bg-[#0b1110] p-6 hover:border-[#fbbf24] transition-all block"
        >
          <div className="flex items-start gap-4">
            <BookOpen className="text-[#fbbf24] shrink-0" size={28} />
            <div>
              <div className="text-xl font-bold text-white">Kat kit gratis (Kreyòl)</div>
              <p className="text-white/70 text-sm mt-2">
                Dedicated funnel at <span className="font-mono text-amber-200/90">/free-kreyol-guide</span> — unlock PDF kit interest; stays on guide page.
              </p>
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-sm mt-3">
                Open kit funnel <ArrowRight size={14} />
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/haitian?lang=ht"
          className="rounded-2xl border border-white/15 bg-black/30 p-6 hover:border-emerald-500/30 transition-all block"
        >
          <div className="flex items-start gap-4">
            <MessageCircle className="text-emerald-300 shrink-0" size={28} />
            <div>
              <div className="text-lg font-semibold text-white">Biwo kominote Ayisyen</div>
              <p className="text-white/65 text-sm mt-2">
                Live desk + form at <span className="font-mono">/haitian</span> — for ongoing chat and specialist follow-up.
              </p>
            </div>
          </div>
        </Link>

        <Link to="/start" className="text-amber-300 text-sm font-semibold underline">
          Start Restore — $147 (English/Kreyòl cards on kit page)
        </Link>
      </div>
    </PageShell>
  );
}
