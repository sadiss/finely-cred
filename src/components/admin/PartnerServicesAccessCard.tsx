import React, { useEffect, useMemo, useState } from 'react';
import { Check, LockOpen } from 'lucide-react';
import type { Partner } from '../../domain/partners';
import {
  SERVICE_ACCESS_BUNDLES,
  SERVICE_ACCESS_BUNDLE_META,
  ensurePartnerEntitlementsAsync,
  type ServiceAccessBundleId,
  type EntitlementKey,
  ENTITLEMENT_KEYS,
} from '../../billing/entitlements';
import { hasEntitlement, listEntitlementsByPartner, revokeEntitlementsByPartnerKey } from '../../data/billingRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';

/** Specialty lanes only — Credit Letters is the hero CTA above (not duplicated here). */
const EXTRA_LANES: ServiceAccessBundleId[] = ['business', 'au_tradelines'];

/** Credit Letters / Bureaus needs both disputes + letters — not just one signature key. */
function creditLettersActive(partnerId: string): boolean {
  return (
    hasEntitlement(partnerId, ENTITLEMENT_KEYS.disputes) &&
    hasEntitlement(partnerId, ENTITLEMENT_KEYS.letters)
  );
}

function debtLettersActive(partnerId: string): boolean {
  return hasEntitlement(partnerId, ENTITLEMENT_KEYS.debt);
}

function bundleActive(partnerId: string, bundleId: ServiceAccessBundleId): boolean {
  if (bundleId === 'credit_restore') return creditLettersActive(partnerId);
  if (bundleId === 'debt') return debtLettersActive(partnerId);
  const keys = SERVICE_ACCESS_BUNDLES[bundleId] as readonly EntitlementKey[];
  const signature =
    bundleId === 'business'
      ? [ENTITLEMENT_KEYS.businessBuild]
      : [ENTITLEMENT_KEYS.auSeller];
  return signature.every((k) => k && hasEntitlement(partnerId, k)) && keys.length > 0;
}

