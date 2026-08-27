import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Affiliate } from '../../domain/affiliate';
import { AF } from '../../config/affiliateProgram';
import { affiliateConversionStats, listAffiliateAttributionsAsync } from '../../data/affiliateRepo';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';
import { resolveFinelyCtaPath } from '../../lib/finelyCtaIntent';

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

  const sharePath = affiliate?.referralCode
    ? `${AF.publicPath}?ref=${encodeURIComponent(affiliate.referralCode)}`
    : AF.publicPath;

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="Affiliate · Role OS 2.0"
      headline={loading ? 'Loading affiliate profile…' : affiliate ? 'Your affiliate dashboard' : 'Link your affiliate profile'}
      subline="Share → attribute → convert referred partners → get paid. One strip for today’s job."
      tiles={[
        {
          id: 'clicks',
          label: 'Clicks',
          value: String(stats.clicks),
          accent: 'sky',
          onClick: () => navigate(`${AF.hubPath}?tab=operate`),
        },
        {
          id: 'leads',
          label: 'Leads',
          value: String(stats.leads),
          accent: 'violet',
          onClick: () => navigate(`${AF.hubPath}?tab=operate`),
        },
        {
          id: 'conv',
          label: 'Conversions',
          value: String(stats.conversions),
          accent: 'emerald',
          onClick: () => navigate(`${AF.hubPath}?tab=payouts`),
        },
        {
          id: 'pending',
          label: 'Pending payout',
          value: pending,
          hint: `Paid: ${payout}`,
          accent: 'rose',
          onClick: () => navigate(`${AF.hubPath}?tab=payouts`),
        },
      ]}
      alert={
        !affiliate?.referralCode
          ? { tone: 'warning', message: 'Confirm your affiliate profile so the referral code and payouts attach here.' }
          : campaigns === 0
            ? { tone: 'info', message: 'Create a campaign in Operate to attribute traffic and payouts.' }
            : nextCampaign !== 'None'
              ? { tone: 'success', message: `Active promo: ${nextCampaign}` }
              : undefined
      }
      primaryAction={{
        label: affiliate?.referralCode ? 'Share referral link' : 'Finish affiliate setup',
        onClick: () => navigate(affiliate?.referralCode ? sharePath : resolveFinelyCtaPath('affiliate_intake')),
      }}
      secondaryAction={{ label: 'Payout calc', onClick: () => navigate(`${AF.hubPath}?tab=calculator`) }}
    />
  );
}
