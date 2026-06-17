import React from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { partnerAccessBlocked } from '../../lib/partnerAccessControl';
import { useNavigate } from 'react-router-dom';

type Props = {
  partner: Partner | null;
  children: React.ReactNode;
};

/** Blocks portal content when partner access is pending or paused. */
export function PartnerAccessGate({ partner, children }: Props) {
  const navigate = useNavigate();
  const block = partnerAccessBlocked(partner);

  if (!block.blocked) return <>{children}</>;

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full fc-light-glass-panel fc-light-chrome-panel rounded-2xl p-8 space-y-4 text-center">
        <ShieldAlert className="mx-auto text-amber-400" size={32} />
        <h2 className="text-xl font-semibold text-white">Access pending</h2>
        <p className="text-white/55 text-sm leading-relaxed">{block.reason}</p>
        <p className="text-white/40 text-xs">
          Questions? Use the chat on our homepage or email partnersupport@finelycred.com.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full min-h-[44px] rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-sm"
        >
          Back to home
        </button>
      </div>
    </div>
  );
}
