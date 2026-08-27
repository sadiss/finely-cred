import React from 'react';
import { ArrowRight, Lock, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openCommunicationHub } from '../../components/chat/communicationHubModel';

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
    <div className="rounded-2xl border border-rose-400/35 bg-rose-500/10 p-6 text-white/70">
      <div className="flex items-start gap-3">
        <Lock size={18} className="text-rose-300 mt-0.5 shrink-0" />
        <div className="space-y-3 min-w-0">
          <div>
            <div className="text-white font-semibold">{moduleName} is locked</div>
            <p className="text-white/70 text-sm mt-1">{description}</p>
            {packageHint ? <p className="text-white/50 text-xs mt-2">Typical unlock: {packageHint}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/portal/billing#${billingHash}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              Unlock in Billing <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() =>
                openCommunicationHub({
                  tab: 'team',
                  expanded: true,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-400/40 bg-violet-500/15 text-violet-100 font-black uppercase tracking-widest text-[10px] hover:bg-violet-500/25 transition-all"
            >
              <MessageSquare size={14} /> Ask your specialist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
