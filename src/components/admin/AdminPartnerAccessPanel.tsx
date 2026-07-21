import React, { useMemo, useState } from 'react';
import { Copy, KeyRound, Link2, Mail, Shield, UserCheck, UserPlus } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import { useAuth } from '../../auth/AuthProvider';
import { sendPartnerWelcomeEmail } from '../../lib/partnerWelcomeEmail';
import { sendPartnerInviteEmail, signupInviteUrl } from '../../lib/partnerInviteEmail';
import { canSimulateInviteDeliveryLocally, formatLocalInviteNotice } from '../../lib/inviteLocalDev';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import { signupSummaryForRole } from '../../lib/signupOpsGuide';
import { landingPathForPartner, careerRoleForPartner, serviceLabelForPartner } from '../../lib/partnerInviteRouting';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getStaffCommsCapabilities } from '../../lib/staffCommsPermissions';
import { adminUpsertPartner } from '../../data/partnersRepo';
import { patchPartnerAccessFlags, readPartnerAccessFlagsStored } from '../../lib/partnerAccessControl';
import {
  adminDeliveryState,
  formatAdminDeliveryWhen,
  recordAdminDelivery,
} from '../../lib/adminDeliveryCooldown';
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
import { PartnerSignupActivityPanel } from './PartnerSignupActivityPanel';
import {
  trackPartnerInviteSent,
  trackPartnerPasswordResetSent,
  trackPartnerWelcomeSent,
} from '../../lib/partnerAuthActivity';

type Props = {
  partner: Partner;
  userRole?: string;
  onUpdated?: () => void;
};

function inviteFieldGuide(role: string, lane?: string): Array<{ label: string; detail: string }> {
  const r = role.trim().toLowerCase();
  const l = (lane || '').trim().toLowerCase();
  if (r === 'au_seller' || l.includes('seller')) {
    return [
      { label: 'Seller identity', detail: 'Name, email, phone, mailing address, and payment/tax readiness basics.' },
      { label: 'Tradeline inventory', detail: 'Issuer, age, limit, statement date, posting window, available AU slots, and rules.' },
      { label: 'Compliance acknowledgements', detail: 'No income guarantees, no score guarantees, and inventory accuracy confirmation.' },
      { label: 'Dashboard route', detail: 'After signup they land in the AU Seller hub.' },
    ];
  }
  if (r === 'agent' || l.includes('agent') || l.includes('specialist')) {
    return [
      { label: 'Specialist profile', detail: 'Name, email, phone, operating model, training phase, and core specialty.' },
      { label: 'Role setup', detail: 'Agent/specialist lane, lead handling preferences, and workflow ownership.' },
      { label: 'Compliance acknowledgements', detail: 'Educational positioning, no legal advice, no guaranteed outcomes.' },
      { label: 'Dashboard route', detail: 'After signup they land in the Agent hub.' },
    ];
  }
  if (r === 'affiliate' || l.includes('affiliate')) {
    return [
      { label: 'Affiliate profile', detail: 'Name, email, phone, promo channel, audience, and referral attribution.' },
      { label: 'Campaign context', detail: 'Links, QR flow, disclosures, and compliant promotional copy.' },
      { label: 'Compliance acknowledgements', detail: 'No income guarantees and required referral disclosures.' },
      { label: 'Dashboard route', detail: 'After signup they land in the Affiliate hub.' },
    ];
  }
  return [
    { label: 'Partner profile', detail: 'Name, email, password, phone, mailing address, and role/lane context.' },
    { label: 'Credit goal', detail: 'Personal credit, business credit, debt workflow, funding readiness, or other lane.' },
    { label: 'Legal acknowledgements', detail: 'Educational use, consent, privacy, no guarantees, and portal terms.' },
    { label: 'Dashboard route', detail: 'After signup they land in the Partner portal.' },
  ];
}

