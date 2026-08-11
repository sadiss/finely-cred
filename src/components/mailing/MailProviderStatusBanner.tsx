import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCcw, Wallet } from 'lucide-react';
import { getMailProviderStatus, type MailProviderStatus } from '../../lib/mailerClient';
import { formatMailCreditsUsd, getMailCreditWallet, DEFAULT_MAIL_COST_CENTS } from '../../data/mailCreditsRepo';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_ERROR,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';

/**
 * Live Finely Mail readiness: testmode warning, optional provider balance, local budget.
 */
export function MailProviderStatusBanner({
  compact,
  autoLoad = true,
  letterCount = 1,
}: {
  compact?: boolean;
  autoLoad?: boolean;
  letterCount?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<MailProviderStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const local = getMailCreditWallet();
  const estCents = (status?.estimatedCostUsd ?? DEFAULT_MAIL_COST_CENTS / 100) * 100 * Math.max(1, letterCount);
  const estLabel = formatMailCreditsUsd(Math.round(estCents));

  const load = async () => {
    setBusy(true);
    setErr(null);
    try {
      const s = await getMailProviderStatus();
      setStatus(s);
      if (!s.ok) setErr(s.error || s.message || 'Mail provider not ready');
    } catch (e: unknown) {
      setStatus(null);
      setErr((e as Error)?.message || 'Could not check mail status');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoLoad) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  return (
    <div className="space-y-2">
      {status?.testMode ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="TEST MODE — LetterStream / Finely Mail is in test or debug mode. Do not treat sends as live USPS production until test mode is turned off in the mail account (and MAIL_TEST_MODE / MAIL_DEBUG edge secrets)."
        />
      ) : status?.ok ? (
        <FinelyOsAlertBanner
          tone="success"
          message="LIVE production mail — Finely Mail is connected for real USPS letter submission."
        />
      ) : null}

      <div
        className={`rounded-xl border px-3 py-3 space-y-2 ${
          err ? 'border-rose-400/35 bg-rose-500/10' : 'border-white/10 bg-black/30'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-amber-200/80 inline-flex items-center gap-1.5">
              <Wallet size={12} /> {FINELY_MAIL_COPY.serviceName} status
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>
              Est. cost for {Math.max(1, letterCount)} letter{letterCount === 1 ? '' : 's'}:{' '}
              <span className="text-white/90 font-semibold">{estLabel}</span>
              {status?.balanceUsd != null ? (
                <>
                  {' '}
                  · Provider prepaid ≈{' '}
                  <span className="text-emerald-200 font-semibold">
                    {status.balanceUsd.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
                  </span>
                </>
              ) : (
                <span className="text-white/45"> · Provider balance not returned by API (use prepaid dashboard)</span>
              )}
              {' '}
              · Internal budget {formatMailCreditsUsd(local.balanceCents)}
            </p>
          </div>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => void load()}>
            <RefreshCcw size={12} /> {busy ? 'Checking…' : 'Refresh'}
          </button>
        </div>

        {status && !compact ? (
          <div
            className={
              status.ok
                ? status.testMode
                  ? FINELY_OS_NOTICE_WARN
                  : FINELY_OS_NOTICE_SUCCESS
                : FINELY_OS_NOTICE_ERROR
            }
          >
            {status.ok ? 'Connected' : 'Not ready'}
            {status.message ? ` — ${status.message}` : ''}
            {status.code != null ? ` (code ${status.code})` : ''}
            {status.debugLevel ? ` · debug=${status.debugLevel}` : ''}
          </div>
        ) : null}

        {err && !status?.ok ? (
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs text-rose-100 inline-flex items-start gap-1.5`}>
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err}
          </p>
        ) : null}
      </div>
    </div>
  );
}
