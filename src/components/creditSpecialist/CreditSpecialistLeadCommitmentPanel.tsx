import React, { useMemo } from 'react';
import { CheckCircle2, Target, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CS_OFFER } from '../../config/creditSpecialistOffer';
import { CS } from '../../config/creditSpecialistProgram';
import { computeCreditSpecialistLeadCommitment } from '../../lib/creditSpecialistLeadCommitment';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type Props = {
  referralCode?: string | null;
  windowStartedAt?: string | null;
};

export function CreditSpecialistLeadCommitmentPanel({ referralCode, windowStartedAt }: Props) {
  const navigate = useNavigate();
  const progress = useMemo(
    () => computeCreditSpecialistLeadCommitment({ referralCode, windowStartedAt }),
    [referralCode, windowStartedAt],
  );

  const pct = Math.min(100, Math.round((progress.attributedCount / progress.minRequired) * 100));

  return (
    <section className={`${finelyOsCatalogCard('amber')} !p-4 space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={FINELY_OS_ENTITY_TITLE}>3-lead commitment tracker</p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>
            Partners attributed to your promo code count toward system access. Window:{' '}
            {progress.freeLeadsWindowDays} days from signup.
          </p>
        </div>
        {progress.met ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
            <CheckCircle2 size={14} /> Gate met
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-100">
            <Target size={14} /> {progress.remaining} to go
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className={finelyOsKpiTile(0)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Brought</div>
          <div className="text-xl font-black tabular-nums text-white">
            {progress.attributedCount}/{progress.minRequired}
          </div>
        </div>
        <div className={finelyOsKpiTile(1)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Days left</div>
          <div className="text-xl font-black tabular-nums text-white">
            {progress.daysLeft == null ? '—' : progress.windowExpired ? '0' : progress.daysLeft}
          </div>
        </div>
        <div className={finelyOsKpiTile(2)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Progress</div>
          <div className="text-xl font-black tabular-nums text-white">{pct}%</div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-black/40 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {!referralCode ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Set your promo / referral code so partner captures attribute to you in the leads system."
        />
      ) : null}

      {progress.windowExpired && !progress.met ? (
        <FinelyOsAlertBanner
          tone="warning"
          message={`${CS_OFFER.freeLeadsWindowDays}-day free-leads window ended before the ${CS_OFFER.minLeadsRequired}-lead gate. Use partnership line for next steps.`}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate(`${CS.hubPath}?tab=growth`)}>
          <Users size={14} /> Growth & promo links
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(CS_OFFER.guidePath)}>
          Share free guide
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(CS.messagesDeepLink)}>
          Partnership line
        </button>
      </div>
    </section>
  );
}
