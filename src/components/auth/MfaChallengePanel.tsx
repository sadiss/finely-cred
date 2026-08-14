import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { verifyTotpSignIn } from '../../lib/mfaAuth';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  title?: string;
  subtitle?: string;
  factorId?: string;
  onVerified: () => void;
  onCancel?: () => void;
};

/** Six-digit TOTP entry — used after password sign-in and for portal MFA gate. */
export function MfaChallengePanel({
  title = 'Authenticator verification',
  subtitle = 'Enter the 6-digit code from your authenticator app.',
  factorId,
  onVerified,
  onCancel,
}: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = code.replace(/\s/g, '');
    if (trimmed.length < 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyTotpSignIn(trimmed, factorId);
      onVerified();
    } catch (e) {
      setError((e as Error)?.message || 'Invalid code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 max-w-md w-full`}>
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-violet-300 shrink-0" size={22} />
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p>
        </div>
      </div>
      <label className="block">
        <span className={FINELY_OS_ENTITY_LABEL}>Authenticator code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 8))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className={`${FINELY_OS_ENTITY_INPUT} font-mono tracking-[0.35em] text-center text-lg`}
          autoFocus
        />
      </label>
      {error ? <div className={FINELY_OS_NOTICE_ERROR}>{error}</div> : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy || code.replace(/\s/g, '').length < 6} onClick={() => void submit()} className={FINELY_OS_PRIMARY_BTN}>
          {busy ? 'Verifying…' : 'Verify & continue'}
        </button>
        {onCancel ? (
          <button type="button" disabled={busy} onClick={onCancel} className="text-sm text-white/50 hover:text-white/80 underline">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
