import React, { useEffect, useMemo, useState } from 'react';
import { Check, LockOpen, ShieldCheck } from 'lucide-react';
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
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';
import { SensitiveActionCodeGate } from './SensitiveActionCodeGate';

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

type PendingGrant =
  | { kind: 'toolkit' }
  | { kind: 'credit_letters' }
  | { kind: 'debt_letters' }
  | { kind: 'lane'; id: ServiceAccessBundleId };

function gateCopy(pending: PendingGrant | null): { title: string; description: string } {
  if (!pending) return { title: 'Authorize access grant', description: '' };
  if (pending.kind === 'toolkit') {
    return {
      title: 'Authorize — Full partner toolkit',
      description: 'Grants Credit Letters + Debt / Litigation + disputes in one action.',
    };
  }
  if (pending.kind === 'credit_letters') {
    return {
      title: 'Authorize — Credit Letters / Bureaus',
      description: 'Unlocks bureau disputes and the letter studio for this partner.',
    };
  }
  if (pending.kind === 'debt_letters') {
    return {
      title: 'Authorize — Debt Letters',
      description: 'Unlocks Validation, Court, and debt workstations for this partner.',
    };
  }
  const label = SERVICE_ACCESS_BUNDLE_META[pending.id].label;
  return { title: `Authorize — ${label}`, description: `Grants the ${label} lane for this partner.` };
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
  const [pendingGrant, setPendingGrant] = useState<PendingGrant | null>(null);

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

  const runGrantCreditLetters = () =>
    void grantBundle('credit_restore', 'credit_letters', 'Credit Letters / Bureaus', () =>
      creditLettersActive(partner.id),
    );

  const runGrantDebtLetters = () =>
    void grantBundle('debt', 'debt_letters', 'Debt Letters', () => debtLettersActive(partner.id));

  const runGrantFullToolkit = async () => {
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

  const runGrantLane = (bundleId: ServiceAccessBundleId) => {
    void toggleBundle(bundleId, true);
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

  const requestToolkitGrant = () => {
    if (!canManage || toolkitOn) return;
    if (!confirmToolkit) {
      setConfirmToolkit(true);
      setNotice('Tap again to authorize the Full partner toolkit grant.');
      return;
    }
    setNotice(null);
    setPendingGrant({ kind: 'toolkit' });
  };

  const requestCreditLettersGrant = () => {
    if (!canManage || lettersOn) return;
    setPendingGrant({ kind: 'credit_letters' });
  };

  const requestDebtLettersGrant = () => {
    if (!canManage || debtOn) return;
    setPendingGrant({ kind: 'debt_letters' });
  };

  const requestLaneGrant = (id: ServiceAccessBundleId) => {
    if (!canManage) return;
    setPendingGrant({ kind: 'lane', id });
  };

  const handleVerified = () => {
    const pending = pendingGrant;
    setPendingGrant(null);
    if (!pending) return;
    if (pending.kind === 'toolkit') void runGrantFullToolkit();
    else if (pending.kind === 'credit_letters') runGrantCreditLetters();
    else if (pending.kind === 'debt_letters') runGrantDebtLetters();
    else if (pending.kind === 'lane') runGrantLane(pending.id);
  };

  const gate = gateCopy(pendingGrant);

  return (
    <div id="partner-services-access" className={`${finelyOsCatalogCardCompact('emerald')} space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-1.5 text-emerald-200/90`}>
            <ShieldCheck size={12} /> Grant portal access
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
            Prefer <strong className="text-white/90">Full toolkit</strong>. Green = synced to portal.
          </p>
        </div>
        {syncState !== 'unknown' ? (
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
              syncState === 'synced'
                ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-200/90'
                : 'border-amber-400/40 bg-amber-400/15 text-amber-200/90'
            }`}
          >
            {syncState === 'synced' ? 'Synced' : 'This device'}
          </span>
        ) : null}
      </div>

      {!canManage ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Only full admins can grant or revoke service access.</div>
      ) : (
        <>
          <button
            type="button"
            disabled={busy === 'toolkit' || toolkitOn}
            onClick={requestToolkitGrant}
            className={
              'w-full text-left flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ' +
              (toolkitOn
                ? 'border-emerald-400/60 bg-emerald-500/20 cursor-default'
                : confirmToolkit
                  ? 'border-amber-300/60 bg-amber-500/15'
                  : 'border-sky-300/40 bg-sky-500/10 hover:bg-sky-500/15')
            }
          >
            <span
              className={
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                (toolkitOn
                  ? 'border-emerald-200 bg-emerald-400 text-black'
                  : 'border-sky-300/50 bg-black/30 text-sky-100')
              }
            >
              {toolkitOn ? <Check size={14} strokeWidth={3} /> : <LockOpen size={14} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {toolkitOn ? 'Full toolkit — active' : confirmToolkit ? 'Tap to confirm Full toolkit' : 'Grant Full toolkit'}
              </span>
              {!toolkitOn ? (
                <span className={`block text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Letters + Debt / Litigation + disputes</span>
              ) : null}
            </span>
            {!toolkitOn ? (
              <span className="shrink-0 rounded-md border border-sky-300/40 bg-sky-500/15 px-2.5 py-1 text-[10px] font-semibold text-sky-100">
                {busy === 'toolkit' ? 'Granting…' : confirmToolkit ? 'Confirm' : 'Grant all'}
              </span>
            ) : (
              <span className="shrink-0 rounded-md border border-emerald-300/50 bg-emerald-400/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                Active
              </span>
            )}
          </button>
          {confirmToolkit && !toolkitOn ? (
            <button
              type="button"
              className="text-[11px] text-white/50 underline -mt-1.5 px-1"
              onClick={() => setConfirmToolkit(false)}
            >
              Cancel
            </button>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy === 'credit_letters' || lettersOn}
              onClick={requestCreditLettersGrant}
              className={
                'w-full text-left flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ' +
                (lettersOn
                  ? 'border-emerald-400/60 bg-emerald-500/20 cursor-default'
                  : 'border-emerald-300/40 bg-emerald-500/10 hover:bg-emerald-500/15')
              }
            >
              <span
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                  (lettersOn
                    ? 'border-emerald-200 bg-emerald-400 text-black'
                    : 'border-emerald-300/50 bg-black/30 text-emerald-100')
                }
                aria-hidden
              >
                {lettersOn ? <Check size={14} strokeWidth={3} /> : <LockOpen size={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {lettersOn ? 'Credit Letters — active' : 'Grant Credit Letters'}
                </span>
                <span className={`block text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Bureau disputes + letter studio</span>
              </span>
              {!lettersOn ? (
                <span className="shrink-0 rounded-md border border-emerald-300/40 bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100">
                  {busy === 'credit_letters' ? '…' : 'Grant'}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              disabled={busy === 'debt_letters' || debtOn}
              onClick={requestDebtLettersGrant}
              className={
                'w-full text-left flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all ' +
                (debtOn
                  ? 'border-emerald-400/50 bg-emerald-500/20 cursor-default'
                  : 'border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/15')
              }
            >
              <span
                className={
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold ' +
                  (debtOn ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-violet-300/50 bg-black/30 text-violet-100')
                }
                aria-hidden
              >
                {debtOn ? <Check size={14} strokeWidth={3} /> : <LockOpen size={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {debtOn ? 'Debt Letters — active' : 'Grant Debt Letters'}
                </span>
                <span className={`block text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Validation, Court, debt workstations</span>
              </span>
              {!debtOn ? (
                <span className="shrink-0 rounded-md border border-violet-300/40 bg-violet-500/15 px-2 py-1 text-[10px] font-semibold text-violet-100">
                  {busy === 'debt_letters' ? '…' : 'Grant'}
                </span>
              ) : null}
            </button>
          </div>

          <details className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <summary className={`cursor-pointer select-none text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
              Other lanes (Business / Tradelines)
            </summary>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {EXTRA_LANES.map((id) => {
                const meta = SERVICE_ACCESS_BUNDLE_META[id];
                const on = extraActive[id];
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={busy === id || busy === 'credit_letters' || busy === 'debt_letters'}
                    onClick={() => (on ? void toggleBundle(id, false) : requestLaneGrant(id))}
                    className={
                      'w-full text-left flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all ' +
                      (on
                        ? 'border-emerald-400/40 bg-emerald-500/15'
                        : 'border-white/12 bg-black/25 hover:border-white/25 hover:bg-white/5')
                    }
                  >
                    <span
                      className={
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-[10px] font-bold ' +
                        (on ? 'border-emerald-300 bg-emerald-400 text-black' : 'border-white/30 bg-transparent text-transparent')
                      }
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-xs font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{meta.label}</span>
                      <span className={`block text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{meta.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </details>
        </>
      )}
      {notice ? <div className={`${FINELY_OS_NOTICE_SUCCESS} !p-3 text-xs`}>{notice}</div> : null}
      {err ? <div className={`${FINELY_OS_NOTICE_WARN} !p-3 text-xs`}>{err}</div> : null}

      <SensitiveActionCodeGate
        open={Boolean(pendingGrant)}
        action="partner_access_grant"
        title={gate.title}
        description={gate.description}
        onClose={() => setPendingGrant(null)}
        onVerified={handleVerified}
      />
    </div>
  );
}