export function PartnerServicesAccessCard({
  partner,
  canManage,
  onUpdated,
}: {
  partner: Partner;
  canManage: boolean;
  onUpdated?: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [confirmToolkit, setConfirmToolkit] = useState(false);
  const [syncState, setSyncState] = useState<'unknown' | 'synced' | 'local_only'>('unknown');

  useEffect(() => {
    const onStore = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const lettersOn = useMemo(() => {
    void tick;
    return creditLettersActive(partner.id);
  }, [partner.id, tick]);

  const debtOn = useMemo(() => {
    void tick;
    return debtLettersActive(partner.id);
  }, [partner.id, tick]);

  const toolkitOn = lettersOn && debtOn;

  const extraActive = useMemo(() => {
    void tick;
    return Object.fromEntries(EXTRA_LANES.map((id) => [id, bundleActive(partner.id, id)])) as Record<
      ServiceAccessBundleId,
      boolean
    >;
  }, [partner.id, tick]);

  const grantBundle = async (
    bundleId: ServiceAccessBundleId,
    busyKey: string,
    successLabel: string,
    verify: () => boolean,
  ) => {
    if (!canManage) return;
    setBusy(busyKey);
    setErr(null);
    setNotice(null);
    try {
      const keys = [...SERVICE_ACCESS_BUNDLES[bundleId]] as EntitlementKey[];
      const res = await ensurePartnerEntitlementsAsync({
        partnerId: partner.id,
        keys,
        sourceAgreementId: `admin_service_${bundleId}`,
      });
      setTick((t) => t + 1);
      void listEntitlementsByPartner(partner.id);
      if (!verify() || res.missing.length) {
        setSyncState('local_only');
        setErr(
          `Grant saved locally but ${successLabel} is still locked (${res.missing.join(', ') || 'check keys'}). ${
            res.pushError ? `Sync: ${res.pushError}` : 'Refresh and try again.'
          } Apply migration 202607240001_entitlements_admin_write if cloud sync fails.`,
        );
      } else if (res.pushError) {
        setSyncState('local_only');
        setNotice(
          `${successLabel} active on this device only. Unlocked: see module below. Partner may need refresh after sync. Sync failed — apply 202607240001_entitlements_admin_write or retry.`,
        );
        setErr(res.pushError);
      } else {
        setSyncState('synced');
        setNotice(
          `${successLabel} granted & synced. Partner refreshes portal. Unlocked routes: /portal/letters (Credit Letters), /portal/debt + /portal/debt?tab=litigation (Debt / Litigation), /portal/disputes.`,
        );
      }
      onUpdated?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || `Failed to grant ${successLabel}.`);
    } finally {
      setBusy(null);
    }
  };

  const grantCreditLetters = () =>
    void grantBundle('credit_restore', 'credit_letters', 'Credit Letters / Bureaus', () =>
      creditLettersActive(partner.id),
    );

  const grantDebtLetters = () =>
    void grantBundle('debt', 'debt_letters', 'Debt Letters', () => debtLettersActive(partner.id));

  const grantFullToolkit = async () => {
    if (!canManage || !confirmToolkit) {
      setConfirmToolkit(true);
      setNotice('Confirm: grant Full partner toolkit (Credit Letters + Debt / Litigation + disputes)?');
      return;
    }
    setBusy('toolkit');
    setErr(null);
    setNotice(null);
    try {
      const keys = Array.from(
        new Set([...SERVICE_ACCESS_BUNDLES.credit_restore, ...SERVICE_ACCESS_BUNDLES.debt]),
      ) as EntitlementKey[];
      const res = await ensurePartnerEntitlementsAsync({
        partnerId: partner.id,
        keys,
        sourceAgreementId: 'admin_service_full_toolkit',
      });
      setTick((t) => t + 1);
      void listEntitlementsByPartner(partner.id);
      const ok = creditLettersActive(partner.id) && debtLettersActive(partner.id);
      if (!ok || res.missing.length) {
        setSyncState('local_only');
        setErr(
          `Toolkit partially saved. Missing: ${res.missing.join(', ') || 'verify keys'}. ${res.pushError || ''} Apply migration 202607240001_entitlements_admin_write if needed.`,
        );
      } else if (res.pushError) {
        setSyncState('local_only');
        setNotice(
          'Full toolkit active on this device. Sync failed — green means local entitlements; partner portal needs migration/retry for other devices.',
        );
        setErr(res.pushError);
      } else {
        setSyncState('synced');
        setNotice(
          'Full partner toolkit granted & synced. Unlocked: Credit Letters (/portal/letters), Disputes, Debt Letters + Litigation Command (/portal/debt?tab=litigation). Partner refreshes portal.',
        );
      }
      setConfirmToolkit(false);
      onUpdated?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to grant full toolkit.');
    } finally {
      setBusy(null);
    }
  };

  const toggleBundle = async (bundleId: ServiceAccessBundleId, nextOn: boolean) => {
    if (!canManage) return;
    setBusy(bundleId);
    setErr(null);
    setNotice(null);
    try {
      const keys = [...SERVICE_ACCESS_BUNDLES[bundleId]] as EntitlementKey[];
      if (nextOn) {
        const res = await ensurePartnerEntitlementsAsync({
          partnerId: partner.id,
          keys,
          sourceAgreementId: `admin_service_${bundleId}`,
        });
        setTick((t) => t + 1);
        if (!bundleActive(partner.id, bundleId)) {
          setErr(
            `Could not activate ${SERVICE_ACCESS_BUNDLE_META[bundleId].label}. ${
              res.pushError || res.missing.join(', ') || 'Try again.'
            }`,
          );
        } else {
          setNotice(
            `${SERVICE_ACCESS_BUNDLE_META[bundleId].label} access granted.` +
              (res.pushError ? ' (Local only — sync failed.)' : ''),
          );
          if (res.pushError) setErr(res.pushError);
        }
      } else {
        const specialty =
          bundleId === 'business'
            ? ([ENTITLEMENT_KEYS.businessBuild] as EntitlementKey[])
            : ([ENTITLEMENT_KEYS.auSeller] as EntitlementKey[]);
        for (const key of specialty) revokeEntitlementsByPartnerKey({ partnerId: partner.id, key });
        setTick((t) => t + 1);
        setNotice(`${SERVICE_ACCESS_BUNDLE_META[bundleId].label} access removed.`);
      }
      onUpdated?.();
      void listEntitlementsByPartner(partner.id);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to update service access.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      id="partner-services-access"
      className="space-y-3 rounded-2xl border-2 border-emerald-400/45 bg-emerald-500/10 p-4 shadow-[0_0_36px_-12px_rgba(52,211,153,0.55)]"
    >
      <div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200/90`}>Services access — grant here</div>
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
          One tap unlocks modules. Green = server+local active for required keys. Partner refreshes portal. If sync fails,
          status shows “this device only” + migration hint.
        </p>
        {syncState !== 'unknown' ? (
          <p className={`text-[11px] mt-1 ${syncState === 'synced' ? 'text-emerald-200/90' : 'text-amber-200/90'}`}>
            {syncState === 'synced' ? 'Last grant: synced to partner portal' : 'Last grant: active on this device only — apply entitlements migration if needed'}
          </p>
        ) : null}
      </div>

      {!canManage ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Only full admins can grant or revoke service access.</div>
      ) : (
        <>
          <button
            type="button"
            disabled={busy === 'toolkit' || toolkitOn}
            onClick={() => void grantFullToolkit()}
            className={
              'w-full text-left flex items-start gap-3 rounded-2xl border-2 px-5 py-4 transition-all ' +
              (toolkitOn
                ? 'border-emerald-400/70 bg-emerald-500/25 cursor-default'
                : confirmToolkit
                  ? 'border-amber-300/70 bg-amber-500/20'
                  : 'border-sky-300/50 bg-sky-500/15 hover:bg-sky-500/25')
            }
          >
            <span
              className={
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ' +
                (toolkitOn
                  ? 'border-emerald-200 bg-emerald-400 text-black'
                  : 'border-sky-300/60 bg-black/35 text-sky-100')
              }
            >
              {toolkitOn ? <Check size={18} strokeWidth={3} /> : <LockOpen size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-base font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {toolkitOn
                  ? 'Full partner toolkit — access on'
                  : confirmToolkit
                    ? 'Tap again to confirm Full partner toolkit'
                    : 'Grant Full partner toolkit'}
              </span>
              <span className={`block text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                Letters + disputes + debt / Litigation Command in one tap. Confirm once, then grants.
              </span>
            </span>
            {!toolkitOn ? (
              <span className={`${FINELY_OS_PRIMARY_BTN} shrink-0 pointer-events-none`}>
                {busy === 'toolkit' ? 'Granting…' : confirmToolkit ? 'Confirm' : 'Grant all'}
              </span>
            ) : (
              <span className="shrink-0 rounded-lg border border-emerald-300/50 bg-emerald-400/20 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                Active
              </span>
            )}
          </button>
          {confirmToolkit && !toolkitOn ? (
            <button
              type="button"
              className="text-[11px] text-white/50 underline -mt-1 px-1"
              onClick={() => setConfirmToolkit(false)}
            >
              Cancel toolkit confirm
            </button>
          ) : null}

          <button
            type="button"
            disabled={busy === 'credit_letters' || lettersOn}
            onClick={grantCreditLetters}
            className={
              'w-full text-left flex items-start gap-3 rounded-2xl border-2 px-5 py-5 transition-all ' +
              (lettersOn
                ? 'border-emerald-400/70 bg-emerald-500/30 shadow-[0_0_28px_-8px_rgba(52,211,153,0.7)] cursor-default'
                : 'border-emerald-300/60 bg-emerald-500/20 hover:bg-emerald-500/30 hover:border-emerald-300')
            }
          >
            <span
              className={
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ' +
                (lettersOn
                  ? 'border-emerald-200 bg-emerald-400 text-black'
                  : 'border-emerald-300/60 bg-black/35 text-emerald-100')
              }
              aria-hidden
            >
              {lettersOn ? <Check size={18} strokeWidth={3} /> : <LockOpen size={18} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-base font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {lettersOn ? 'Credit Letters / Bureaus — access on' : 'Grant Credit Letters / Bureaus'}
              </span>
              <span className={`block text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                {lettersOn
                  ? 'Active. Partner can open Credit Letters → Bureaus and run dispute rounds.'
                  : 'Unlocks bureau disputes + letter studio. Turns green only when both keys are live.'}
              </span>
            </span>
            {!lettersOn ? (
              <span className={`${FINELY_OS_PRIMARY_BTN} shrink-0 pointer-events-none !bg-emerald-500 !text-black !border-emerald-300`}>
                {busy === 'credit_letters' ? 'Granting…' : 'Grant'}
              </span>
            ) : (
              <span
                className={
                  'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ' +
                  (syncState === 'local_only'
                    ? 'border-amber-300/50 bg-amber-400/15 text-amber-100'
                    : 'border-emerald-300/50 bg-emerald-400/20 text-emerald-100')
                }
              >
                {syncState === 'local_only' ? 'This device' : 'Active'}
              </span>
            )}
          </button>
          {!lettersOn ? (
            <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY} -mt-1 px-1`}>
              After grant: partner opens Credit Letters → Bureaus. If sync fails, apply migration{' '}
              <span className="font-mono text-white/70">202607240001_entitlements_admin_write</span>.
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy === 'debt_letters' || debtOn}
            onClick={grantDebtLetters}
            className={
              'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all ' +
              (debtOn
                ? 'border-emerald-400/50 bg-emerald-500/20 cursor-default'
                : 'border-violet-400/35 bg-violet-500/12 hover:bg-violet-500/20')
            }
          >
            <span
              className={
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ' +
                (debtOn ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-violet-300/50 bg-black/30 text-violet-100')
              }
              aria-hidden
            >
              {debtOn ? <Check size={14} strokeWidth={3} /> : <LockOpen size={14} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {debtOn ? 'Debt Letters — access on' : 'Grant Debt Letters'}
              </span>
              <span className={`block text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                {debtOn
                  ? 'Active. Partner can use Validation, Court, and debt workstations.'
                  : 'Needed for summons / validation / court defense — separate from Credit Letters.'}
              </span>
            </span>
            {!debtOn ? (
              <span className={`${FINELY_OS_PRIMARY_BTN} shrink-0 pointer-events-none`}>
                {busy === 'debt_letters' ? 'Granting…' : 'Grant'}
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                Active
              </span>
            )}
          </button>

          <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <summary className={`cursor-pointer select-none text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
              Other lanes (Business / Tradelines)
            </summary>
            <div className="mt-2 space-y-2">
              {EXTRA_LANES.map((id) => {
                const meta = SERVICE_ACCESS_BUNDLE_META[id];
                const on = extraActive[id];
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={busy === id || busy === 'credit_letters' || busy === 'debt_letters'}
                    onClick={() => void toggleBundle(id, !on)}
                    className={
                      'w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-all ' +
                      (on
                        ? 'border-emerald-400/40 bg-emerald-500/15'
                        : 'border-white/12 bg-black/25 hover:border-white/25 hover:bg-white/5')
                    }
                  >
                    <span
                      className={
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                        (on ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-white/30 bg-transparent text-transparent')
                      }
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{meta.label}</span>
                      <span className={`block text-xs mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{meta.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        </>
      )}
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className={FINELY_OS_NOTICE_WARN}>{err}</div> : null}
    </div>
  );
}
