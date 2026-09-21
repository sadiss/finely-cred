import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Megaphone, FileText, Layers, DollarSign } from 'lucide-react';
import { FINELY_PACK_ASSETS } from './finelyPackCatalog';
import { FC_CARD_GRID, FC_SECTION_SHELL } from '../../styles/layoutSurfaces';

const BTN =
  'flex flex-col items-start gap-3 rounded-2xl border-2 border-[#fbbf24]/50 bg-[#0b1110] p-5 sm:p-6 hover:border-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all text-left min-h-[132px]';

/** Start here → Post → Guides → supporting actions (3×2 grid). */
export function MarketingStartHereStrip() {
  return (
    <section className={FC_SECTION_SHELL}>
      <div className="text-[11px] font-black uppercase tracking-[0.35em] text-[#fbbf24]">Start here</div>
      <p className="text-white/80 text-base sm:text-lg max-w-3xl">
        <strong className="text-white">Post</strong> on Social Media → polish <strong className="text-white">guides</strong> → then email
        and partner assets. Copy / preview / download only — you send manually.
      </p>
      <p className="text-[#fbbf24]/90 text-sm font-bold">{FINELY_PACK_ASSETS.length} assets in library</p>
      <div className={`${FC_CARD_GRID} sm:grid-cols-2 lg:grid-cols-3`}>
        <Link to="/admin/marketing/growth-acquisition/social" className={BTN}>
          <Megaphone className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">1 · Post (Social Media)</span>
          <span className="text-sm text-white/70">Facebook & YouTube — days 1–7 + calendar.</span>
        </Link>
        <Link to="/admin/marketing/growth-acquisition/content" className={BTN}>
          <FileText className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">2 · Guides & one-sheets</span>
          <span className="text-sm text-white/70">HTML handouts and vertical playbooks.</span>
        </Link>
        <Link to="/admin/marketing" className={BTN}>
          <Layers className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">3 · Full library</span>
          <span className="text-sm text-white/70">Command floor — all pack groups.</span>
        </Link>
        <Link to="/admin/marketing/growth-acquisition/email" className={BTN}>
          <Mail className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">4 · 21-day email</span>
          <span className="text-sm text-white/70">Nurture emails in the email room.</span>
        </Link>
        <Link to="/admin/marketing/view/start-restore-147" className={BTN}>
          <DollarSign className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">5 · $147 Start Restore</span>
          <span className="text-sm text-white/70">Offer copy + live /start.</span>
        </Link>
        <Link to="/admin/marketing/partner-referral/content" className={BTN}>
          <FileText className="text-[#fbbf24]" size={32} />
          <span className="text-xl font-bold text-white">6 · Partner one-sheets</span>
          <span className="text-sm text-white/70">Affiliate vertical HTML.</span>
        </Link>
      </div>
    </section>
  );
}
