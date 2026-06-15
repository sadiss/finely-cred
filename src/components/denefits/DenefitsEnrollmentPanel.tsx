import React from 'react';
import { AlertTriangle, ArrowRight, FileSignature } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DENEFITS } from '../../config/denefitsProgram';
import { Button } from '../ui';
import { isDenefitsConfigured, isFeatureEnabled } from '../../data/settingsRepo';

type Props = {
  audience?: 'specialist' | 'affiliate' | 'client';
  compact?: boolean;
};

export function DenefitsEnrollmentPanel({ audience = 'specialist', compact = false }: Props) {
  const navigate = useNavigate();
  const isLive = isFeatureEnabled('denefitsEnabled') && isDenefitsConfigured();

  const checkoutPath = '/portal/checkout?package=personal_restore&rail=in_house';
  const pricingPath = '/pricing';

  return (
    <div className={`fc-spotlight-panel space-y-4 ${compact ? 'p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-emerald-300">
            <FileSignature size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{DENEFITS.brandName} enrollment</span>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">Start an in-house contract</h3>
          <p className="mt-2 text-white/60 text-sm max-w-2xl">
            {audience === 'client'
              ? `Enroll in a ${DENEFITS.brandName} contract through Finely — pay over time when an in-house contract is configured for your package.`
              : audience === 'affiliate'
                ? `Refer a client into a ${DENEFITS.brandName} contract when financing is configured. Eligible reporting and commissions depend on the assigned contract.`
                : `Enroll your client in a ${DENEFITS.brandName} in-house contract when financing is configured. Eligible reporting and commissions depend on contract setup.`}
          </p>
          <p className="mt-2 text-emerald-200/70 text-xs">{DENEFITS.equifaxNote}</p>
        </div>
      </div>
      {!isLive ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-100/85 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-300" />
          <span>Preview mode — enable In-House Financing and assign Denefit contract URLs in Admin Settings before presenting this as live checkout.</span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" size="sm" onClick={() => navigate(checkoutPath)}>
          Enroll with {DENEFITS.brandName} <ArrowRight size={14} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(pricingPath)}>
          View pricing packages
        </Button>
        {audience !== 'client' ? (
          <Button variant="outline" size="sm" onClick={() => navigate('/portal/letters')}>
            Letter studio
          </Button>
        ) : null}
      </div>
    </div>
  );
}
