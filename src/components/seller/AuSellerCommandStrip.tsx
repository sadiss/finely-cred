import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuSeller } from '../../domain/auSeller';
import { AU_SELLER } from '../../config/auSellerProgram';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

type Props = {
  seller: AuSeller | null;
  loading?: boolean;
};

export function AuSellerCommandStrip({ seller, loading }: Props) {
  const navigate = useNavigate();
  const listings = seller?.listings ?? [];
  const live = listings.filter((l) => l.status === 'approved').length;
  const pending = listings.filter((l) => l.status === 'submitted').length;
  const verification = seller?.verification?.status ?? 'unverified';

  const needsList = live === 0 && pending === 0;

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="AU Seller · Role OS 2.0"
      headline={loading ? 'Loading seller profile…' : seller ? 'Seller command center' : 'Complete AU seller onboarding'}
      subline="List → verify → fulfill partner placements → get paid. One strip for today’s job."
      alert={
        !seller
          ? { tone: 'warning', message: 'Seller profile incomplete — finish onboarding so listings and payouts attach here.' }
          : verification === 'unverified' || verification === 'in_review'
            ? { tone: 'warning', message: 'KYC verification pending — submit documents so approved listings can go live.' }
            : needsList
              ? { tone: 'info', message: 'No listings yet — add card inventory so Finely can market seats to partners.' }
              : verification === 'verified'
                ? { tone: 'success', message: 'Seller verified — keep listings accurate and fulfill AU adds when orders route.' }
                : undefined
      }
      tiles={[
        {
          id: 'status',
          label: 'Status',
          value: seller?.status ?? '—',
          accent: 'violet',
          onClick: () => navigate(AU_SELLER.listingsPath),
        },
        {
          id: 'kyc',
          label: 'KYC',
          value: verification,
          accent: verification === 'verified' ? 'emerald' : 'rose',
          onClick: () => navigate(AU_SELLER.contractsPath),
        },
        {
          id: 'live',
          label: 'Approved listings',
          value: String(live),
          accent: 'sky',
          onClick: () => navigate(AU_SELLER.listingsPath),
        },
        {
          id: 'queue',
          label: 'Submitted',
          value: String(pending),
          accent: 'fuchsia',
          onClick: () => navigate(AU_SELLER.listingsPath),
        },
      ]}
      primaryAction={{
        label: needsList ? 'Add first listing' : 'Manage listings',
        onClick: () => navigate(AU_SELLER.listingsPath),
      }}
      secondaryAction={{
        label: verification === 'verified' ? 'Partner marketplace' : 'Finish verification',
        onClick: () =>
          navigate(verification === 'verified' ? AU_SELLER.marketplacePath : AU_SELLER.contractsPath),
      }}
    />
  );
}
