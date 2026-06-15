import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinelyOsRoleCommandCenter } from '../../features/os/FinelyOsRoleCommandCenter';

export function AuBuyerCommandStrip() {
  const navigate = useNavigate();

  return (
    <FinelyOsRoleCommandCenter
      roleLabel="AU Buyer · Role OS 2.0"
      headline="Tradeline buyer journey"
      subline="Browse inventory → submit intake → track fulfillment through order status."
      tiles={[
        { id: 'browse', label: 'Marketplace', value: 'Browse', accent: 'violet', onClick: () => navigate('/au/marketplace') },
        { id: 'request', label: 'Intake', value: 'Request', accent: 'emerald', onClick: () => navigate('/au/request') },
        { id: 'orders', label: 'Orders', value: 'Track', accent: 'amber', onClick: () => navigate('/au/orders') },
        { id: 'guide', label: 'Education', value: 'AU guide', accent: 'sky', onClick: () => navigate('/tradelines?focus=au') },
      ]}
      primaryAction={{ label: 'Submit AU request', onClick: () => navigate('/au/request') }}
      secondaryAction={{ label: 'My orders', onClick: () => navigate('/au/orders') }}
    />
  );
}
