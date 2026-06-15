import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LayoutDashboard, LogOut, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getUserDisplayName, getUserEmail, getUserRoleLabel } from '../../auth/userProfile';
import { UserAvatar } from './UserAvatar';
import { markSignedOutAndGoHome } from '../navigation/BackToSiteButton';
import { resolvePostAuthHomePath } from '../../lib/postAuthRouting';

type UserAccountMenuProps = {
  variant?: 'default' | 'compact';
  className?: string;
};

export function UserAccountMenu({ variant = 'default', className = '' }: UserAccountMenuProps) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const user = auth.user;
  const email = getUserEmail(user);
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRoleLabel(user);
  const isAdmin = email ? isAdminEmail(email) : false;
  const homePath = resolvePostAuthHomePath(user);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const logout = () => {
    setOpen(false);
    auth.signOut().finally(() => markSignedOutAndGoHome(navigate));
  };

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#07110d] hover:bg-[#0b1711] shadow-2xl shadow-black/40 ring-1 ring-black/40 transition-all fc-focus-ring ${
          variant === 'compact' ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        title="Account menu"
      >
        <UserAvatar user={user} size="sm" />
        {variant !== 'compact' ? (
          <>
            <span className="hidden sm:block text-left max-w-[140px]">
              <span className="block text-[11px] font-semibold text-white truncate">{displayName}</span>
              <span className="block text-[10px] text-emerald-100/70 truncate">{email || 'Signed in'}</span>
            </span>
            <ChevronDown size={14} className={`text-white/45 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <ChevronDown size={14} className={`text-white/45 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/[0.08] bg-fc-chrome/98 backdrop-blur-xl shadow-2xl overflow-hidden z-[200]"
        >
          <div className="px-4 py-4 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                <div className="text-[11px] text-white/50 truncate">{email || '—'}</div>
                {roleLabel ? (
                  <div className="mt-1 inline-flex px-2 py-0.5 rounded-full fc-light-glass-panel fc-light-chrome-panel border text-[9px] font-black uppercase tracking-widest text-white/55">
                    {roleLabel}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => go('/account/settings')}
              className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/[0.05] hover:text-white transition-all"
            >
              <Settings size={15} className="text-amber-300" />
              Account settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => go(homePath)}
              className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/[0.05] hover:text-white transition-all"
            >
              <LayoutDashboard size={15} className="text-white/55" />
              Dashboard
            </button>
            {isAdmin ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => go('/admin')}
                className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/[0.05] hover:text-white transition-all"
              >
                <Shield size={15} className="text-amber-300" />
                Admin
              </button>
            ) : null}
            {isAdmin ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => go('/portal/dashboard')}
                className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-white/75 hover:bg-white/[0.05] hover:text-white transition-all"
              >
                <LayoutDashboard size={15} className="text-emerald-300" />
                Partner portal
              </button>
            ) : null}
          </div>

          <div className="p-2 border-t border-white/[0.08] space-y-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/');
              }}
              className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-amber-200/90 hover:bg-amber-500/10 transition-all"
            >
              Back to site
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={logout}
              className="w-full text-left inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-red-200/90 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={15} />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
