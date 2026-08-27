import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  CircleHelp,
  FileCheck2,
  Link2,
  LogOut,
  Mail,
  MapPin,
  PlayCircle,
  Save,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCircle2,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { getUserDisplayName, getUserEmail, getUserProfileMeta, getUserRoleLabel } from '../../../../auth/userProfile';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { upsertPartner, getPartnerSync } from '../../../../data/partnersRepo';
import { getNotificationPrefs, upsertNotificationPrefs } from '../../../../data/notificationPrefsRepo';
import { nowIso } from '../../../../domain/partners';
import type { Partner } from '../../../../domain/partners';
import { PasswordInput } from '../../../../components/ui/PasswordInput';
import { UserAvatar } from '../../../../components/account/UserAvatar';
import { MfaEnrollmentPanel } from '../../../../components/auth/MfaEnrollmentPanel';
import { CommsWorkspaceActions } from '../../../../components/comms/CommsWorkspaceActions';
import { markSignedOutAndGoHome } from '../../../../components/navigation/BackToSiteButton';
import { clearOnboardingProgress } from '../../../../lib/onboardingProgressStorage';
import { resizeImageToDataUrl } from '../../../../utils/resizeImage';
import { CS } from '../../../../config/creditSpecialistProgram';
import { AF } from '../../../../config/affiliateProgram';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import './partnerWorkstationSurfaceTabs.css';

type StudioTool = 'profile' | 'contact' | 'notifications' | 'security' | 'account';

const STUDIO_TOOLS: Array<{ id: StudioTool; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'contact', label: 'Contact', icon: MapPin },
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'account', label: 'Links', icon: Link2 },
];

function formatFreshness(iso?: string): string {
  if (!iso) return 'no updates yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function countConsents(partner: Partner): { accepted: number; total: number; missing: string[] } {
  const consents = partner.consents ?? {};
  const tracked: Array<[string, string | undefined]> = [
    ['Terms of service', consents.termsAcceptedAt],
    ['Privacy policy', consents.privacyAcceptedAt],
    ['Communication consent', consents.communicationConsentAt],
    ['Services agreement', consents.servicesAgreementAcceptedAt],
  ];
  const accepted = tracked.filter(([, value]) => Boolean(value)).length;
  const missing = tracked.filter(([, value]) => !value).map(([label]) => label);
  return { accepted, total: tracked.length, missing };
}

function hasMailingAddress(partner: Partner): boolean {
  const intake = partner.routes?.personal_restore ?? partner.routes?.personal_build;
  const personal = intake?.personal;
  return Boolean(personal?.address1 && personal?.city && personal?.state && personal?.postalCode);
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; partner: Partner };

