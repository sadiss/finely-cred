import React, { useMemo, useState } from 'react';
import { Bot, Repeat, ShoppingBag, Sparkles } from 'lucide-react';
import { AU_SELLER } from '../../config/auSellerProgram';
import { listAutomationsForRole, listResidualIncomeAutomations, toSiteAutomationRole } from '../../lib/siteAutomationAccess';
import { callAiGateway } from '../../lib/aiClient';
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
  partnerId?: string;
  listingsCount?: number;
};

export function AuSellerRoleAutomationPanel({ partnerId, listingsCount = 0 }: Props) {
  const automations = useMemo(
    () => listAutomationsForRole({ role: 'au_seller', partnerId, includePrepared: false }),
    [partnerId],
  );
  const prepared = useMemo(
    () => listAutomationsForRole({ role: 'au_seller', partnerId, includePrepared: true }).filter((a) => a.prepared),
    [partnerId],
  );
  const residual = useMemo(() => listResidualIncomeAutomations('au_seller'), []);
  const [listingTip, setListingTip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const optimizeListing = async () => {
    setBusy(true);
    try {
      const res = await callAiGateway({
        taskType: 'marketing.copy',
        messages: [
          {
            role: 'system',
            content:
              'You are an AU marketplace listing coach. Suggest compliant listing title, description bullets, and pricing tips. No guaranteed score outcomes. Educational only.',
          },
          { role: 'user', content: `Seller has ${listingsCount} active listings. Optimize a tradeline supply listing for Finely AU marketplace.` },
        ],
      });
      setListingTip(res.text.trim());
    } catch {
      setListingTip('Listing optimizer unavailable — review compliance checklist in Seller Listings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`grid md:grid-cols-3 gap-4 ${finelyOsCatalogCard('emerald')} !p-5`}>
        <div className={finelyOsKpiTile(0)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Seller share</div>
          <div className="text-2xl font-bold text-emerald-200">{AU_SELLER.defaultCommissionPct}%</div>
        </div>
        <div className={finelyOsKpiTile(1)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Active listings</div>
          <div className="text-2xl font-bold text-white">{listingsCount}</div>
        </div>
        <div className={finelyOsKpiTile(2)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Marketplace</div>
          <div className="text-sm font-bold text-sky-200 mt-2">{AU_SELLER.marketplacePath}</div>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
          <Repeat size={16} /> Recurring supply income
        </div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
          Earn on each AU order plus recurring supply contracts when buyers renew tradeline placements (prepared for production rollout).
        </p>
        <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
          {residual.map((r) => (
            <li key={r.id}>• {r.title}</li>
          ))}
        </ul>
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-3`}>
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
          <Sparkles size={16} /> AI listing optimizer
        </div>
        <button type="button" onClick={() => void optimizeListing()} disabled={busy} className={FINELY_OS_PRIMARY_BTN}>
          <Bot size={14} /> {busy ? 'Analyzing…' : 'Optimize listing copy'}
        </button>
        {listingTip ? <pre className={`text-xs whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY} max-h-48 overflow-y-auto`}>{listingTip}</pre> : null}
        <button type="button" onClick={() => window.location.assign('/seller/listings')} className={FINELY_OS_SECONDARY_BTN}>
          <ShoppingBag size={14} /> Manage listings
        </button>
      </div>

      <div className="space-y-2">
        <div className={FINELY_OS_ENTITY_VALUE}>Active automations</div>
        <div className="grid md:grid-cols-2 gap-3">
          {automations.map((a) => (
            <div key={a.id} className={`${finelyOsCatalogCard('emerald')} !p-4`}>
              <div className="text-sm font-semibold text-white">{a.title}</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{a.description}</p>
            </div>
          ))}
        </div>
      </div>

      {prepared.length ? (
        <div className={`${finelyOsCatalogCard('amber')} !p-4 opacity-80`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px] uppercase`}>Prepared (not live)</div>
          <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} mt-2 space-y-1`}>
            {prepared.map((p) => (
              <li key={p.id}>• {p.title}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
