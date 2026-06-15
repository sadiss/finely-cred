import React, { useState } from 'react';
import type { Affiliate, AffiliateCampaign } from '../../domain/affiliate';
import { upsertAffiliateCampaign } from '../../data/affiliateRepo';
import { newId } from '../../utils/ids';
import { nowIso } from '../../domain/affiliate';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
  finelyOsCatalogCard,} from '../../features/os/finelyOsLightUi';

type Props = {
  affiliate: Affiliate;
  onUpdated: (affiliate: Affiliate) => void;
};

export function AffiliateCampaignManager({ affiliate, onUpdated }: Props) {
  const [name, setName] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [landingPath, setLandingPath] = useState('/onboarding');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    if (!name.trim()) {
      setErr('Campaign name required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const now = nowIso();
      const campaign: AffiliateCampaign = {
        id: newId('camp'),
        affiliateId: affiliate.id,
        name: name.trim(),
        utmSource: 'affiliate',
        utmMedium: 'referral',
        utmCampaign: utmCampaign.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        landingPath: landingPath.trim() || '/onboarding',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      await upsertAffiliateCampaign(campaign);
      onUpdated({
        ...affiliate,
        campaigns: [...affiliate.campaigns, campaign],
        updatedAt: now,
      });
      setName('');
      setUtmCampaign('');
    } catch (e: any) {
      setErr(e?.message || 'Failed to create campaign.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
        <span>Campaign manager</span>
      </div>
      {err ? <div className="text-sm text-rose-300">{err}</div> : null}

      <div className="grid md:grid-cols-3 gap-3">
        <label className="block">
          <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Spring launch" />
        </label>
        <label className="block">
          <div className={FINELY_OS_ENTITY_LABEL}>UTM campaign</div>
          <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="spring-2026" />
        </label>
        <label className="block">
          <div className={FINELY_OS_ENTITY_LABEL}>Landing path</div>
          <input value={landingPath} onChange={(e) => setLandingPath(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
        </label>
      </div>
      <button type="button" disabled={busy} onClick={() => void create()} className={FINELY_OS_PRIMARY_BTN}>
        Create campaign
      </button>

      <div className="space-y-2">
        {affiliate.campaigns.length === 0 ? (
          <div className={FINELY_OS_ENTITY_BODY}>No campaigns yet.</div>
        ) : (
          affiliate.campaigns.map((c) => (
            <div key={c.id} className={`${finelyOsInlineListItem()} p-4`}>
              <div className={FINELY_OS_ENTITY_VALUE}>{c.name}</div>
              <div className={`mt-1 text-xs font-mono ${FINELY_OS_ENTITY_BODY}`}>
                utm_campaign={c.utmCampaign} • {c.landingPath} • {c.status}
              </div>
              <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                Share: {c.landingPath}?ref={affiliate.referralCode}&utm_source={c.utmSource ?? 'affiliate'}&utm_campaign={c.utmCampaign}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
