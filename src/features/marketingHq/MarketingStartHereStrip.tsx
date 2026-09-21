import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Megaphone, FileText, Layers, DollarSign } from 'lucide-react';
import { FINELY_PACK_ASSETS } from './finelyPackCatalog';

const BTN =
  'flex flex-col items-start gap-3 rounded-2xl border-2 border-[#fbbf24]/50 bg-[#0b1110] p-6 sm:p-7 hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all text-left min-h-[140px]';

export function MarketingStartHereStrip() {
  return (
    <section className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#0b1110] to-[#060908] p-6 sm:p-8">
      <div className="text-[11px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Start here</div>
      <p className="text-white/80 text-base sm:text-lg mt-2 max-w-3xl">
        Pick one action for today. Everything is <strong className="text-white">copy / preview / download</strong> — you send manually; HQ never auto-sends.
      </p>
      <p className="text-[#fbbf24]/90 text-sm font-bold mt-4">{FINELY_PACK_ASSETS.length} assets in library — preview · copy · download</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
        <Link to="/admin/marketing" className={BTN}>
          <Layers className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">A · Full library</span>
          <span className="text-sm text-white/70">Command floor → grouped emails, SMS, HTML, guides.</span>
        </Link>
        <Link to="/admin/marketing/growth-acquisition/social" className={BTN}>
          <Megaphone className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">B · Post today</span>
          <span className="text-sm text-white/70">Social desk — Day 1 SMS + caption.</span>
        </Link>
        <Link to="/admin/marketing/growth-acquisition/email" className={BTN}>
          <Mail className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">C · 21-day email</span>
          <span className="text-sm text-white/70">All 21 nurture emails in one room.</span>
        </Link>
        <Link to="/admin/marketing/view/start-restore-147" className={BTN}>
          <DollarSign className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">D · $147 Start Restore</span>
          <span className="text-sm text-white/70">Copy offer block + open live /start.</span>
        </Link>
        <Link to="/admin/marketing/partner-referral/content" className={`${BTN} sm:col-span-2 xl:col-span-2`}>
          <FileText className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">E · Partner one-sheets</span>
          <span className="text-sm text-white/70">HTML verticals + restore → funding readiness.</span>
        </Link>
      </div>
    </section>
  );
}
