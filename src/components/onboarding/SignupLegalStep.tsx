import React, { useMemo } from 'react';
import { ExternalLink, FileCheck2, ChevronDown } from 'lucide-react';
import type { OnboardingRole } from '../../onboarding/pipeline';
import {
  allRequiredLegalAccepted,
  signupLegalItems,
  type SignupLegalItemId,
} from '../../lib/signupLegalPack';
import { signupLegalPreviewText } from '../../lib/signupLegalPreview';

type StepProps = {
  next: () => void;
  prev?: () => void;
  data: any;
  update: (data: any) => void;
};

export function SignupLegalStep({ data, update }: StepProps) {
  const role = (data.role || 'client') as OnboardingRole;
  const ctx = useMemo(
    () => ({
      role,
      focuses: Array.isArray(data.focuses) ? data.focuses : [],
      lane: data.lane,
      goal: data.goal,
    }),
    [role, data.focuses, data.lane, data.goal],
  );
  const items = useMemo(() => signupLegalItems(ctx), [ctx]);
  const checked: Partial<Record<SignupLegalItemId, boolean>> = data.legalChecks ?? {};
  const acceptedName = (data.legalAcceptedName || data.name || '').trim();

  const allChecked = allRequiredLegalAccepted(ctx, checked);
  const canContinue = allChecked && acceptedName.length >= 2;

  const toggle = (id: SignupLegalItemId, value: boolean) => {
    update({ legalChecks: { ...checked, [id]: value } });
  };

  const acceptAll = () => {
    const nextChecks = Object.fromEntries(items.map((i) => [i.id, true])) as Record<SignupLegalItemId, boolean>;
    update({ legalChecks: nextChecks });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.35em] sm:tracking-[0.6em] text-fuchsia-400 uppercase">
          Legal & confidentiality
        </p>
        <h2 className="fc-onboarding-step-title">
          Review what you&apos;re signing <span className="text-fuchsia-400">for your role</span>
        </h2>
        <p className="text-white/60 text-base sm:text-lg font-light max-w-2xl">
          Expand each agreement to read the summary for your path. These cover active work and a clean exit later — not
          marketing solicitations.
        </p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
              {items.filter((i) => i.required).length} required for {role.replace(/_/g, ' ')}
            </span>
            <button
              type="button"
              onClick={acceptAll}
              className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 hover:text-fuchsia-200 min-h-[44px] px-2 touch-manipulation"
            >
              Accept all required
            </button>
          </div>

          {items.map((item) => {
            const on = Boolean(checked[item.id]);
            const preview = signupLegalPreviewText(item.id, role);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                  on ? 'border-emerald-500/35 bg-emerald-500/8' : 'border-white/[0.12] bg-white/[0.05]'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                    className="mt-1 h-4 w-4 accent-fuchsia-500 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-semibold text-sm sm:text-base">{item.label}</span>
                      {item.required ? (
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-200/90 border border-amber-400/30 rounded-full px-2 py-0.5">
                          Required
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-white/60 text-xs sm:text-sm leading-relaxed">{item.summary}</p>
                  </div>
                </label>

                {preview ? (
                  <details className="mt-3 ml-7 group">
                    <summary className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300 hover:text-fuchsia-200 cursor-pointer list-none touch-manipulation min-h-[44px]">
                      <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
                      View agreement summary
                    </summary>
                    <div className="mt-2 rounded-xl border border-white/[0.1] bg-[#0a1018]/90 p-3 sm:p-4 text-white/70 text-xs sm:text-sm leading-relaxed">
                      {preview}
                    </div>
                  </details>
                ) : null}

                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 ml-7 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45 hover:text-fuchsia-200 touch-manipulation min-h-[44px]"
                >
                  Open full document <ExternalLink size={12} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/[0.12] bg-white/[0.05] p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-fuchsia-300">
            <FileCheck2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Electronic signature</span>
          </div>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
            Type your full legal name to sign these agreements electronically.
          </p>
          <input
            value={data.legalAcceptedName || data.name || ''}
            onChange={(e) => update({ legalAcceptedName: e.target.value })}
            placeholder="Full legal name"
            className="w-full min-h-[48px] rounded-xl border border-white/[0.12] bg-[#0a1018] px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500"
          />
          {!canContinue && allChecked ? (
            <p className="text-xs text-amber-200/90">Enter your full legal name to continue.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
