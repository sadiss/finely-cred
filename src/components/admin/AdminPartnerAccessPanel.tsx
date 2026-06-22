import React, { useMemo, useState } from 'react';
import { KeyRound, Mail, Shield, UserCheck } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { useAuth } from '../../auth/AuthProvider';
import { sendPartnerWelcomeEmail } from '../../lib/partnerWelcomeEmail';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { landingPathForRole, signupSummaryForRole } from '../../lib/signupOpsGuide';
import { adminUpsertPartner } from '../../data/partnersRepo';
import { patchPartnerAccessFlags, readPartnerAccessFlagsStored } from '../../lib/partnerAccessControl';
import { ensurePartnerEntitlements, ENTITLEMENT_KEYS, type EntitlementKey } from '../../billing/entitlements';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partner: Partner;
  userRole?: string;
  onUpdated?: () => void;
};

export function AdminPartnerAccessPanel({ partner, userRole, onUpdated }: Props) {
  const auth = useAuth();
  const [busy, setBusy] = useState<'reset' | 'welcome' | 'access' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [accessFlags, setAccessFlags] = useState(() => readPartnerAccessFlagsStored(partner));

  React.useEffect(() => {
    setAccessFlags(readPartnerAccessFlagsStored(partner));
  }, [partner.id, partner.updatedAt, partner.journeySignals]);

  const email = (partner.profile.email || '').trim();
  const role = (userRole || partner.lane || 'client').toString();
  const guide = useMemo(() => signupSummaryForRole(role === 'au_tradelines' ? 'au_seller' : role), [role]);
  const landing = landingPathForRole(role === 'au_tradelines' ? 'au_seller' : role);
  const commsOn = isFeatureEnabled('commsDelivery');

  const saveAccess = async (patch: Partial<ReturnType<typeof readPartnerAccessFlagsStored>>) => {
    setErr(null);
    setNotice(null);
    setBusy('access');
    const optimistic = { ...accessFlags, ...patch };
    setAccessFlags(optimistic);
    try {
      let next = patchPartnerAccessFlags(partner, patch);
      await adminUpsertPartner(next);
      if (patch.paymentWaived) {
        ensurePartnerEntitlements({
          partnerId: partner.id,
          keys: Object.values(ENTITLEMENT_KEYS) as EntitlementKey[],
        });
      }
      setNotice('Access settings updated.');
      onUpdated?.();
    } catch (e: unknown) {
      setAccessFlags(readPartnerAccessFlagsStored(partner));
      setErr((e as Error)?.message || 'Failed to update access.');
    } finally {
      setBusy(null);
    }
  };

  const toggleFlag = (key: keyof ReturnType<typeof readPartnerAccessFlagsStored>, next: boolean) => {
    void saveAccess({ [key]: next });
  };

  const sendReset = async () => {
    if (!email) {
      setErr('Partner has no email on file.');
      return;
    }
    setBusy('reset');
    setErr(null);
    setNotice(null);
    try {
      const res = await auth.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` });
      if (res.error) throw new Error(res.error);
      setNotice(`Password reset email sent to ${email}. They will set a new password via the secure link (valid ~1 hour). Works for admin, partner, affiliate, and all portal roles.`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to send reset email.');
    } finally {
      setBusy(null);
    }
  };

  const resendWelcome = async () => {
    if (!email) {
      setErr('Partner has no email on file.');
      return;
    }
    if (!commsOn) {
      setErr('Comms delivery is OFF — enable in Admin → Settings → Feature flags.');
      return;
    }
    setBusy('welcome');
    setErr(null);
    setNotice(null);
    try {
      const res = await sendPartnerWelcomeEmail({
        user: auth.user ? { ...auth.user, email } as any : null,
        partner,
        force: true,
      });
      if (!res.sent) throw new Error(res.reason || 'Welcome email not sent.');
      setNotice(`Welcome email sent to ${email}.`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to send welcome email.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`}>
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-sky-300" />
        <div className={FINELY_OS_ENTITY_VALUE}>Access & auth</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Login email</div>
          <div className={`mt-1 font-mono ${FINELY_OS_ENTITY_VALUE}`}>{email || '—'}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Account claimed</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{partner.claimedUserId ? 'Yes — linked to auth user' : 'No — admin-created or pending claim'}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Post-login landing</div>
          <div className={`mt-1 font-mono ${FINELY_OS_ENTITY_VALUE}`}>{landing}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Welcome email (comms delivery)</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{commsOn ? 'Enabled — can send/resend' : 'Disabled in feature flags'}</div>
        </div>
      </div>

      {!partner.claimedUserId ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Unclaimed partner: user must sign up with the same email or use a claim invite from Partner Import / Partners list.
          Password is chosen by the user during signup — not generated by admin.
        </div>
      ) : (
        <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
          Password was set by the user at signup (Profile & account step). Admins cannot view passwords — only trigger a reset link.
        </div>
      )}

      {guide ? (
        <details className="text-xs">
          <summary className={`cursor-pointer ${FINELY_OS_ENTITY_VALUE}`}>Role signup reference ({guide.label})</summary>
          <ul className={`mt-2 space-y-1 list-disc pl-4 ${FINELY_OS_ENTITY_BODY}`}>
            <li>{guide.passwordSetup}</li>
            <li>{guide.welcomeEmail}</li>
          </ul>
        </details>
      ) : null}

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="text-rose-300 text-sm">{err}</div> : null}

      <div className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-3 border-t border-white/10 pt-4 relative z-10`}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Admin approval & unlock</div>
        {[
          {
            key: 'accessApproved' as const,
            label: 'Approve portal access',
            hint: 'Sets partner active when they were a lead',
          },
          {
            key: 'roleUnlocked' as const,
            label: 'Unlock role / lane features',
            hint: 'Allows portal modules for their lane',
          },
          {
            key: 'paymentWaived' as const,
            label: 'Waive payment — grant entitlements without checkout',
            hint: 'Grants full entitlements immediately',
          },
        ].map((row) => (
          <button
            key={row.key}
            type="button"
            disabled={busy === 'access'}
            onClick={() => toggleFlag(row.key, !accessFlags[row.key])}
            className={
              'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ' +
              (accessFlags[row.key]
                ? 'border-emerald-400/40 bg-emerald-500/15'
                : 'border-white/12 bg-black/25 hover:border-white/25 hover:bg-white/5')
            }
          >
            <span
              className={
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                (accessFlags[row.key] ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-white/30 bg-transparent text-transparent')
              }
              aria-hidden
            >
              ✓
            </span>
            <span className="min-w-0">
              <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{row.label}</span>
              <span className={`block text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{row.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void sendReset()} disabled={!email || busy !== null} className={FINELY_OS_PRIMARY_BTN}>
          <KeyRound size={14} /> {busy === 'reset' ? 'Sending…' : 'Send password reset email'}
        </button>
        <button type="button" onClick={() => void resendWelcome()} disabled={!email || !commsOn || busy !== null} className={FINELY_OS_SECONDARY_BTN}>
          <Mail size={14} /> {busy === 'welcome' ? 'Sending…' : 'Resend welcome email'}
        </button>
        <a href="/admin/signup-ops" className={FINELY_OS_SECONDARY_BTN}>
          <UserCheck size={14} /> Full signup ops guide
        </a>
      </div>
    </div>
  );
}

export function roleFromPartner(partner: Partner): string {
  const lane = (partner.lane || '').toLowerCase();
  if (lane === 'au_tradelines') return 'au_seller';
  if (lane === 'affiliate') return 'affiliate';
  if (lane === 'agent') return 'agent';
  return 'client';
}
