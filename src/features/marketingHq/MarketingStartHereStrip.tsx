import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Megaphone, FileText } from 'lucide-react';

const BTN =
  'flex flex-col items-start gap-2 rounded-2xl border-2 border-[#fbbf24]/40 bg-[#0b1110] p-5 hover:border-[#fbbf24] hover:bg-[#fbbf24]/5 transition-all text-left';

export function MarketingStartHereStrip() {
  return (
    <section className="rounded-2xl border border-[#fbbf24]/30 bg-gradient-to-br from-[#0b1110] to-[#060908] p-6 sm:p-8">
      <div className="text-[11px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Start here</div>
      <p className="text-white/80 text-base sm:text-lg mt-2 max-w-3xl">
        Pick one action for today. Everything is <strong className="text-white">copy / preview / download</strong> — you send manually; HQ never auto-sends.
      </p>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link to="/admin/marketing/growth-acquisition/social" className={BTN}>
          <Megaphone className="text-[#fbbf24]" size={28} />
          <span className="text-lg font-bold text-white">A · Post today (Social)</span>
          <span className="text-sm text-white/70">Open Social desk → Day 1 SMS + caption, ready to paste.</span>
        </Link>
        <Link to="/admin/marketing/growth-acquisition/email" className={BTN}>
          <Mail className="text-[#fbbf24]" size={28} />
          <span className="text-lg font-bold text-white">B · Email this week (21-day)</span>
          <span className="text-sm text-white/70">Day 1 nurture email + Start Restore $147 card.</span>
        </Link>
        <Link to="/admin/marketing/partner-referral/content" className={BTN}>
          <FileText className="text-[#fbbf24]" size={28} />
          <span className="text-lg font-bold text-white">C · Partner one-sheet</span>
          <span className="text-sm text-white/70">Restore → funding readiness HTML (Finely medallion only).</span>
        </Link>
      </div>
    </section>
  );
}
