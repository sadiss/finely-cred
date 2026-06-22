import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Save,
  Shield,
  Trash2,
  User,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { UserAvatar } from '../../components/account/UserAvatar';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getUserDisplayName, getUserEmail, getUserProfileMeta, getUserRoleLabel } from '../../auth/userProfile';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { upsertPartner } from '../../data/partnersRepo';
import { nowIso } from '../../domain/partners';
import { resizeImageToDataUrl } from '../../utils/resizeImage';
import { CS } from '../../config/creditSpecialistProgram';
import { AF } from '../../config/affiliateProgram';
import { markSignedOutAndGoHome } from '../../components/navigation/BackToSiteButton';
import { CommsWorkspaceActions } from '../../components/comms/CommsWorkspaceActions';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');
const formSelect = FINELY_OS_ENTITY_SELECT;

type TabKey = 'profile' | 'contact' | 'notifications' | 'security' | 'account';

const TABS: { id: TabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'contact', label: 'Contact & address', icon: MapPin },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'account', label: 'Account', icon: Shield },
];

export default function AccountSettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner, refresh: refreshPartner } = usePartnerSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const email = getUserEmail(auth.user);
  const meta = getUserProfileMeta(auth.user);
  const roleLabel = getUserRoleLabel(auth.user);
  const isAdmin = useMemo(() => (email ? isAdminEmail(email) : false), [email]);

  const [tab, setTab] = useState<TabKey>('profile');
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
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setState((meta.state || personal.state || '').trim());
    setPostalCode((meta.postalCode || personal.postalCode || '').trim());
    setCompanyName((meta.company_name || '').trim());
    setWebsite((meta.website || '').trim());
    setLinkedin((meta.linkedin || '').trim());
    setAvatarPreview(meta.avatar_url || null);
    setAvatarDirty(false);
    setRemoveAvatar(false);
  }, [auth.user?.id, meta, partner?.id]);

  useEffect(() => {
    const t = (searchParams.get('tab') || '').toLowerCase();
    if (TABS.some((x) => x.id === t)) setTab(t as TabKey);
  }, [searchParams]);

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
        state: state.trim(),
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
                state: state.trim() || undefined,
                postalCode: postalCode.trim() || undefined,
              },
            },
          },
          updatedAt: nowIso(),
        });
        refreshPartner();
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
      setTab('security');
    } catch (e) {
      setError((e as Error)?.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  const logout = () => auth.signOut().finally(() => markSignedOutAndGoHome(navigate));

  if (!auth.user) {
    return (
      <PageShell badge="Account" title="Sign in required" subtitle="Please sign in to manage your account settings.">
        <button type="button" onClick={() => navigate('/onboarding')} className={FINELY_OS_SUCCESS_BTN}>
          Sign in
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Account"
      title="Account settings"
      subtitle="Profile, contact, notifications, password, and sign-out — synced with your partner file when linked."
      back={{ to: '/dashboard', label: 'Back to dashboard' }}
    >
      <div className={`${FINELY_OS_PAGE} max-w-4xl`}>
        {notice ? (
          <div className={`${FINELY_OS_NOTICE_SUCCESS} flex items-center gap-3`}>
            <CheckCircle2 size={18} className="shrink-0" />
            {notice}
          </div>
        ) : null}
        {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}

        {partner ? <CommsWorkspaceActions variant="inline" hubLabel="Open Hub" calendarLabel="Open calendar" /> : null}

        <div className="fc-sticky-tabs">
          <div className={FINELY_OS_VIEW_TABS}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                navigate(`/account/settings?tab=${id}`, { replace: true });
              }}
              className={finelyOsViewTab(tab === id, 'emerald')}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          </div>
        </div>

        {tab === 'profile' && (
          <section className={`scroll-mt-32 ${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
            <div className="flex flex-wrap items-center gap-5">
              <UserAvatar user={auth.user} size="lg" avatarUrl={removeAvatar ? null : avatarPreview} />
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className={FINELY_OS_SECONDARY_BTN}>
                  <Camera size={14} /> Upload photo
                </button>
                {(avatarPreview || meta.avatar_url) && !removeAvatar ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarDirty(true);
                      setRemoveAvatar(true);
                    }}
                    className={FINELY_OS_DANGER_BTN}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                ) : null}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className={formLabel}>Display name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={formInput} />
              </label>
              <label>
                <span className={formLabel}>Title / headline</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={formInput} placeholder="Customer, Credit Specialist, AU Seller…" />
              </label>
              <label>
                <span className={formLabel}>Role</span>
                <input value={roleLabel || '—'} readOnly className={`${formInput} opacity-60 cursor-not-allowed`} />
              </label>
              <label className="md:col-span-2">
                <span className={formLabel}>Bio</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${formInput} resize-y`} placeholder="Short intro shown on your profile…" />
              </label>
              {(meta.role === 'agent' || roleLabel === CS.singular) && (
                <>
                  <label className="md:col-span-2">
                    <span className={formLabel}>Company / brand name</span>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={formInput} placeholder="Your agency or brand" />
                  </label>
                  <label>
                    <span className={formLabel}>Website</span>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} className={formInput} placeholder="https://…" />
                  </label>
                  <label>
                    <span className={formLabel}>LinkedIn</span>
                    <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} className={formInput} placeholder="Profile URL" />
                  </label>
                </>
              )}
            </div>
            {partner ? (
              <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-2`}>
                <p className="font-semibold text-emerald-200">Funding goals & capital readiness</p>
                <p className={FINELY_OS_ENTITY_BODY}>These live on your partner profile — tied to your ZIP, target banks, and dispute readiness — not in account settings.</p>
                <button type="button" onClick={() => navigate('/portal/dashboard#profile-goals-readiness')} className={FINELY_OS_SECONDARY_BTN}>
                  Open profile goals & readiness →
                </button>
              </div>
            ) : null}
          </section>
        )}

        {tab === 'contact' && (
          <section className={`scroll-mt-32 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className={formLabel}>Login email</span>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={email} readOnly className={`${formInput} pl-10 opacity-70 cursor-not-allowed`} />
                </div>
                <div className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Email changes require admin support or a new account. Password can be reset under Security.</div>
              </label>
              <label>
                <span className={formLabel}>Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} inputMode="tel" />
              </label>
              <label>
                <span className={formLabel}>Timezone</span>
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={formInput} />
              </label>
            </div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Mailing address</div>
            <div className="grid md:grid-cols-2 gap-4">
              <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="Address line 1" className={`${formInput} md:col-span-2`} />
              <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Apt / unit" className={`${formInput} md:col-span-2`} />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className={formInput} />
              <input value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="State" className={`${formInput} font-mono`} />
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="ZIP" className={`${formInput} font-mono`} />
            </div>
            {partner ? (
              <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Synced to partner file for letters and dispute workflows.</div>
            ) : null}
          </section>
        )}

        {tab === 'notifications' && (
          <section className={`scroll-mt-32 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <label className="block max-w-md">
              <span className={formLabel}>Preferred contact method</span>
              <select value={preferredContact} onChange={(e) => setPreferredContact(e.target.value as any)} className={formSelect}>
                <option value="email">Email</option>
                <option value="phone">Phone / SMS</option>
                <option value="portal">In-app messages</option>
              </select>
            </label>
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email notifications', checked: notifyEmail, set: setNotifyEmail },
                { key: 'sms', label: 'SMS notifications', checked: notifySms, set: setNotifySms },
                { key: 'portal', label: 'Portal / in-app alerts', checked: notifyPortal, set: setNotifyPortal },
              ].map((row) => (
                <label key={row.key} className={`flex items-center gap-3 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony px-4 py-3 ${FINELY_OS_ENTITY_BODY} cursor-pointer`}>
                  <input type="checkbox" checked={row.checked} onChange={(e) => row.set(e.target.checked)} />
                  {row.label}
                </label>
              ))}
            </div>
          </section>
        )}

        {tab === 'security' && (
          <section className={`scroll-mt-32 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            {auth.isDevAuthEnabled ? (
              <div className={FINELY_OS_ENTITY_BODY}>Password changes are available on the live site after Supabase sign-in.</div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <label>
                    <span className={formLabel}>New password</span>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={formInput} autoComplete="new-password" />
                  </label>
                  <label>
                    <span className={formLabel}>Confirm password</span>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={formInput} autoComplete="new-password" />
                  </label>
                </div>
                <button type="button" disabled={busy || !newPassword} onClick={() => void savePassword()} className={FINELY_OS_SECONDARY_BTN}>
                  Update password
                </button>
              </>
            )}
          </section>
        )}

        {tab === 'account' && (
          <section className="scroll-mt-32 space-y-4">
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick links</div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_SECONDARY_BTN}>Dashboard</button>
                <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_SECONDARY_BTN}>Partner portal</button>
                <button type="button" onClick={() => navigate('/portal/messages')} className={FINELY_OS_SECONDARY_BTN}>Messages</button>
                {isAdmin ? (
                  <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_SUCCESS_BTN}>Admin</button>
                ) : null}
                {meta.role === 'agent' ? (
                  <button type="button" onClick={() => navigate(CS.hubPath)} className={FINELY_OS_SUCCESS_BTN}>{CS.hubName}</button>
                ) : meta.role === 'affiliate' ? (
                  <button type="button" onClick={() => navigate(AF.hubPath)} className={FINELY_OS_SUCCESS_BTN}>{AF.hubName}</button>
                ) : null}
              </div>
            </div>
            <div className={`${FINELY_OS_NOTICE_ERROR} space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Sign out</div>
              <button type="button" onClick={logout} className={FINELY_OS_DANGER_BTN}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          </section>
        )}

        {tab !== 'security' && tab !== 'account' ? (
          <button type="button" disabled={busy} onClick={() => void saveAll()} className={FINELY_OS_SUCCESS_BTN}>
            <Save size={14} /> Save changes
          </button>
        ) : null}

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
