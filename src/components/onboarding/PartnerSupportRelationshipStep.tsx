import React from 'react';
import { HandHeart, RefreshCw, UserCheck, Users } from 'lucide-react';

export type PartnerSupportModel =
  | 'solo'
  | 'finely_specialist'
  | 'transferred_company'
  | 'family_helper'
  | 'building_as_specialist';

const OPTIONS: Array<{
  id: PartnerSupportModel;
  title: string;
  subtitle: string;
  icon: typeof Users;
}> = [
  {
    id: 'solo',
    title: 'I am doing this on my own',
    subtitle: 'Self-serve portal — Finely tools guide you step by step.',
    icon: UserCheck,
  },
  {
    id: 'finely_specialist',
    title: 'A Finely Cred credit specialist is helping me',
    subtitle: 'Your specialist sees your file, messages, and dispute progress in the hub.',
    icon: HandHeart,
  },
  {
    id: 'transferred_company',
    title: 'I transferred from another credit company',
    subtitle: 'Round 2+ disputes, prior letters elsewhere — we pick up where they left off.',
    icon: RefreshCw,
  },
  {
    id: 'family_helper',
    title: 'A family member or trusted helper is involved',
    subtitle: 'They may assist with uploads and letters — you remain the account owner.',
    icon: Users,
  },
  {
    id: 'building_as_specialist',
    title: 'I am building a credit specialist practice',
    subtitle: 'Operator path — client files, white-label workflows, and specialist hub.',
    icon: Users,
  },
];

export function PartnerSupportRelationshipStep({
  data,
  update,
}: {
  data: Record<string, unknown>;
  update: (patch: Record<string, unknown>) => void;
}) {
  const selected = (data.supportModel as PartnerSupportModel) || '';
  const helperName = String(data.helperName || '');
  const priorCompany = String(data.priorCompany || '');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 text-left min-w-0">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.35em] text-fuchsia-400 uppercase">Your support model</p>
        <h2 className="fc-onboarding-step-title">
          Who is helping you on this <span className="text-fuchsia-400">credit journey?</span>
        </h2>
        <p className="text-white/45 text-base sm:text-lg font-light max-w-2xl">
          This shapes your onboarding checklist, dispute round defaults, and how your specialist partners with you — not a legal relationship, just how we route your experience.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-4xl">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => update({ supportModel: opt.id })}
              className={`text-left rounded-2xl border p-4 transition-all ${
                active
                  ? 'border-fuchsia-400/50 bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${active ? 'border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-100' : 'border-white/10 text-white/40'}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{opt.title}</div>
                  <div className="mt-1 text-xs text-white/45 leading-relaxed">{opt.subtitle}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected === 'finely_specialist' || selected === 'family_helper' ? (
        <label className="block max-w-md space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {selected === 'finely_specialist' ? 'Specialist name (optional)' : 'Helper name (optional)'}
          </span>
          <input
            value={helperName}
            onChange={(e) => update({ helperName: e.target.value })}
            placeholder={selected === 'finely_specialist' ? 'e.g. Alex from Finely Cred' : 'e.g. Jordan (spouse)'}
            className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-fuchsia-500"
          />
        </label>
      ) : null}

      {selected === 'transferred_company' ? (
        <label className="block max-w-md space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Prior company (optional)</span>
          <input
            value={priorCompany}
            onChange={(e) => update({ priorCompany: e.target.value })}
            placeholder="e.g. Previous restoration company — starting Round 2"
            className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500"
          />
          <p className="text-xs text-white/40">We will suggest Round 2+ in Letter Studio and ask for transfer notes on your first letters.</p>
        </label>
      ) : null}
    </div>
  );
}

export function supportModelLabel(model?: string): string {
  return OPTIONS.find((o) => o.id === model)?.title ?? 'Not set';
}
