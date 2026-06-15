import React from 'react';
import { QrCode, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildReferralGrowthSnapshot } from '../../lib/referralGrowthEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function AdminReferralGrowthPanel() {
  const navigate = useNavigate();
  const snap = buildReferralGrowthSnapshot();

  return (
    <div className={`${finelyOsGlassShell('panel', 'amber')} p-5 space-y-4`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
        <QrCode size={14} className="text-amber-300" /> Referral & QR growth (Phase 37)
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className={`${finelyOsGlassShell('inner', 'sky')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Clicks (30d)</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.clicks30d}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'emerald')} p-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Lead captures</div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>{snap.conversions30d}</div>
        </div>
        <div className={`${finelyOsGlassShell('inner', 'violet')} p-3`}>
          <div className={`flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <TrendingUp size={12} /> Conv rate
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-lg`}>
            {(snap.overallConversionRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>
      {snap.topCodes.length ? (
        <div className="space-y-1 text-xs">
          {snap.topCodes.slice(0, 5).map((c) => (
            <div key={c.code} className={FINELY_OS_ENTITY_BODY}>
              /g/{c.code.toLowerCase()} — {c.clicks} clicks · {c.conversions} leads
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => navigate('/free-guide?ref=demo')} className={FINELY_OS_SECONDARY_BTN}>
        Test short link flow
      </button>
    </div>
  );
}
