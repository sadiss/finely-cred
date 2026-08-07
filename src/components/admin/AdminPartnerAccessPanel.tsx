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
import { ensurePartnerEntitlementsAsync, SERVICE_ACCESS_BUNDLES, type EntitlementKey } from '../../billing/entitlements';
import { PartnerServicesAccessCard } from './PartnerServicesAccessCard';
import { SensitiveActionCodeGate } from './SensitiveActionCodeGate';
import { LetterStreamStatusCard } from '../letters/LetterStreamStatusCard';
import {
  FC_ADMIN_GOLD_BTN,
  FC_ADMIN_PRIMARY_BTN,
  fcAdminCard,
  fcAdminOnSolidBody,
  fcAdminOnSolidInnerTile,
  fcAdminOnSolidSecondaryBtn,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidValue,
} from '../../features/os/finelyOsAdminSurface';
import { PartnerSignupActivityPanel } from './PartnerSignupActivityPanel';
import {
  trackPartnerInviteSent,
  trackPartnerPasswordResetSent,
  trackPartnerWelcomeSent,
} from '../../lib/partnerAuthActivity';

/** Access & authority (navy) — login/claim/service identity, grant panel, admin approval toggles. */
const NAVY_SUBLABEL = fcAdminOnSolidSublabel('navy');
const NAVY_BODY = fcAdminOnSolidBody('navy');
const NAVY_VALUE = fcAdminOnSolidValue('navy');
const NAVY_SECONDARY_BTN = fcAdminOnSolidSecondaryBtn('navy');
const NAVY_INNER = fcAdminOnSolidInnerTile('p-4', 'navy');

/** Invite & signup outreach (gold) — distinctive, findable, separate from authority. */
const GOLD_SUBLABEL = fcAdminOnSolidSublabel('gold');
const GOLD_BODY = fcAdminOnSolidBody('gold');
const GOLD_VALUE = fcAdminOnSolidValue('gold');
const GOLD_SECONDARY_BTN = fcAdminOnSolidSecondaryBtn('gold');
const GOLD_INNER = fcAdminOnSolidInnerTile('p-4', 'gold');
const NOTICE_SUCCESS_ON_GOLD =
  'rounded-xl border border-black/20 bg-black/10 p-4 text-sm flex items-start gap-3 text-[var(--fc-ink-on-gold)]';
