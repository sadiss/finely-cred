import React from 'react';
import { ArrowRight, Building2, CreditCard, DollarSign, Scale, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { navIntentProps } from '../routing/navIntent';

const SERVICES = [
  {
    title: 'Personal credit restore',
    desc: 'Evidence-backed credit restore — disputes, sequencing, and portal workflows.',
    path: '/services/personal-credit-restore',
    icon: Sparkles,
  },
  {
    title: 'Personal credit building',
    desc: 'Build and optimize profiles after restore — utilization, mix, and timing.',
    path: '/services/personal-credit-building',
    icon: CreditCard,
  },
  {
    title: 'Business credit',
    desc: 'EIN-first fundability — vendor lines, reporting discipline, and capital readiness.',
    path: '/services/business-credit',
    icon: Building2,
  },
  {
    title: 'Debt & legal strategy',
    desc: 'Collections, summons risk, validation — debt-first before bureau rounds.',
    path: '/services/debt-legal',
    icon: Scale,
  },
  {
    title: 'Wealth builder',
    desc: 'From stable credit → structured wealth paths and funding readiness.',
    path: '/services/wealth-builder',
    icon: DollarSign,
  },
];

export default function ServicesHubPage() {
  const navigate = useNavigate();

  return (
    <PageShell
      badge="Services"
      title="Credit restore & fundability — pick your lane"
      subtitle="DIY tools or done-for-you execution. Educational credit restore — not “credit repair” hype."
    >
      <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
        {SERVICES.map((s) => (
          <button
            key={s.path}
            type="button"
            onClick={() => navigate(s.path)}
            {...navIntentProps(s.path)}
            className="text-left rounded-2xl border border-white/15 bg-black/30 p-6 hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <s.icon className="text-amber-400" size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold text-white group-hover:text-amber-300">{s.title}</div>
                <p className="text-white/70 text-sm mt-2 leading-relaxed">{s.desc}</p>
                <span className="inline-flex items-center gap-1 text-amber-400 text-sm font-semibold mt-3">
                  View packages <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate('/pricing')}
          {...navIntentProps('/pricing')}
          className="px-6 py-3 rounded-xl bg-[#fbbf24] text-[#0b1110] font-black uppercase tracking-wider text-xs"
        >
          Full pricing grid
        </button>
        <button
          type="button"
          onClick={() => navigate('/start')}
          {...navIntentProps('/start')}
          className="px-6 py-3 rounded-xl border border-amber-500/40 text-amber-200 font-bold text-sm"
        >
          Start Restore — $147
        </button>
      </div>
    </PageShell>
  );
}
