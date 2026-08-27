import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Camera,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isStaffEmail } from '../../../../auth/staffIdentity';
import { exitAdminPartnerView } from '../../../../lib/adminPartnerViewAs';
import {
  getUserAvatarUrl,
  getUserDisplayName,
  getUserEmail,
  getUserInitials,
} from '../../../../auth/userProfile';
import { clearOnboardingProgress } from '../../../../lib/onboardingProgressStorage';
import { resizeImageToDataUrl } from '../../../../utils/resizeImage';
import type { WorkspaceProductRole } from '../workspaceProductTokens';

export function ProductProfileMenu({
  role,
  compact = false,
  navigationMode = 'preview',
}: {
  role: WorkspaceProductRole;
  compact?: boolean;
  navigationMode?: 'preview' | 'live';
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const user = auth.user;
  const displayName = user ? getUserDisplayName(user) : role === 'admin' ? 'Admin workspace' : 'Partner workspace';
  const email = user ? getUserEmail(user) : 'Workspace review session';
  const staffOnPartnerPortal = role === 'partner' && Boolean(user && isStaffEmail(getUserEmail(user)));
  const initials = user ? getUserInitials(user) : null;
  const avatarUrl = user ? getUserAvatarUrl(user) : null;

  /**
   * Photo changes go through the same resize + `updateUserProfile` path the account settings
   * page uses, so an avatar set here shows up everywhere the app reads `avatar_url` — no
   * preview-only copy of the profile to drift out of sync.
   */
  const pickPhoto = async (file: File | null) => {
    if (!file || !user) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await auth.updateUserProfile({ avatar_url: dataUrl });
      if (res.error) throw new Error(res.error);
    } catch (err) {
      setPhotoError((err as Error)?.message || 'Could not update your photo.');
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!user) return;
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const res = await auth.updateUserProfile({ avatar_url: null });
      if (res.error) throw new Error(res.error);
    } catch (err) {
      setPhotoError((err as Error)?.message || 'Could not remove your photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    queueMicrotask(() => firstItemRef.current?.focus());
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const logout = () => {
    if (!user) return;
    setOpen(false);
    clearOnboardingProgress();
    void auth.signOut().finally(() => navigate('/'));
  };

  return (
    <div className="fc-wlp-profile" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="fc-wlp-profile-trigger"
        data-open={open ? 'true' : undefined}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label={`Open account menu for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fc-wlp-profile-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : initials ? <span>{initials}</span> : <UserRound size={17} />}
        </span>
        {!compact ? (
          <span className="fc-wlp-profile-copy">
            <strong>{displayName}</strong>
            <span>{role === 'admin' ? 'Admin workspace' : 'Partner portal'}</span>
          </span>
        ) : null}
        <ChevronDown className="fc-wlp-profile-chevron" size={14} aria-hidden />
      </button>

      {open ? (
        <div id={menuId} className="fc-wlp-profile-menu" role="menu" aria-label="Account menu">
          <div className="fc-wlp-profile-summary">
            <span className="fc-wlp-profile-avatar fc-wlp-profile-avatar--large">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : initials ? <span>{initials}</span> : <UserRound size={21} />}
              {user ? (
                <button
                  type="button"
                  className="fc-wlp-profile-avatar-edit"
                  onClick={() => fileRef.current?.click()}
                  disabled={photoBusy}
                  aria-label="Upload a profile photo"
                  title="Upload a profile photo"
                >
                  {photoBusy ? <Loader2 size={13} className="fc-wlp-spin" /> : <Camera size={13} />}
                </button>
              ) : null}
            </span>
            <span>
              <strong>{displayName}</strong>
              <span>{email}</span>
              <em>{role === 'admin' ? 'Administrator' : 'Partner'}</em>
            </span>
          </div>

          {user ? (
            <div className="fc-wlp-profile-photo-row">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => void pickPhoto(event.target.files?.[0] ?? null)}
              />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
                <Camera size={14} />
                {avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  className="fc-wlp-profile-photo-remove"
                  onClick={() => void removePhoto()}
                  disabled={photoBusy}
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
          {photoError ? <p className="fc-wlp-profile-photo-error">{photoError}</p> : null}

          <div className="fc-wlp-profile-actions">
            <button
              ref={firstItemRef}
              type="button"
              role="menuitem"
              onClick={() =>
                go(
                  navigationMode === 'live'
                    ? role === 'admin'
                      ? '/admin/settings'
                      : '/account/settings'
                    : role === 'admin'
                      ? '/preview/workspace-light/admin/settings'
                      : '/preview/workspace-light/portal/account',
                )
              }
            >
              <Settings size={16} />
              Account settings
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                go(
                  navigationMode === 'live'
                    ? role === 'admin'
                      ? '/admin'
                      : '/portal/dashboard'
                    : role === 'admin'
                      ? '/preview/workspace-light/admin/dashboard'
                      : '/preview/workspace-light/portal/dashboard',
                )
              }
            >
              <LayoutDashboard size={16} />
              Workspace home
            </button>
            {role === 'admin' ? (
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  go(
                    navigationMode === 'live'
                      ? '/portal/dashboard'
                      : '/preview/workspace-light/portal/dashboard',
                  )
                }
              >
                <ShieldCheck size={16} />
                Partner portal
              </button>
            ) : null}
            {staffOnPartnerPortal ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  exitAdminPartnerView(navigate);
                }}
              >
                <ShieldCheck size={16} />
                Back to admin
              </button>
            ) : null}
            <button type="button" role="menuitem" onClick={() => go('/')}>
              <ExternalLink size={16} />
              Back to site
            </button>
          </div>

          {user ? (
            <div className="fc-wlp-profile-signout">
              <button type="button" role="menuitem" onClick={logout}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          ) : (
            <p className="fc-wlp-profile-demo-note">Workspace review identity · no account session is active.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
