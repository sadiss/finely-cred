import React from 'react';
import { ArrowRight, Building2, Inbox, Target, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  prospectTotal: number;
  prospectDueSoon: number;
  prospectUnassigned: number;
  inboundTotal: number;
  partnerTotal: number;
  activeTab: 'prospects' | 'inbound' | 'partners';
  onTabChange: (t: 'prospects' | 'inbound' | 'partners') => void;
};

export function CrmCommandHubPanel({
  prospectTotal,
  prospectDueSoon,
  prospectUnassigned,
  inboundTotal,
  partnerTotal,
  activeTab,
  onTabChange,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-black/25 to-black/45 p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-sky-300">
            <Target size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Acquisition command center</span>
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-white">CRM — before they become projects</h2>
          <p className="mt-2 text-sm text-white/55 max-w-3xl leading-relaxed">
            Prospects and inbound leads live here. When you convert, Finely creates a partner + follow-up task — then{' '}
            <strong className="text-white/75">Projects</strong> and <strong className="text-white/75">Tasks</strong> handle delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/admin/workflow')} className="fc-button-soft px-3 py-2 text-[10px]">
            Ops inbox
          </button>
          <button type="button" onClick={() => navigate('/admin/lead-intel')} className="fc-button-white-sm">
            Lead intel <ArrowRight size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'prospects' as const, label: 'Prospects', value: prospectTotal, hint: `${prospectDueSoon} due soon`, icon: UserPlus },
          { id: 'inbound' as const, label: 'Inbound', value: inboundTotal, hint: 'Lead captures', icon: Inbox },
          { id: 'partners' as const, label: 'Partners', value: partnerTotal, hint: 'Active customers', icon: Users },
          { id: 'prospects' as const, label: 'Unassigned', value: prospectUnassigned, hint: 'Need owner', icon: Building2 },
        ].map((m, idx) => {
          const Icon = m.icon;
          const on = activeTab === m.id && idx < 3;
          return (
            <button
              key={`${m.id}-${idx}`}
              type="button"
              onClick={() => onTabChange(m.id)}
              className={`text-left rounded-xl border p-4 transition-all ${
                on ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/[0.08] bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <Icon size={14} className={on ? 'text-sky-300' : 'text-white/45'} />
              <p className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{m.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
              <p className="text-[10px] text-white/45 mt-1">{m.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
