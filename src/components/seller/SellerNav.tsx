import React, { useMemo } from 'react';
import { DollarSign, FileText, LayoutGrid, List, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FINELY_OS_VIEW_TABS, finelyOsViewTab } from '../../features/os/finelyOsLightUi';

export function SellerNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const items = useMemo(
    () => [
      { path: '/seller/hub', label: 'Seller Hub', icon: Sparkles },
      { path: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid },
      { path: '/seller/listings', label: 'Listings', icon: List },
      { path: '/seller/contracts', label: 'Contracts', icon: FileText },
      { path: '/seller/payouts', label: 'Payouts', icon: DollarSign },
    ],
    [],
  );

  return (
    <div className={`mb-6 ${FINELY_OS_VIEW_TABS} flex-wrap`}>
      {items.map((it) => {
        const active = path === it.path || (it.path === '/seller/hub' && path.startsWith('/seller/hub'));
        const Icon = it.icon;
        return (
          <button key={it.path} type="button" className={finelyOsViewTab(active, 'violet')} onClick={() => navigate(it.path)}>
            <Icon size={12} /> {it.label}
          </button>
        );
      })}
    </div>
  );
}