export default function PartnerAccountProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner, refresh: refreshPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? UserCircle2;
  const livePath = mapPortalHref(navItem?.legacyPath ?? '/account/settings');
  const accent = navItem?.accent ?? 'violet';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const isDemo = dataMode === 'demo' || !partnerId;
  const fileRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [tool, setTool] = useState<StudioTool>('profile');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = getUserEmail(auth.user);
  const meta = getUserProfileMeta(auth.user);
  const roleLabel = getUserRoleLabel(auth.user);
  const isAdmin = useMemo(() => (email ? isAdminEmail(email) : false), [email]);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'portal'>('email');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [notifyPortal, setNotifyPortal] = useState(true);
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const partner = state.status === 'ready' ? state.partner : sessionPartner;

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      if (!cancelled) setState({ status: 'ready', partner: loaded });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your account right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  useEffect(() => {
    const routeKey = partner?.primaryRoute || 'personal_restore';
    const intake = partner?.routes?.[routeKey];
    const personal = intake?.personal ?? {};
    setName((meta.name || getUserDisplayName(auth.user)).trim());
    setTitle((meta.title || '').trim());
    setBio((meta.bio || '').trim());
    setPhone((meta.phone || partner?.profile.phone || '').trim());
    setTimezone((meta.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || '').trim());
    setPreferredContact(meta.preferred_contact || 'email');
    setNotifyEmail(meta.notify_email !== false);
    setNotifySms(Boolean(meta.notify_sms));
    setNotifyPortal(meta.notify_portal !== false);
    setAddress1((meta.address1 || personal.address1 || '').trim());
    setAddress2((meta.address2 || personal.address2 || '').trim());
    setCity((meta.city || personal.city || '').trim());
    setStateCode((meta.state || personal.state || '').trim());
    setPostalCode((meta.postalCode || personal.postalCode || '').trim());
    setCompanyName((meta.company_name || '').trim());
    setWebsite((meta.website || '').trim());
    setLinkedin((meta.linkedin || '').trim());
    setAvatarPreview(meta.avatar_url || null);
    setAvatarDirty(false);
    setRemoveAvatar(false);
  }, [auth.user?.id, meta, partner?.id]);

  const prefs = useMemo(() => getNotificationPrefs({ partnerId: partner?.id, userId: auth.user?.id }), [auth.user?.id, partner?.id, notice]);

  const onPickAvatar = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      setAvatarPreview(await resizeImageToDataUrl(file));
      setAvatarDirty(true);
      setRemoveAvatar(false);
    } catch (e) {
      setError((e as Error)?.message || 'Could not process image.');
    }
  };

  const saveAll = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let avatar_url: string | null | undefined = undefined;
      if (removeAvatar) avatar_url = null;
      else if (avatarDirty && avatarPreview) avatar_url = avatarPreview;

      const res = await auth.updateUserProfile({
        name: name.trim(),
        title: title.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        timezone: timezone.trim(),
        preferred_contact: preferredContact,
        notify_email: notifyEmail,
        notify_sms: notifySms,
        notify_portal: notifyPortal,
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        state: stateCode.trim(),
        postalCode: postalCode.trim(),
        company_name: companyName.trim(),
        website: website.trim(),
        linkedin: linkedin.trim(),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
      });
      if (res.error) throw new Error(res.error);

      if (partner) {
        const routeKey = partner.primaryRoute || 'personal_restore';
        await upsertPartner({
          ...partner,
          profile: {
            ...partner.profile,
            fullName: name.trim() || partner.profile.fullName,
            phone: phone.trim() || undefined,
            email: partner.profile.email || email || undefined,
          },
          routes: {
            ...partner.routes,
            [routeKey]: {
              ...(partner.routes?.[routeKey] ?? {}),
              personal: {
                ...(partner.routes?.[routeKey]?.personal ?? {}),
                address1: address1.trim() || undefined,
                address2: address2.trim() || undefined,
                city: city.trim() || undefined,
                state: stateCode.trim() || undefined,
                postalCode: postalCode.trim() || undefined,
              },
            },
          },
          updatedAt: nowIso(),
        });
        refreshPartner();
        setState((cur) => (cur.status === 'ready' ? { ...cur, partner: getPartnerSync(partner.id)! } : cur));
      }

      setAvatarDirty(false);
      setRemoveAvatar(false);
      setNotice('Settings saved.');
    } catch (e) {
      setError((e as Error)?.message || 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setError(null);
    setNotice(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await auth.updatePassword(newPassword);
      if (res.error) throw new Error(res.error);
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Password updated.');
    } catch (e) {
      setError((e as Error)?.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    clearOnboardingProgress();
    auth.signOut().finally(() => markSignedOutAndGoHome(navigate));
  };

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const hasContact = Boolean(name && email);
  const mailingAddressOnFile = partner ? hasMailingAddress(partner) : Boolean(address1 && city && stateCode && postalCode);
  const consents = partner ? countConsents(partner) : { accepted: 2, total: 4, missing: [] as string[] };
  const activeChannels = [prefs.emailDigest, prefs.emailInstantMessages, prefs.emailLetterLifecycle, prefs.emailMeetingReminders, prefs.smsAlerts, prefs.pushEnabled].filter(Boolean).length;
  const isAgentProfile = meta.role === 'agent' || roleLabel === CS.singular;

  const metrics: ProductMetric[] = [
    { label: 'Identity', value: hasContact ? 'On file' : 'Incomplete', hint: hasContact ? `${name}` : 'Add name and email', accent: 'violet', icon: UserCircle2, onClick: () => setTool('profile') },
    { label: 'Mailing address', value: mailingAddressOnFile ? 'On file' : 'Missing', hint: mailingAddressOnFile ? 'Used for mailed letters' : 'Add for dispute mail', accent: 'sky', icon: MapPin, onClick: () => setTool('contact') },
    { label: 'Notifications', value: `${activeChannels}/6`, hint: `${activeChannels} channels active`, accent: 'emerald', icon: Bell, onClick: () => setTool('notifications') },
    { label: 'Consents', value: `${consents.accepted}/${consents.total}`, hint: consents.missing.length ? `Missing ${consents.missing[0]}` : 'Complete', accent: 'rose', icon: consents.missing.length ? ShieldCheck : FileCheck2, onClick: () => navigate(mapPortalHref('/portal/billing')) },
  ];

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: 'What do I still need to complete on my account?', contextLabel: navItem?.label ?? 'Account' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderCanvas = () => {
    if (tool === 'profile') {
      return (
        <div className={`${finelyOsCatalogCard('violet')} fc-wlp-compose-canvas p-6 lg:p-8 space-y-5`} data-fc-accent="violet">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Profile</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Your profile</h2>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Name, photo, and headline — what your team and specialists see.</p>
          </div>
          {auth.user ? (
            <div className="flex flex-wrap items-center gap-5">
              <UserAvatar user={auth.user} size="lg" avatarUrl={removeAvatar ? null : avatarPreview} />
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className={FINELY_OS_SECONDARY_BTN}>
                  <Camera size={14} /> Upload photo
                </button>
                {(avatarPreview || meta.avatar_url) && !removeAvatar ? (
                  <button type="button" onClick={() => { setAvatarPreview(null); setAvatarDirty(true); setRemoveAvatar(true); }} className={FINELY_OS_DANGER_BTN}>
                    <Trash2 size={14} /> Remove
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="md:col-span-2 block">
              <div className={FINELY_OS_ENTITY_LABEL}>Display name</div>
              <input value={name} onChange={(e) => setName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </label>
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Title / headline</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Partner" />
            </label>
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Role</div>
              <input value={roleLabel || 'Partner'} readOnly className={`${FINELY_OS_ENTITY_INPUT} opacity-60`} />
            </label>
            <label className="md:col-span-2 block">
              <div className={FINELY_OS_ENTITY_LABEL}>Bio</div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className={`${FINELY_OS_ENTITY_INPUT} resize-y min-h-[160px]`} />
            </label>
            {isAgentProfile ? (
              <>
                <label className="md:col-span-2 block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Company / brand name</div>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Website</div>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="https://…" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>LinkedIn</div>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Profile URL" />
                </label>
              </>
            ) : null}
          </div>
          {partner ? (
            <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-2`}>
              <p className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Funding goals & capital readiness</p>
              <p className={FINELY_OS_ENTITY_BODY}>These live on your partner profile — tied to ZIP, target banks, and dispute readiness.</p>
              <button type="button" onClick={() => navigate(mapPortalHref('/portal/dashboard#profile-goals-readiness'))} className={FINELY_OS_SECONDARY_BTN}>
                Open profile goals & readiness <ArrowRight size={14} />
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    if (tool === 'contact') {
      return (
        <div className={`${finelyOsCatalogCard('sky')} fc-wlp-compose-canvas p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Contact & address</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>How we reach you</h2>
          </div>
          <label className="block">
            <div className={FINELY_OS_ENTITY_LABEL}>Login email</div>
            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={email} readOnly className={`${FINELY_OS_ENTITY_INPUT} pl-10 opacity-70`} />
            </div>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Phone</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={FINELY_OS_ENTITY_INPUT} inputMode="tel" />
            </label>
            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Timezone</div>
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </label>
          </div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Mailing address</div>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Address line 1" className={`${FINELY_OS_ENTITY_INPUT} md:col-span-2`} />
            <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Apt / unit" className={`${FINELY_OS_ENTITY_INPUT} md:col-span-2`} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={FINELY_OS_ENTITY_INPUT} />
            <input value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" className={`${FINELY_OS_ENTITY_INPUT} font-mono`} />
            <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="ZIP" className={`${FINELY_OS_ENTITY_INPUT} font-mono md:col-span-2`} />
          </div>
          {partner ? <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Synced to your partner file for letters and disputes.</p> : null}
        </div>
      );
    }

    if (tool === 'notifications') {
      return (
        <div className={`${finelyOsCatalogCard('emerald')} fc-wlp-compose-canvas p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Notifications</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Alerts & delivery</h2>
          </div>
          <label className="block max-w-md">
            <div className={FINELY_OS_ENTITY_LABEL}>Preferred contact method</div>
            <select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as 'email' | 'phone' | 'portal')} className={FINELY_OS_ENTITY_INPUT}>
              <option value="email">Email</option>
              <option value="phone">Phone / SMS</option>
              <option value="portal">In-app messages</option>
            </select>
          </label>
          <div className="space-y-3">
            {[
              { key: 'email', label: 'Email notifications', checked: notifyEmail, set: setNotifyEmail },
              { key: 'sms', label: 'SMS notifications', checked: notifySms, set: setNotifySms },
              { key: 'portal', label: 'Portal alerts', checked: notifyPortal, set: setNotifyPortal },
            ].map((row, idx) => (
              <label key={row.key} className={`flex items-center gap-3 ${finelyOsCatalogCard((['emerald', 'violet', 'sky'] as const)[idx % 3])} p-4 cursor-pointer`} data-fc-accent={(['emerald', 'violet', 'sky'] as const)[idx % 3]}>
                <input type="checkbox" checked={row.checked} onChange={(e) => row.set(e.target.checked)} />
                <span className={`font-bold ${FINELY_OS_ENTITY_BODY}`}>{row.label}</span>
              </label>
            ))}
          </div>
          <div className="fc-wlp-notifications-prefs">
            {[
              { key: 'emailInstantMessages', label: 'Instant message emails', on: prefs.emailInstantMessages },
              { key: 'emailDigest', label: 'Daily digest', on: prefs.emailDigest },
              { key: 'smsAlerts', label: 'SMS alerts', on: prefs.smsAlerts },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="fc-wlp-notifications-pref-chip"
                data-muted={chip.on ? undefined : 'true'}
                onClick={() => {
                  upsertNotificationPrefs({ ...prefs, [chip.key]: !chip.on });
                  setNotice('Notification preference updated.');
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (tool === 'security') {
      return (
        <div className={`${finelyOsCatalogCard('rose')} fc-wlp-compose-canvas p-6 lg:p-8 space-y-6`} data-fc-accent="rose">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Security</p>
            <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Password & MFA</h2>
          </div>
          {auth.isDevAuthEnabled ? (
            <p className={FINELY_OS_ENTITY_BODY}>Password changes are available on the live site after sign-in.</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>New password</div>
                  <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={FINELY_OS_ENTITY_INPUT} autoComplete="new-password" />
                </label>
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Confirm password</div>
                  <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={FINELY_OS_ENTITY_INPUT} autoComplete="new-password" />
                </label>
              </div>
              <button type="button" disabled={busy || !newPassword} onClick={() => void savePassword()} className={FINELY_OS_SECONDARY_BTN}>
                Update password
              </button>
              <MfaEnrollmentPanel emphasizeSensitiveData={Boolean(partner)} />
            </>
          )}
        </div>
      );
    }

    return (
      <div className={`${finelyOsCatalogCard('sky')} fc-wlp-compose-canvas p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Quick links</p>
          <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Account shortcuts</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SECONDARY_BTN}>Dashboard</button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/dashboard'))} className={FINELY_OS_SECONDARY_BTN}>Partner portal</button>
          <button type="button" onClick={() => navigate(mapPortalHref('/portal/messages'))} className={FINELY_OS_SECONDARY_BTN}>Messages</button>
          {isAdmin ? <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_SUCCESS_BTN}>Admin</button> : null}
          {meta.role === 'agent' ? <button type="button" onClick={() => navigate(CS.hubPath)} className={FINELY_OS_SUCCESS_BTN}>{CS.hubName}</button> : null}
          {meta.role === 'affiliate' ? <button type="button" onClick={() => navigate(AF.hubPath)} className={FINELY_OS_SUCCESS_BTN}>{AF.hubName}</button> : null}
        </div>
        <div className={`${FINELY_OS_NOTICE_ERROR} space-y-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Sign out</div>
          <button type="button" onClick={logout} className={FINELY_OS_DANGER_BTN}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>
    );
  };

  const checklistDone = [
    hasContact,
    mailingAddressOnFile,
    activeChannels > 0,
    consents.missing.length === 0,
  ].filter(Boolean).length;

  const accountCommandBody = (
    <section className="fc-wlp-section space-y-6" data-surface-layout="compose-studio">
      {notice ? (
        <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-center gap-3`}>
          <Save size={18} className="shrink-0" />
          {notice}
        </div>
      ) : null}
      {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}

      {partner ? <CommsWorkspaceActions variant="inline" hubLabel="Open Hub" calendarLabel="Open calendar" /> : null}

      <div className="fc-wlp-account-command-deck">
        <header className={`fc-wlp-account-command-hero ${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex items-center gap-4">
            {auth.user ? <UserAvatar user={auth.user} size="lg" avatarUrl={removeAvatar ? null : avatarPreview} /> : null}
            <div className="min-w-0">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Your account</p>
              <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{name || 'Your name'}</h2>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{title || roleLabel || 'Partner'}</p>
            </div>
          </div>
          <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
            Profile, contact, alerts, and security — one place to keep your partner file accurate.
          </p>
          <div className="fc-wlp-account-command-hero-stats">
            <div className={`${finelyOsCatalogCard('emerald')} px-4 py-3 text-center`} data-fc-accent="emerald">
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{checklistDone}/4</div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Complete</div>
            </div>
            <div className={`${finelyOsCatalogCard('sky')} px-4 py-3 text-center`} data-fc-accent="sky">
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeChannels}</div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Alert channels</div>
            </div>
            <div className={`${finelyOsCatalogCard('rose')} px-4 py-3 text-center`} data-fc-accent="rose">
              <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{consents.missing.length}</div>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Consents left</div>
            </div>
          </div>
        </header>

        <div className="fc-wlp-account-command-pods" role="tablist" aria-label="Account sections">
          {STUDIO_TOOLS.map((t) => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className="fc-wlp-account-command-pod"
                data-fcm-accent="violet"
                data-active={active ? 'true' : undefined}
                onClick={() => setTool(t.id)}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon size={16} />
                  <strong>{t.label}</strong>
                </span>
                <em>
                  {t.id === 'profile' ? 'Photo & bio' : t.id === 'contact' ? 'Phone & mail' : t.id === 'notifications' ? 'Delivery' : t.id === 'security' ? 'Password & MFA' : 'Shortcuts'}
                </em>
              </button>
            );
          })}
        </div>

        <div className="fc-wlp-account-command-stage space-y-4">
          {renderCanvas()}
          {tool !== 'security' && tool !== 'account' ? (
            <button type="button" disabled={busy} onClick={() => void saveAll()} className={FINELY_OS_SUCCESS_BTN}>
              <Save size={14} /> {busy ? 'Saving…' : 'Save changes'}
            </button>
          ) : null}
        </div>

        <div className="fc-wlp-account-command-footer">
          <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
            <div className="fc-wlp-eyebrow">How you appear</div>
            <div className="flex items-center gap-4">
              {auth.user ? <UserAvatar user={auth.user} size="md" avatarUrl={removeAvatar ? null : avatarPreview} /> : null}
              <div>
                <div className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{name || 'Your name'}</div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{title || roleLabel || 'Partner'}</div>
              </div>
            </div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{bio || 'Add a short bio so your team recognizes you.'}</p>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-3`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Account checklist</div>
            {[
              { label: 'Name & email', done: hasContact },
              { label: 'Mailing address', done: mailingAddressOnFile },
              { label: 'Notifications', done: activeChannels > 0 },
              { label: 'Consents', done: consents.missing.length === 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className={`font-bold ${FINELY_OS_ENTITY_BODY}`}>{row.label}</span>
                <span className={`text-sm font-extrabold ${row.done ? 'text-emerald-600' : 'text-rose-600'}`}>{row.done ? 'Done' : 'Needed'}</span>
              </div>
            ))}
          </div>

          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
            <div className="fc-wlp-eyebrow">Next step</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Keep contact details current so letters, notices, and sessions stay on time.</p>
            {guideActions}
            <button type="button" onClick={() => navigate(livePath)} className={FINELY_OS_PRIMARY_BTN}>
              Open full settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow={demoSpec?.eyebrow ?? 'Account'}
        title={demoSpec?.title ?? 'Your profile, contact details, and consents in one place.'}
        description={demoSpec?.description ?? 'Identity hero, section pods, and a full-width editor for profile and contact.'}
        status={`${demoSpec?.status ?? 'Profile complete'} · demo data`}
        freshness="demo snapshot"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metricsVariant="jewel"
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Edit account'} onClick={() => navigate(livePath)} />}
        metrics={demoSpec?.metrics.map((metric) => ({ ...metric, onClick: () => navigate(livePath) }))}
        metricTitle={demoSpec?.metricTitle}
        metricDescription={demoSpec?.metricDescription}
      >
        {accountCommandBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') return <ProductDashboardSkeleton label="Loading your account" />;

  if (state.status === 'error') {
    return (
      <ProductHubScaffold
        role={role}
        eyebrow="Account"
        title="Your profile, contact details, and consents in one place."
        description="Identity hero, section pods, and a full-width editor for profile and contact."
        status="Could not load your account"
        freshness="just now"
        accent={accent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}
      >
        <ProductEmptyState
          title="We couldn't load your account"
          description={state.message}
          action={
            <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>
              Try again
            </button>
          }
        />
      </ProductHubScaffold>
    );
  }

  const statusHeadline = consents.missing.length
    ? `${consents.missing.length} consent${consents.missing.length === 1 ? '' : 's'} needed`
    : !mailingAddressOnFile
      ? 'Mailing address needed'
      : !hasContact
        ? 'Profile incomplete'
        : 'Account complete';

  return (
    <ProductHubScaffold
      role={role}
      eyebrow="Account"
      title="Your profile, contact details, and consents in one place."
      description="Your profile, contact, alerts, and security in one place."
      status={`${statusHeadline} · live data`}
      freshness={formatFreshness(partner?.updatedAt)}
      accent={accent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metricsVariant="jewel"
      primaryAction={<ProductPagePrimaryAction label="Open full settings" onClick={() => navigate(livePath)} />}
      metrics={metrics}
      metricTitle="Account status"
      metricDescription="Profile, address, notifications, and consents."
    >
      {accountCommandBody}
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
