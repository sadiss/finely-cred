import React, { useMemo } from 'react';
import { AlertTriangle, BookOpen, Building2, Crown, FileText, LayoutGrid, Target, Users } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FINELY_OS_VIEW_TABS, finelyOsViewTab } from '../../features/os/finelyOsLightUi';

const ITEMS = [
  { path: '/business/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { path: '/business/profile', label: 'Profile', icon: Building2 },
  { path: '/business/vendors', label: 'Vendors', icon: Users },
  { path: '/business/bureaus', label: 'Bureaus & Scores', icon: BookOpen },
  { path: '/business/lender-logic', label: 'Lender Logic', icon: Target },
  { path: '/business/disputes', label: 'Disputes', icon: AlertTriangle },
  { path: '/business/documents', label: 'Documents', icon: FileText },
  { path: '/business/billion-path', label: 'Billion Path', icon: Crown },
] as const;

export function BusinessNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const items = useMemo(() => ITEMS, []);

  return (
    <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
      {items.map((it) => {
        const active = path === it.path || path.startsWith(`${it.path}/`);
        const Icon = it.icon;
        return (
          <button key={it.path} type="button" className={finelyOsViewTab(active, 'emerald')} onClick={() => navigate(it.path)}>
            <Icon size={12} /> {it.label}
          </button>
        );
      })}
    </div>
  );
}
