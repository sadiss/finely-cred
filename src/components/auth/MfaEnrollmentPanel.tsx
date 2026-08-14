import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import {
  hasVerifiedTotpFactor,
  listVerifiedTotpFactors,
  startTotpEnrollment,
  unenrollTotpFactor,
  verifyTotpEnrollment,
  type MfaFactorSummary,
} from '../../lib/mfaAuth';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  /** When true, show stronger copy for partners accessing credit data. */
  emphasizeSensitiveData?: boolean;
};

/** Enroll, verify, or remove TOTP authenticator app MFA. */
export function MfaEnrollmentPanel({ emphasizeSensitiveData }: Props) {
  const [factors, setFactors] = useState<MfaFactorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [enrollQr, setEnrollQr] = useState<string | null>(null);
  const [enrollSecret, setEnrollSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setFactors(await listVerifiedTotpFactors());
    } catch (e) {
      setError((e as Error)?.message || 'Could not load MFA status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startEnroll = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const started = await startTotpEnrollment();
      setPendingFactorId(started.factorId);
      setEnrollQr(started.qrCode);
      setEnrollSecret(started.secret);
      setVerifyCode('');
    } catch (e) {
      setError((e as Error)?.message || 'Could not start enrollment.');
    } finally {
      setBusy(false);
    }
  };

  const confirmEnroll = async () => {
    if (!pendingFactorId) return;
    setBusy(true);
    setError(null);
    try {
      await verifyTotpEnrollment(pendingFactorId, verifyCode);
      setPendingFactorId(null);
      setEnrollQr(null);
      setEnrollSecret(null);
      setVerifyCode('');
      setNotice('Authenticator app connected. You will need a code when signing in.');
      await refresh();
    } catch (e) {
      setError((e as Error)?.message || 'Invalid code. Scan the QR again or enter the secret manually.');
    } finally {
      setBusy(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    if (!window.confirm('Remove authenticator app from this account? You can enroll again anytime.')) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await unenrollTotpFactor(factorId);
      setNotice('Authenticator removed.');
      await refresh();
    } catch (e) {
      setError((e as Error)?.message || 'Could not remove authenticator.');
    } finally {
      setBusy(false);
    }
  };

  const enrolled = factors.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <KeyRound className="text-violet-300 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-base font-semibold text-white">Authenticator app (TOTP)</h3>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            {emphasizeSensitiveData
              ? 'Strongly recommended for portal access to credit reports, disputes, and letters. Use Google Authenticator, Authy, 1Password, or any TOTP app.'
              : 'Add a second step at sign-in with any authenticator app (Google Authenticator, Authy, 1Password, etc.).'}
          </p>
        </div>
      </div>

      {loading ? <p className={FINELY_OS_ENTITY_BODY}>Loading MFA status…</p> : null}
      {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}
      {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}

      {enrolled && !pendingFactorId ? (
        <div className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-3`}>
          <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium">
            <ShieldCheck size={16} /> Authenticator active
          </div>
          {factors.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center justify-between gap-3">
              <span className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{f.friendlyName}</span>
              <button type="button" disabled={busy} onClick={() => void removeFactor(f.id)} className={FINELY_OS_DANGER_BTN}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {!enrolled && !pendingFactorId && !loading ? (
        <button type="button" disabled={busy} onClick={() => void startEnroll()} className={FINELY_OS_PRIMARY_BTN}>
          Set up authenticator app
        </button>
      ) : null}

      {pendingFactorId && enrollQr ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-4 space-y-4`}>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>Scan this QR code with your authenticator app, then enter the 6-digit code to finish.</p>
          <div className="flex justify-center p-3 bg-white rounded-xl max-w-[220px] mx-auto" dangerouslySetInnerHTML={{ __html: enrollQr }} />
          {enrollSecret ? (
            <div className="text-center">
              <div className={FINELY_OS_ENTITY_LABEL}>Manual entry key</div>
              <code className="text-xs text-sky-200 break-all font-mono">{enrollSecret}</code>
            </div>
          ) : null}
          <label className="block max-w-xs mx-auto">
            <span className={FINELY_OS_ENTITY_LABEL}>Verification code</span>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 8))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={`${FINELY_OS_ENTITY_INPUT} font-mono tracking-[0.35em] text-center`}
            />
          </label>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" disabled={busy || verifyCode.replace(/\s/g, '').length < 6} onClick={() => void confirmEnroll()} className={FINELY_OS_PRIMARY_BTN}>
              {busy ? 'Verifying…' : 'Activate authenticator'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPendingFactorId(null);
                setEnrollQr(null);
                setEnrollSecret(null);
                setVerifyCode('');
              }}
              className={FINELY_OS_SECONDARY_BTN}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {!enrolled && !pendingFactorId && emphasizeSensitiveData ? (
        <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
          Sensitive portal areas (disputes, letters, documents, reports) will prompt you to enable MFA before full access.
        </p>
      ) : null}
    </div>
  );
}

/** Lightweight hook for banners — whether MFA is enrolled. */
export function useMfaEnrolled(): boolean | null {
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  useEffect(() => {
    void hasVerifiedTotpFactor()
      .then(setEnrolled)
      .catch(() => setEnrolled(false));
  }, []);
  return enrolled;
}
