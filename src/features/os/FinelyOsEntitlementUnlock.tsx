import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Props = {
  moduleName: string;
  description?: string;
  packageHint?: string;
  billingHash?: string;
};

export function FinelyOsEntitlementUnlock({
  moduleName,
  description = 'Your account does not include this module yet. Review plans in Billing to unlock.',
  packageHint,
  billingHash = 'plans-section',
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-white/70">
      <div className="flex items-start gap-3">
        <Lock size={18} className="text-amber-300 mt-0.5 shrink-0" />
        <div className="space-y-3 min-w-0">
          <div>
            <div className="text-white font-semibold">{moduleName} is locked</div>
            <p className="text-white/70 text-sm mt-1">{description}</p>
            {packageHint ? <p className="text-white/50 text-xs mt-2">Typical unlock: {packageHint}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/portal/billing#${billingHash}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            Unlock in Billing <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
