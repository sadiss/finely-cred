import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Mail, PlusCircle, RefreshCcw, Wallet } from 'lucide-react';
import { getMailProviderStatus } from '../../lib/mailerClient';
import {
  formatMailCreditsUsd,
  getMailCreditWallet,
  maxReplenishCents,
  replenishMailCredits,
  syncProviderMailBalance,
  DEFAULT_MAIL_COST_CENTS,
} from '../../data/mailCreditsRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';

const PRESET_AMOUNTS = [2500, 5000, 10000, 25000];
const LETTERSTREAM_PREPAID_URL = 'https://www.letterstream.com/';

export function MailCreditsPanel({ actorEmail, compact = false }: { actorEmail?: string; compact?: boolean }) {
  const [version, setVersion] = useState(0);
  const [customUsd, setCustomUsd] = useState('50');
  const [notice, setNotice] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  const wallet = useMemo(() => {
    void version;
    return getMailCreditWallet();
  }, [version]);

  const maxReplenish = maxReplenishCents();
  const providerKnown = wallet.providerBalanceCents != null;
  const varianceCents =
    providerKnown && wallet.balanceCents > (wallet.providerBalanceCents ?? 0)
      ? wallet.balanceCents - (wallet.providerBalanceCents ?? 0)
      : 0;

  const refreshProviderBalance = async () => {
    setSyncBusy(true);
    try {
      const status = await getMailProviderStatus();
      syncProviderMailBalance({ balanceUsd: status.balanceUsd });
      setVersion((v) => v + 1);
      if (status.balanceUsd != null) {
        setNotice(`LetterStream prepaid synced: ${formatMailCreditsUsd(Math.round(status.balanceUsd * 100))}`);
      } else if (status.ok) {
        setNotice('Connected — prepaid balance not exposed by API. Fund LetterStream, then sync ledger below.');
      } else {
        setNotice(status.error || status.message || 'Could not reach mail provider.');
      }
    } catch (e: unknown) {
      setNotice((e as Error)?.message || 'Provider sync failed');
    } finally {
      setSyncBusy(false);
    }
  };

  useEffect(() => {
    void refreshProviderBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFunds = (cents: number, label: string, force = false) => {
    const result = replenishMailCredits({ amountCents: cents, note: label, actorEmail, force });
    let msg = `Added ${formatMailCreditsUsd(result.wallet.balanceCents - wallet.balanceCents)} — ledger ${formatMailCreditsUsd(result.wallet.balanceCents)}`;
    if (result.capped && result.varianceCents) {
      msg += `. Capped to LetterStream prepaid — fund ${formatMailCreditsUsd(result.varianceCents)} more at LetterStream first.`;
    }
    setNotice(msg);
    setVersion((v) => v + 1);
  };

  return (
    <div className={`${finelyOsCatalogCard('amber')} !p-4 md:!p-5 space-y-4 ${compact ? '' : 'w-full'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300">
            <Wallet size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Mailing ledger</span>
          </div>
          <div className={`mt-2 text-3xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{formatMailCreditsUsd(wallet.balanceCents)}</div>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
            Operational send budget ({FINELY_MAIL_COPY.creditsEstimate}). Actual USPS postage is billed from your LetterStream prepaid account.
          </p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={syncBusy} onClick={() => void refreshProviderBalance()}>
          <RefreshCcw size={12} /> {syncBusy ? 'Syncing…' : 'Sync LetterStream'}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>LetterStream prepaid</div>
          <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
            {providerKnown ? formatMailCreditsUsd(wallet.providerBalanceCents ?? 0) : '—'}
          </div>
          <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Source of truth for USPS postage</div>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Internal ledger</div>
          <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{formatMailCreditsUsd(wallet.balanceCents)}</div>
          <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
            ~{Math.floor(wallet.balanceCents / (wallet.costPerLetterCents || DEFAULT_MAIL_COST_CENTS))} sends at{' '}
            {formatMailCreditsUsd(wallet.costPerLetterCents || DEFAULT_MAIL_COST_CENTS)}
          </div>
        </div>
        <div className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2.5">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Available to allocate</div>
          <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
            {maxReplenish != null ? formatMailCreditsUsd(maxReplenish) : '—'}
          </div>
          <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
            {varianceCents > 0
              ? `Ledger exceeds prepaid by ${formatMailCreditsUsd(varianceCents)} — fund LetterStream`
              : 'Sync after adding funds at LetterStream'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <a
          href={LETTERSTREAM_PREPAID_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={FINELY_OS_SECONDARY_BTN}
        >
          <ExternalLink size={12} /> Fund LetterStream prepaid
        </a>
        <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Add postage at LetterStream first, then sync and allocate to the internal ledger.
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((c) => {
          const disabled = maxReplenish != null && c > maxReplenish && maxReplenish === 0;
          return (
            <button
              key={c}
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              disabled={disabled}
              title={disabled ? 'No prepaid headroom — fund LetterStream first' : undefined}
              onClick={() => addFunds(c, `Replenish ${formatMailCreditsUsd(c)}`)}
            >
              <PlusCircle size={14} /> {formatMailCreditsUsd(c)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Allocate from prepaid (USD)</label>
          <input
            value={customUsd}
            onChange={(e) => setCustomUsd(e.target.value)}
            className={`mt-1 ${FINELY_OS_ENTITY_INPUT}`}
            inputMode="decimal"
            placeholder="50"
          />
        </div>
        <button
          type="button"
          className={FINELY_OS_PRIMARY_BTN}
          onClick={() => {
            const n = Number(String(customUsd).replace(/[^0-9.]/g, ''));
            if (!Number.isFinite(n) || n <= 0) {
              setNotice('Enter a valid dollar amount.');
              return;
            }
            addFunds(Math.round(n * 100), `Replenish ${formatMailCreditsUsd(Math.round(n * 100))}`);
          }}
        >
          <Mail size={14} /> Allocate to ledger
        </button>
      </div>

      {notice ? <p className={`${FINELY_OS_ENTITY_BODY} text-sm text-emerald-200/90`}>{notice}</p> : null}

      {!compact && wallet.transactions.length ? (
        <div className="pt-2 border-t border-white/[0.08] space-y-2 max-h-48 overflow-y-auto">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Recent transactions</div>
          {wallet.transactions.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
              <span className={`${FINELY_OS_ENTITY_BODY} capitalize`}>{t.type}{t.note ? ` — ${t.note}` : ''}</span>
              <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{formatMailCreditsUsd(Math.abs(t.amountCents))}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