export function AdminPartnerAccessPanel({ partner, userRole, onUpdated }: Props) {
  const auth = useAuth();
  const [busy, setBusy] = useState<'reset' | 'welcome' | 'access' | 'invite' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [accessFlags, setAccessFlags] = useState(() => readPartnerAccessFlagsStored(partner));
  const [deliveryTick, setDeliveryTick] = useState(0);

  const inviteState = useMemo(
    () => adminDeliveryState(partner.id, 'invite', Date.now()),
    [partner.id, deliveryTick],
  );
  const inviteResendState = useMemo(
    () => adminDeliveryState(partner.id, 'invite_resend', Date.now()),
    [partner.id, deliveryTick],
  );
  const resetState = useMemo(
    () => adminDeliveryState(partner.id, 'password_reset', Date.now()),
    [partner.id, deliveryTick],
  );
  const welcomeState = useMemo(
    () => adminDeliveryState(partner.id, 'welcome', Date.now()),
    [partner.id, deliveryTick],
  );

  React.useEffect(() => {
    const needsTimer =
      (inviteState.isRepeat && !inviteState.canSend) ||
      (inviteResendState.isRepeat && !inviteResendState.canSend) ||
      (resetState.isRepeat && !resetState.canSend) ||
      (welcomeState.isRepeat && !welcomeState.canSend);
    if (!needsTimer) return;
    const id = window.setInterval(() => setDeliveryTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [inviteState, inviteResendState, resetState, welcomeState]);

  React.useEffect(() => {
    setAccessFlags(readPartnerAccessFlagsStored(partner));
  }, [partner.id, partner.updatedAt, partner.journeySignals]);

  const email = (partner.profile.email || '').trim();
  const careerRole = careerRoleForPartner(partner);
  const guide = useMemo(() => signupSummaryForRole(careerRole), [careerRole]);
  const landing = landingPathForPartner(partner);
  const serviceLabel = serviceLabelForPartner(partner);
  const roleFields = useMemo(() => inviteFieldGuide(careerRole, partner.lane), [careerRole, partner.lane]);
  const commsOn = isFeatureEnabled('commsDelivery');
  const inviteOn = isFeatureEnabled('inviteDelivery');
  const staffCaps = useMemo(
    () =>
      getStaffCommsCapabilities({
        userId: auth.user?.id,
        email: auth.user?.email,
        tenantId: getActiveTenantId(),
      }),
    [auth.user?.id, auth.user?.email],
  );
  const canSendComms = staffCaps.canSendPartnerComms(partner);
  const signupInviteLink = useMemo(() => (email ? signupInviteUrl(partner, email) : ''), [partner, email]);
  const claimed = Boolean(partner.claimedUserId);
  const canSendInviteEmail = inviteOn && Boolean(email) && canSendComms;
  const canResendWelcome = commsOn && Boolean(email) && canSendComms;
  const canSendAccountSetup = !claimed && inviteOn && Boolean(email) && canSendComms;

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

  const confirmResend = (label: string, state: ReturnType<typeof adminDeliveryState>) => {
    if (!state.isRepeat) return true;
    if (!state.canSend) {
      setErr(`Please wait ${state.waitSeconds}s before sending ${label} again.`);
      return false;
    }
    return window.confirm(
      `${label} was already sent ${formatAdminDeliveryWhen(state.sentAt)}. Send again now? The recipient may receive a duplicate.`,
    );
  };

  const sendInvite = async (forceResend = false) => {
    if (!email) {
      setErr('Partner has no email on file.');
      return;
    }
    if (!inviteOn) {
      setErr('Invite delivery is OFF — enable in Admin → Settings → Feature flags.');
      return;
    }
    const state = forceResend ? inviteResendState : inviteState;
    if (!confirmResend(forceResend ? 'Invite email' : 'Invite email', state)) return;

    setBusy('invite');
    setErr(null);
    setNotice(null);
    try {
      const res = await sendPartnerInviteEmail({ partner, email, forceResend: forceResend || state.isRepeat });
      if (res.deduped) {
        setNotice(`Invite was already sent recently. Copy the signup link below and share it directly, or wait and use Resend invite.`);
        return;
      }
      if (!res.ok) throw new Error(res.error || 'Invite email not sent.');
      recordAdminDelivery(partner.id, forceResend ? 'invite_resend' : 'invite');
      setDeliveryTick((t) => t + 1);
      await trackPartnerInviteSent({
        partner,
        sentByEmail: auth.user?.email ?? undefined,
        resent: forceResend || state.isRepeat,
      }).catch(() => null);
      onUpdated?.();
      if (res.simulated) {
        setNotice(formatLocalInviteNotice({ ok: true, simulated: true, inviteUrl: res.inviteUrl, previewOpened: Boolean(res.previewOpened) }, email));
      } else {
        setNotice(
          forceResend
            ? `Invite email resent to ${email} at ${formatAdminDeliveryWhen(new Date().toISOString())}. They will finish setup as ${serviceLabel} and land on ${landing}.`
            : `Invite email sent to ${email} at ${formatAdminDeliveryWhen(new Date().toISOString())}. They will finish setup as ${serviceLabel} and land on ${landing}.`,
        );
      }
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to send invite email.');
    } finally {
      setBusy(null);
    }
  };

  const copyInviteLink = async () => {
    if (!signupInviteLink) return;
    try {
      await navigator.clipboard.writeText(signupInviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      window.prompt('Copy signup invite link:', signupInviteLink);
    }
  };

  const sendReset = async () => {
    if (!email) {
      setErr('Partner has no email on file.');
      return;
    }
    if (!confirmResend('Password reset email', resetState)) return;
    setBusy('reset');
    setErr(null);
    setNotice(null);
    try {
      const res = await auth.requestPasswordReset({
        email,
        userId: partner.claimedUserId,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (res.error) throw new Error(res.error);
      recordAdminDelivery(partner.id, 'password_reset');
      setDeliveryTick((t) => t + 1);
      await trackPartnerPasswordResetSent({
        partner,
        sentByEmail: auth.user?.email ?? undefined,
      }).catch(() => null);
      onUpdated?.();
      setNotice(
        `Password reset email sent to ${email} at ${formatAdminDeliveryWhen(new Date().toISOString())}. They will set a new password via the secure link (valid ~1 hour).`,
      );
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
    const state = !partner.claimedUserId ? inviteResendState : welcomeState;
    const label = !partner.claimedUserId ? 'Account setup email' : 'Welcome email';
    if (!confirmResend(label, state)) return;

    setBusy('welcome');
    setErr(null);
    setNotice(null);
    try {
      if (!partner.claimedUserId) {
        if (!inviteOn) {
          setErr('Invite delivery is OFF — enable in Admin → Settings → Feature flags.');
          return;
        }
        const res = await sendPartnerInviteEmail({ partner, email, forceResend: true });
        if (res.deduped) {
          setNotice('Account-setup invite was already sent recently. Copy the signup link below or use Resend invite.');
          return;
        }
        if (!res.ok) throw new Error(res.error || 'Invite email not sent.');
        recordAdminDelivery(partner.id, 'invite_resend');
        setDeliveryTick((t) => t + 1);
        await trackPartnerInviteSent({
          partner,
          sentByEmail: auth.user?.email ?? undefined,
          resent: true,
        }).catch(() => null);
        onUpdated?.();
        setNotice(
          `Account-setup invite sent to ${email} at ${formatAdminDeliveryWhen(new Date().toISOString())} (partner has no login yet).`,
        );
        return;
      }
      if (!commsOn) {
        setErr('Comms delivery is OFF — enable in Admin → Settings → Feature flags.');
        return;
      }
      const res = await sendPartnerWelcomeEmail({
        user: auth.user ? { ...auth.user, email } as any : null,
        partner,
        force: true,
      });
      if (!res.sent) throw new Error(res.reason || 'Welcome email not sent.');
      recordAdminDelivery(partner.id, 'welcome');
      setDeliveryTick((t) => t + 1);
      await trackPartnerWelcomeSent({
        partner,
        sentByEmail: auth.user?.email ?? undefined,
      }).catch(() => null);
      onUpdated?.();
      setNotice(`Welcome email sent to ${email} at ${formatAdminDeliveryWhen(new Date().toISOString())}.`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to send welcome email.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <PartnerSignupActivityPanel partner={partner} />

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
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Service lane</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{serviceLabel}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Post-login landing</div>
          <div className={`mt-1 font-mono ${FINELY_OS_ENTITY_VALUE}`}>{landing}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Welcome email (comms delivery)</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{commsOn ? 'Enabled — can send/resend' : 'Disabled in feature flags'}</div>
        </div>
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Invite delivery</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{inviteOn ? 'Enabled — can send/resend signup invites' : 'Disabled in feature flags'}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 p-4 text-sm space-y-2">
        <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Stuck signup? Use this playbook</div>
        <ul className={`list-disc pl-4 space-y-1 ${FINELY_OS_ENTITY_BODY}`}>
          {!claimed ? (
            <>
              <li>
                <strong className="text-white/90">No account yet</strong> — Resend invite or copy the signup link below. They create their own password during signup.
              </li>
              <li>
                <strong className="text-white/90">Invite glitch / email never arrived</strong> — Copy link and text it to them, or click Resend invite (bypasses duplicate-send guard).
              </li>
            </>
          ) : (
            <>
              <li>
                <strong className="text-white/90">Account linked but can&apos;t log in</strong> — Send password reset email. They set a new password via the secure link (~1 hour).
              </li>
              <li>
                <strong className="text-white/90">Finished signup, needs portal intro</strong> — Resend welcome email (requires comms delivery ON).
              </li>
            </>
          )}
        </ul>
      </div>

      {!partner.claimedUserId ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          <div>Unclaimed partner: send an invite link so they can create their account with this email and role context pre-filled.</div>
          {!isSupabaseConfigured && canSimulateInviteDeliveryLocally() ? (
            <div className="mt-2 text-xs text-amber-200/90">
              Local dev: Supabase is not configured — Send invite will open a branded email preview instead of sending real mail.
            </div>
          ) : null}
          <div className="mt-2 text-xs text-white/60">Password is chosen by the user during signup — not generated by admin.</div>
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

      <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Invite setup fields for this role/lane</div>
        <div className="grid md:grid-cols-2 gap-3">
          {roleFields.map((field) => (
            <div key={field.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{field.label}</div>
              <div className={`mt-1 text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{field.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {!partner.claimedUserId && signupInviteLink ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Signup invite link (share anytime)</div>
          <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Pre-fills their email and role. Works even if email delivery failed — copy and send via text or any channel.
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              readOnly
              value={signupInviteLink}
              className={`flex-1 min-w-[200px] font-mono text-xs ${FINELY_OS_ENTITY_BODY} bg-black/40 border border-white/10 rounded-lg px-3 py-2`}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" onClick={() => void copyInviteLink()} className={FINELY_OS_SECONDARY_BTN}>
              <Copy size={14} /> {inviteCopied ? 'Copied!' : 'Copy link'}
            </button>
            <a href={signupInviteLink} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
              <Link2 size={14} /> Open link
            </a>
          </div>
        </div>
      ) : null}

      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className="text-rose-300 text-sm">{err}</div> : null}

      {(inviteState.sentAt || resetState.sentAt || welcomeState.sentAt) ? (
        <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs space-y-1">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent outbound notifications</div>
          {inviteState.sentAt ? (
            <div className={FINELY_OS_ENTITY_BODY}>Invite email — {formatAdminDeliveryWhen(inviteState.sentAt)}</div>
          ) : null}
          {resetState.sentAt ? (
            <div className={FINELY_OS_ENTITY_BODY}>Password reset — {formatAdminDeliveryWhen(resetState.sentAt)}</div>
          ) : null}
          {welcomeState.sentAt ? (
            <div className={FINELY_OS_ENTITY_BODY}>Welcome email — {formatAdminDeliveryWhen(welcomeState.sentAt)}</div>
          ) : null}
        </div>
      ) : null}

      <div className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-3 border-t border-white/10 pt-4 relative z-10`}>
        {staffCaps.canManagePartnerAccess ? (
          <>
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
            <button
              type="button"
              disabled={busy === 'access'}
              onClick={() => {
                const next = !(partner.journeySignals as Record<string, unknown> | undefined)?.canCoach;
                void (async () => {
                  setBusy('access');
                  setErr(null);
                  setNotice(null);
                  try {
                    await adminUpsertPartner({
                      ...partner,
                      journeySignals: {
                        ...(partner.journeySignals ?? {}),
                        canCoach: next,
                      },
                    });
                    setNotice(next ? 'Coach capability granted — they can be assigned as Coach on customer files.' : 'Coach capability removed.');
                    onUpdated?.();
                  } catch (e: unknown) {
                    setErr((e as Error)?.message || 'Failed to update coach access.');
                  } finally {
                    setBusy(null);
                  }
                })();
              }}
              className={
                'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ' +
                ((partner.journeySignals as Record<string, unknown> | undefined)?.canCoach
                  ? 'border-sky-400/40 bg-sky-500/15'
                  : 'border-white/12 bg-black/25 hover:border-white/25 hover:bg-white/5')
              }
            >
              <span
                className={
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                  ((partner.journeySignals as Record<string, unknown> | undefined)?.canCoach
                    ? 'border-sky-300 bg-sky-400 text-black'
                    : 'border-white/30 bg-transparent text-transparent')
                }
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Can coach (care team)</span>
                <span className={`block text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                  Appear in the Coach assign picker for customer files (Credit Specialists already qualify)
                </span>
              </span>
            </button>
          </>
        ) : (
          <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Payment waivers and portal unlock toggles are limited to full admins. You can still send invite, reset, and welcome emails for this partner.
          </div>
        )}
      </div>

      {!canSendComms ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Your staff role does not include outbound email for this partner file. Ask a full admin to grant access or add you to their assigned client list.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!claimed && email ? (
          <>
            <button type="button" onClick={() => void sendInvite(false)} disabled={!canSendInviteEmail || busy !== null} className={FINELY_OS_PRIMARY_BTN}>
              <UserPlus size={14} />{' '}
              {busy === 'invite'
                ? 'Sending…'
                : inviteState.sentAt
                  ? 'Send invite again'
                  : 'Send invite link to create account'}
            </button>
            <button
              type="button"
              onClick={() => void sendInvite(true)}
              disabled={!canSendInviteEmail || busy !== null || (inviteResendState.isRepeat && !inviteResendState.canSend)}
              className={FINELY_OS_SECONDARY_BTN}
              title={
                inviteResendState.isRepeat && !inviteResendState.canSend
                  ? `Wait ${inviteResendState.waitSeconds}s before resending`
                  : 'Resend signup invite email'
              }
            >
              <Mail size={14} />{' '}
              {busy === 'invite'
                ? 'Sending…'
                : inviteResendState.isRepeat && !inviteResendState.canSend
                  ? `Resend in ${inviteResendState.waitSeconds}s`
                  : 'Resend invite email'}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => void sendReset()}
          disabled={!email || busy !== null || (resetState.isRepeat && !resetState.canSend)}
          className={FINELY_OS_PRIMARY_BTN}
          title={resetState.isRepeat && !resetState.canSend ? `Wait ${resetState.waitSeconds}s` : undefined}
        >
          <KeyRound size={14} />{' '}
          {busy === 'reset'
            ? 'Sending…'
            : resetState.isRepeat && !resetState.canSend
              ? `Reset in ${resetState.waitSeconds}s`
              : resetState.sentAt
                ? 'Resend password reset'
                : 'Send password reset email'}
        </button>
        <button
          type="button"
          onClick={() => void resendWelcome()}
          disabled={!email || busy !== null || (claimed ? !canResendWelcome : !canSendAccountSetup)}
          className={FINELY_OS_SECONDARY_BTN}
        >
          <Mail size={14} />{' '}
          {busy === 'welcome'
            ? 'Sending…'
            : partner.claimedUserId
              ? 'Resend welcome email'
              : 'Send account setup email'}
        </button>
        <a href="/admin/signup-ops" className={FINELY_OS_SECONDARY_BTN}>
          <UserCheck size={14} /> Full signup ops guide
        </a>
      </div>
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
