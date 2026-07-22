import React, { useMemo, useState } from 'react';
import type { Partner } from '../../domain/partners';
import {
  SERVICE_ACCESS_BUNDLES,
  SERVICE_ACCESS_BUNDLE_META,
  type ServiceAccessBundleId,
  type EntitlementKey,
} from '../../billing/entitlements';
import { hasEntitlement, listEntitlementsByPartner, revokeEntitlementsByPartnerKey } from '../../data/billingRepo';
import { ensurePartnerEntitlements } from '../../billing/entitlements';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
} from '../../features/os/finelyOsLightUi';

const BUNDLE_ORDER: ServiceAccessBundleId[] = ['credit_restore', 'debt', 'business', 'au_tradelines'];

function bundleActive(partnerId: string, bundleId: ServiceAccessBundleId): boolean {
  const keys = SERVICE_ACCESS_BUNDLES[bundleId] as readonly EntitlementKey[];
  // Consider active when the signature keys for that lane are present.
  const signature =
    bundleId === 'credit_restore'
      ? [keys.find((k) => k.includes('disputes'))!]
      : bundleId === 'debt'
        ? [keys.find((k) => k.includes('debt'))!]
        : bundleId === 'business'
          ? [keys.find((k) => k.includes('business'))!]
          : [keys.find((k) => k.includes('au_seller'))!];
  return signature.every((k) => k && hasEntitlement(partnerId, k));
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

  const active = useMemo(() => {
    void tick;
    return Object.fromEntries(BUNDLE_ORDER.map((id) => [id, bundleActive(partner.id, id)])) as Record<
      ServiceAccessBundleId,
      boolean
    >;
  }, [partner.id, tick]);

  const toggleBundle = async (bundleId: ServiceAccessBundleId, nextOn: boolean) => {
    if (!canManage) return;
    setBusy(bundleId);
    setErr(null);
    setNotice(null);
    try {
      const keys = [...SERVICE_ACCESS_BUNDLES[bundleId]] as EntitlementKey[];
      if (nextOn) {
        ensurePartnerEntitlements({
          partnerId: partner.id,
          keys,
          sourceAgreementId: `admin_service_${bundleId}`,
        });
        setNotice(`${SERVICE_ACCESS_BUNDLE_META[bundleId].label} access granted.`);
      } else {
        // Revoke only signature / specialty keys so we don't strip shared vault/messages from other lanes.
        const specialty =
          bundleId === 'credit_restore'
            ? ([
                'portal.disputes',
                'portal.letters',
                'portal.identity_theft',
                'portal.templates',
              ] as EntitlementKey[])
            : bundleId === 'debt'
              ? (['portal.debt', 'portal.escalations'] as EntitlementKey[])
              : bundleId === 'business'
                ? (['portal.business.build'] as EntitlementKey[])
                : (['portal.au_seller'] as EntitlementKey[]);
        for (const key of specialty) revokeEntitlementsByPartnerKey({ partnerId: partner.id, key });
        setNotice(`${SERVICE_ACCESS_BUNDLE_META[bundleId].label} access removed.`);
      }
      setTick((t) => t + 1);
      onUpdated?.();
      void listEntitlementsByPartner(partner.id);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Failed to update service access.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Services access</div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
        Partners only see what you grant. Credit restore does not include business or AUs unless toggled on.
      </p>
      {!canManage ? (
        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Only full admins can grant or revoke service access.</div>
      ) : (
        <div className="space-y-2">
          {BUNDLE_ORDER.map((id) => {
            const meta = SERVICE_ACCESS_BUNDLE_META[id];
            const on = active[id];
            return (
              <button
                key={id}
                type="button"
                disabled={busy === id}
                onClick={() => void toggleBundle(id, !on)}
                className={
                  'w-full text-left flex items-start gap-3 rounded-xl border px-4 py-3 transition-all ' +
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
      )}
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {err ? <div className={FINELY_OS_NOTICE_WARN}>{err}</div> : null}
    </div>
  );
}
