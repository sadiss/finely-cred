import React, { useMemo, useState } from 'react';
import { KeyRound, Mail, Shield, UserCheck } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { useAuth } from '../../auth/AuthProvider';
import { sendPartnerWelcomeEmail } from '../../lib/partnerWelcomeEmail';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { landingPathForRole, signupSummaryForRole } from '../../lib/signupOpsGuide';
import { adminUpsertPartner } from '../../data/partnersRepo';
import { patchPartnerAccessFlags, readPartnerAccessFlags } from '../../lib/partnerAccessControl';
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
};

export function AdminPartnerAccessPanel({ partner, userRole }: Props) {
  const auth = useAuth();
  const [busy, setBusy] = useState<'reset' | 'welcome' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const email = (partner.profile.email || '').trim();
  const role = (userRole || partner.lane || 'client').toString();
  const guide = useMemo(() => signupSummaryForRole(role === 'au_tradelines' ? 'au_seller' : role), [role]);
  const landing = landingPathForRole(role === 'au_tradelines' ? 'au_seller' : role);
  const commsOn = isFeatureEnabled('commsDelivery');
  const accessFlags = useMemo(() => readPartnerAccessFlags(partner), [partner]);

  const saveAccess = async (patch: Partial<ReturnType<typeof readPartnerAccessFlags>>) => {
    setErr(null);
    setNotice(null);
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
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to update access.');
    }
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

      <div className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2 border-t border-white/10 pt-3`}>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Admin approval & unlock</div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={accessFlags.accessApproved} onChange={(e) => void saveAccess({ accessApproved: e.target.checked })} />
          Approve portal access (sets active when was lead)
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={accessFlags.roleUnlocked} onChange={(e) => void saveAccess({ roleUnlocked: e.target.checked })} />
          Unlock role / lane features
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={accessFlags.paymentWaived} onChange={(e) => void saveAccess({ paymentWaived: e.target.checked })} />
          Waive payment — grant entitlements without checkout
        </label>
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