const NOTICE_WARN_ON_GOLD =
  'rounded-xl border border-black/25 bg-black/15 p-4 text-sm text-[var(--fc-ink-on-gold)]';

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
  const [approveAccessGateOpen, setApproveAccessGateOpen] = useState(false);

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
        // Least privilege: waive payment for credit restore by default — not every product.
        const grant = await ensurePartnerEntitlementsAsync({
          partnerId: partner.id,
          keys: [...SERVICE_ACCESS_BUNDLES.credit_restore] as EntitlementKey[],
          sourceAgreementId: 'admin_payment_waived',
        });
        if (!grant.ok) {
          setNotice('Payment waived. Credit Letters grant needs a retry (sync or keys).');
          if (grant.pushError) setErr(grant.pushError);
        } else {
          setNotice('Access updated — Credit Letters / Bureaus entitlements granted (green in Services access).');
        }
      } else {
        setNotice('Access settings updated.');
      }
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

      {/* Access & authority — deep navy solid panel. This is the weighty "who can get in" box. */}
      <div className={`${fcAdminCard('p-5', 'navy', 'solid')} space-y-4`}>
        <div className="flex items-center gap-2">
          <Shield size={16} />
          <div className={NAVY_VALUE}>Access & authority</div>
        </div>
        <p className={`${NAVY_BODY} text-xs`}>
          Grant modules first (below). Invite emails and outreach live in the gold panel; approval toggles are secondary.
        </p>

        {staffCaps.canManagePartnerAccess ? (
          <div className={NAVY_INNER}>
            <PartnerServicesAccessCard
              partner={partner}
              canManage={staffCaps.canManagePartnerAccess}
              onUpdated={onUpdated}
            />
          </div>
        ) : (
          <div className={`text-xs ${NAVY_BODY}`}>
            Payment waivers and portal unlock toggles are limited to full admins. You can still send invite, reset, and welcome
            emails for this partner.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className={NAVY_SUBLABEL}>Login email</div>
            <div className={`mt-1 font-mono ${NAVY_VALUE}`}>{email || '—'}</div>
          </div>
          <div>
            <div className={NAVY_SUBLABEL}>Account claimed</div>
            <div className={`mt-1 ${NAVY_VALUE}`}>{partner.claimedUserId ? 'Yes — linked to auth user' : 'No — admin-created or pending claim'}</div>
          </div>
          <div>
            <div className={NAVY_SUBLABEL}>Service lane</div>
            <div className={`mt-1 ${NAVY_VALUE}`}>{serviceLabel}</div>
          </div>
          <div>
            <div className={NAVY_SUBLABEL}>Post-login landing</div>
            <div className={`mt-1 font-mono ${NAVY_VALUE}`}>{landing}</div>
          </div>
          <div>
            <div className={NAVY_SUBLABEL}>Welcome email (comms delivery)</div>
            <div className={`mt-1 ${NAVY_VALUE}`}>{commsOn ? 'Enabled — can send/resend' : 'Disabled in feature flags'}</div>
          </div>
          <div>
            <div className={NAVY_SUBLABEL}>Invite delivery</div>
            <div className={`mt-1 ${NAVY_VALUE}`}>{inviteOn ? 'Enabled — can send/resend signup invites' : 'Disabled in feature flags'}</div>
          </div>
        </div>

        {!partner.claimedUserId ? null : (
          <div className={`${NAVY_BODY} text-xs`}>
            Password was set by the user at signup (Profile & account step). Admins cannot view passwords — only trigger a reset link.
          </div>
        )}

        <div className={`${NAVY_BODY} text-sm space-y-3 border-t border-white/15 pt-4 relative z-10`}>
          {staffCaps.canManagePartnerAccess ? (
            <>
              <details className={NAVY_INNER}>
                <summary className={`cursor-pointer select-none text-xs font-semibold ${NAVY_VALUE}`}>
                  Admin approval & unlock (secondary)
                </summary>
                <div className="mt-2 space-y-2">
                  <p className={`text-[11px] ${NAVY_BODY}`}>
                    These flags control portal approval — they do not replace the green Grant buttons above for Credit /
                    Debt Letters.
                  </p>
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
                      hint: 'Skips checkout and grants Credit Letters access (add Debt/Business/AUs above)',
                    },
                  ].map((row) => (
                    <button
                      key={row.key}
                      type="button"
                      disabled={busy === 'access'}
                      onClick={() => {
                        const next = !accessFlags[row.key];
                        if (row.key === 'accessApproved' && next) {
                          setApproveAccessGateOpen(true);
                          return;
                        }
                        toggleFlag(row.key, next);
                      }}
                      className={
                        'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ' +
                        (accessFlags[row.key]
                          ? 'border-emerald-300/60 bg-emerald-500/25'
                          : 'border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/10')
                      }
                    >
                      <span
                        className={
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                          (accessFlags[row.key]
                            ? 'border-emerald-300 bg-emerald-400 text-black'
                            : 'border-white/30 bg-transparent text-transparent')
                        }
                        aria-hidden
                      >
                        ✓
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-sm font-semibold ${NAVY_VALUE}`}>{row.label}</span>
                        <span className={`block text-xs mt-0.5 ${NAVY_BODY}`}>{row.hint}</span>
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
                          setNotice(
                            next
                              ? 'Coach capability granted — they can be assigned as Coach on partner files.'
                              : 'Coach capability removed.',
                          );
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
                        ? 'border-sky-300/60 bg-sky-500/25'
                        : 'border-white/15 bg-black/20 hover:border-white/30 hover:bg-white/10')
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
                      <span className={`block text-sm font-semibold ${NAVY_VALUE}`}>Can coach (care team)</span>
                      <span className={`block text-xs mt-0.5 ${NAVY_BODY}`}>
                        Appear in the Coach assign picker for partner files (Credit Specialists already qualify)
                      </span>
                    </span>
                  </button>
                </div>
              </details>
              <div className="border-t border-white/15 pt-4">
                <LetterStreamStatusCard compact />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Invite setups & signup outreach — gold panel, deliberately distinct from the navy authority box above. */}
      <div className={`${fcAdminCard('p-5', 'gold', 'solid')} space-y-4`}>
        <div className="flex items-center gap-2">
          <Mail size={16} />
          <div className={GOLD_VALUE}>Invite setups & signup outreach</div>
        </div>

        <div className={`${GOLD_INNER} space-y-2`}>
          <div className={`font-semibold ${GOLD_VALUE}`}>Stuck signup? Use this playbook</div>
          <ul className={`list-disc pl-4 space-y-1 ${GOLD_BODY}`}>
            {!claimed ? (
              <>
                <li>
                  <strong>No account yet</strong> — Resend invite or copy the signup link below. They create their own password during signup.
                </li>
                <li>
                  <strong>Invite glitch / email never arrived</strong> — Copy link and text it to them, or click Resend invite (bypasses duplicate-send guard).
                </li>
              </>
            ) : (
              <>
                <li>
                  <strong>Account linked but can&apos;t log in</strong> — Send password reset email. They set a new password via the secure link (~1 hour).
                </li>
                <li>
                  <strong>Finished signup, needs portal intro</strong> — Resend welcome email (requires comms delivery ON).
                </li>
              </>
            )}
          </ul>
        </div>

        {!partner.claimedUserId ? (
          <div className={NOTICE_WARN_ON_GOLD}>
            <div>Unclaimed partner: send an invite link so they can create their account with this email and role context pre-filled.</div>
            {!isSupabaseConfigured && canSimulateInviteDeliveryLocally() ? (
              <div className="mt-2 text-xs">
                Local dev: Supabase is not configured — Send invite will open a branded email preview instead of sending real mail.
              </div>
            ) : null}
            <div className="mt-2 text-xs opacity-80">Password is chosen by the user during signup — not generated by admin.</div>
          </div>
        ) : null}

        {guide ? (
          <details className="text-xs">
            <summary className={`cursor-pointer ${GOLD_VALUE}`}>Role signup reference ({guide.label})</summary>
            <ul className={`mt-2 space-y-1 list-disc pl-4 ${GOLD_BODY}`}>
              <li>{guide.passwordSetup}</li>
              <li>{guide.welcomeEmail}</li>
            </ul>
          </details>
        ) : null}

        <div className={`${GOLD_INNER} space-y-3`}>
          <div className={GOLD_SUBLABEL}>Invite setup fields for this role/lane</div>
          <div className="grid md:grid-cols-2 gap-3">
            {roleFields.map((field) => (
              <div key={field.label} className="rounded-xl border border-black/15 bg-black/[0.05] p-3">
                <div className={`text-sm font-semibold ${GOLD_VALUE}`}>{field.label}</div>
                <div className={`mt-1 text-xs leading-relaxed ${GOLD_BODY}`}>{field.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {!partner.claimedUserId && signupInviteLink ? (
          <div className={`${GOLD_INNER} space-y-3`}>
            <div className={GOLD_SUBLABEL}>Signup invite link (share anytime)</div>
            <div className={`text-xs ${GOLD_BODY}`}>
              Pre-fills their email and role. Works even if email delivery failed — copy and send via text or any channel.
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                readOnly
                value={signupInviteLink}
                className={`flex-1 min-w-[200px] font-mono text-xs ${GOLD_BODY} bg-black/10 border border-black/15 rounded-lg px-3 py-2`}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button type="button" onClick={() => void copyInviteLink()} className={GOLD_SECONDARY_BTN}>
                <Copy size={14} /> {inviteCopied ? 'Copied!' : 'Copy link'}
              </button>
              <a href={signupInviteLink} target="_blank" rel="noopener noreferrer" className={GOLD_SECONDARY_BTN}>
                <Link2 size={14} /> Open link
              </a>
            </div>
          </div>
        ) : null}

        {notice ? <div className={NOTICE_SUCCESS_ON_GOLD}>{notice}</div> : null}
        {err ? <div className="text-[13px] font-semibold text-[#5c1710]">{err}</div> : null}

        {(inviteState.sentAt || resetState.sentAt || welcomeState.sentAt) ? (
          <div className={`${GOLD_INNER} text-xs space-y-1`}>
            <div className={GOLD_SUBLABEL}>Recent outbound notifications</div>
            {inviteState.sentAt ? (
              <div className={GOLD_BODY}>Invite email — {formatAdminDeliveryWhen(inviteState.sentAt)}</div>
            ) : null}
            {resetState.sentAt ? (
              <div className={GOLD_BODY}>Password reset — {formatAdminDeliveryWhen(resetState.sentAt)}</div>
            ) : null}
            {welcomeState.sentAt ? (
              <div className={GOLD_BODY}>Welcome email — {formatAdminDeliveryWhen(welcomeState.sentAt)}</div>
            ) : null}
          </div>
        ) : null}

        {!canSendComms ? (
          <div className={NOTICE_WARN_ON_GOLD}>
            Your staff role does not include outbound email for this partner file. Ask a full admin to grant access or add you to their assigned partner list.
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {!claimed && email ? (
            <>
              <button type="button" onClick={() => void sendInvite(false)} disabled={!canSendInviteEmail || busy !== null} className={FC_ADMIN_GOLD_BTN}>
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
                className={GOLD_SECONDARY_BTN}
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
            className={FC_ADMIN_PRIMARY_BTN}
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
            className={GOLD_SECONDARY_BTN}
          >
            <Mail size={14} />{' '}
            {busy === 'welcome'
              ? 'Sending…'
              : partner.claimedUserId
                ? 'Resend welcome email'
                : 'Send account setup email'}
          </button>
          <a href="/admin/signup-ops" className={GOLD_SECONDARY_BTN}>
            <UserCheck size={14} /> Full signup ops guide
          </a>
        </div>
      </div>

      <SensitiveActionCodeGate
        open={approveAccessGateOpen}
        action="partner_access_grant"
        title="Authorize — Approve portal access"
        description={`Moves ${partner.profile.fullName} from lead to active and sets portal access approved.`}
        onClose={() => setApproveAccessGateOpen(false)}
        onVerified={() => {
          setApproveAccessGateOpen(false);
          toggleFlag('accessApproved', true);
        }}
      />
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
