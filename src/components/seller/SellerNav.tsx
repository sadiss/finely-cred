import React, { useMemo } from 'react';
import { DollarSign, FileText, LayoutGrid, List, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

function navBtn(active: boolean) {
  return `px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-[color:var(--brand-primary)] text-black border-white/20' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

export function SellerNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const path = location.pathname;

  const items = useMemo(
    () => [
      { path: '/seller/dashboard', label: 'Dashboard', icon: LayoutGrid },
      { path: '/seller/listings', label: 'Listings', icon: List },
      { path: '/seller/contracts', label: 'Contracts', icon: FileText },
      { path: '/seller/payouts', label: 'Payouts', icon: DollarSign },
    ],
    [],
  );

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {items.map((it) => {
          const active = path === it.path;
          const Icon = it.icon;
          return (
            <button key={it.path} className={navBtn(active)} onClick={() => navigate(it.path)} type="button">
              <Icon size={12} className="inline mr-2" />
              {it.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => auth.signOut().finally(() => navigate('/'))}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 text-[10px] font-black uppercase tracking-widest transition-all"
      >
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}

