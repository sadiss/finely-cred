import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Affiliate } from '../../domain/affiliate';
import { AF } from '../../config/affiliateProgram';
import { affiliateConversionStats, listAffiliateAttributionsAsync } from '../../data/affiliateRepo';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

type Props = {
  affiliate: Affiliate | null;
  loading?: boolean;
};

export function AffiliateCommandStrip({ affiliate, loading }: Props) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(() =>
    affiliate
      ? affiliateConversionStats(affiliate.id)
      : { clicks: 0, leads: 0, signups: 0, conversions: 0, payoutCents: 0, pendingPayoutCents: 0 },
  );

  useEffect(() => {
    if (!affiliate) return;
    void listAffiliateAttributionsAsync(affiliate.id).then(() => {
      setStats(affiliateConversionStats(affiliate.id));
    });
  }, [affiliate?.id]);

  const payout = `$${(stats.payoutCents / 100).toFixed(0)}`;
  const pending = `$${(stats.pendingPayoutCents / 100).toFixed(0)}`;
  const nextCampaign =
    affiliate?.campaigns?.find((c) => c.status === 'active')?.name ??
    affiliate?.campaigns?.[0]?.name ??
    'None';
  const campaigns = affiliate?.campaigns?.filter((c) => c.status === 'active').length ?? 0;

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Affiliate · Role OS 2.0"
      headline={loading ? 'Loading affiliate profile…' : affiliate ? 'Your affiliate dashboard' : 'Link your affiliate profile'}
      subline="Track clicks, leads, conversions, pending payout, and active promos from one strip."
      tiles={[
        { id: 'clicks', label: 'Clicks', value: String(stats.clicks), accent: 'sky' },
        { id: 'leads', label: 'Leads', value: String(stats.leads), accent: 'violet' },
        { id: 'conv', label: 'Conversions', value: String(stats.conversions), accent: 'emerald' },
        {
          id: 'pending',
          label: 'Pending payout',
          value: pending,
          hint: `Paid: ${payout}`,
          accent: 'amber',
          onClick: () => navigate(`${AF.hubPath}?tab=payouts`),
        },
      ]}
      alert={
        campaigns === 0 && affiliate
          ? { tone: 'info', message: 'Create a campaign in Operate to attribute traffic and commissions.' }
          : affiliate && nextCampaign !== 'None'
            ? { tone: 'success', message: `Next promo: ${nextCampaign}` }
            : undefined
      }
      primaryAction={{ label: 'Share referral link', onClick: () => navigate(AF.publicPath) }}
      secondaryAction={{ label: 'Campaigns', onClick: () => navigate(`${AF.hubPath}?tab=operate`) }}
    />
  );
}
