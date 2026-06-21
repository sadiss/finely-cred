import React from 'react';
import { ArrowRight, Calendar, Megaphone, RefreshCcw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AU_SELLER, AU_SELLER_ACTIVATION_BULLETS, AU_SELLER_MARKETING_HEADLINE } from '../../config/auSellerProgram';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

type Props = {
  variant?: 'paywall' | 'hub';
  activated?: boolean;
};

export function AuSellerActivationPanel({ variant = 'paywall', activated = false }: Props) {
  const navigate = useNavigate();
  const fee = (AU_SELLER.startupFeeCents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-5">
      <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-4`}>
        <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300/90`}>AU Seller Program</p>
        <h2 className={`text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{AU_SELLER_MARKETING_HEADLINE}</h2>
        <p className={FINELY_OS_ENTITY_BODY}>
          You supply verified tradeline cards. Finely runs marketplace marketing, buyer intake, and order routing. You fulfill placements and collect payouts — no cold outreach required.
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className={finelyOsKpiTile(0)}>
            <Megaphone size={16} className="text-violet-400 mb-2" />
            <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Marketing</div>
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Done for you</div>
          </div>
          <div className={finelyOsKpiTile(1)}>
            <Calendar size={16} className="text-emerald-400 mb-2" />
            <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Listing season</div>
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{AU_SELLER.listingSeasonDays} days included</div>
          </div>
          <div className={finelyOsKpiTile(2)}>
            <Wallet size={16} className="text-amber-400 mb-2" />
            <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>Activation</div>
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{fee} once</div>
          </div>
        </div>
        <ul className={`text-sm ${FINELY_OS_ENTITY_BODY} space-y-2 list-disc pl-5`}>
          {AU_SELLER_ACTIVATION_BULLETS.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {!activated ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/portal/checkout?package=${AU_SELLER.checkoutPackageId}&rail=stripe`)}
              className={FINELY_OS_PRIMARY_BTN}
            >
              Pay {AU_SELLER.startupFeeLabel} & activate <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/onboarding?lane=au_seller')} className={FINELY_OS_SECONDARY_BTN}>
              Review seller signup
            </button>
          </div>
        ) : (
          <div className={`text-sm ${FINELY_OS_ENTITY_BODY} flex items-center gap-2`}>
            <RefreshCcw size={14} className="text-emerald-400" />
            Activation active — list inventory, fulfill buyers, and rotate cards each {AU_SELLER.listingSeasonDays}-day season.
          </div>
        )}
      </div>

      {variant === 'hub' && activated ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-5 ${FINELY_OS_ENTITY_BODY} text-sm`}>
          <strong className={FINELY_OS_ENTITY_VALUE}>How seasons work:</strong> list a card → Finely markets it → fulfill 1–{AU_SELLER.maxConcurrentSlotsPerCard} AU slots → remove buyers after the season → rest or swap to your next card. Keeps inventory fresh and protects your primary accounts.
        </div>
      ) : null}
    </div>
  );
}
