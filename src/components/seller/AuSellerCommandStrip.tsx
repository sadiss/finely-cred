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

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="AU Seller · Role OS 2.0"
      headline={loading ? 'Loading seller profile…' : seller ? 'Seller command center' : 'Complete AU seller onboarding'}
      subline="List tradelines, manage contracts, and track verification + payouts from one strip."
      alert={
        verification === 'unverified'
          ? { tone: 'warning', message: 'KYC verification pending — submit documents in seller settings.' }
          : verification === 'verified'
            ? { tone: 'success', message: 'Seller verified — listings can go live on the marketplace.' }
            : undefined
      }
      tiles={[
        { id: 'status', label: 'Status', value: seller?.status ?? '—', accent: 'violet' },
        { id: 'kyc', label: 'KYC', value: verification, accent: verification === 'verified' ? 'emerald' : 'amber' },
        { id: 'live', label: 'Approved listings', value: String(live), accent: 'sky', onClick: () => navigate(AU_SELLER.listingsPath) },
        { id: 'queue', label: 'Submitted', value: String(pending), accent: 'fuchsia' },
      ]}
      primaryAction={{ label: 'Manage listings', onClick: () => navigate(AU_SELLER.listingsPath) }}
      secondaryAction={{ label: 'Marketplace', onClick: () => navigate(AU_SELLER.marketplacePath) }}
    />
  );
}
