import React, { useEffect, useState } from 'react';
import { getMailProviderStatus, type MailProviderStatus } from '../../lib/mailerClient';
import { isFeatureEnabled } from '../../data/settingsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_NOTICE_ERROR,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';

/**
 * Admin/ops Finely Mail readiness. Surfaces LetterStream TEST mode when detectable.
 */
export function LetterStreamStatusCard({ compact }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<MailProviderStatus | null>(null);

  const runPing = async () => {
    setBusy(true);
    setStatus(null);
    try {
      if (!isFeatureEnabled('letterMailing')) {
        setStatus({
          ok: false,
          testMode: false,
          balanceUsd: null,
          estimatedCostUsd: 1.85,
          error: 'letterMailing feature flag is off (Admin Settings).',
        });
        return;
      }
      const s = await getMailProviderStatus();
      setStatus(s);
    } catch (e: unknown) {
      setStatus({
        ok: false,
        testMode: false,
        balanceUsd: null,
        estimatedCostUsd: 1.85,
        error: (e as Error)?.message || 'Could not reach mailer function.',
      });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void runPing();
  }, []);

  return (
    <div className={compact ? 'space-y-2' : finelyOsCatalogCardCompact('sky')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>{FINELY_MAIL_COPY.serviceName} API</div>
          <p className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>Physical mail readiness</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => void runPing()}>
          {busy ? 'Checking…' : 'Check status'}
        </button>
      </div>
      <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
        Secrets: <code className="text-white/70">MAIL_API_ID</code> + <code className="text-white/70">MAIL_API_KEY</code> on the{' '}
        <code className="text-white/70">mailer</code> edge function. Optional:{' '}
        <code className="text-white/70">MAIL_TEST_MODE</code>, <code className="text-white/70">MAIL_DEBUG</code>.
      </p>

      {status?.testMode ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="TEST MODE detected — do not treat mailed letters as live USPS production until LetterStream test mode / MAIL_TEST_MODE is off."
        />
      ) : null}

      {status ? (
        <div
          className={
            !status.ok ? FINELY_OS_NOTICE_ERROR : status.testMode ? FINELY_OS_NOTICE_WARN : FINELY_OS_NOTICE_SUCCESS
          }
        >
          {status.ok ? 'Connected' : 'Not ready'}
          {status.message ? ` — ${status.message}` : ''}
          {status.error ? ` — ${status.error}` : ''}
          {status.code != null ? ` (code ${status.code})` : ''}
          {status.balanceUsd != null
            ? ` · prepaid ≈ ${status.balanceUsd.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`
            : ''}
          {status.debugLevel ? ` · debug=${status.debugLevel}` : ''}
        </div>
      ) : (
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Run a status check to see if the account credentials respond.</p>
      )}
    </div>
  );
}
