import React, { useMemo, useState } from 'react';
import { Mail, PlusCircle, Wallet } from 'lucide-react';
import {
  formatMailCreditsUsd,
  getMailCreditWallet,
  replenishMailCredits,
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

export function MailCreditsPanel({ actorEmail, compact = false }: { actorEmail?: string; compact?: boolean }) {
  const [version, setVersion] = useState(0);
  const [customUsd, setCustomUsd] = useState('50');
  const [notice, setNotice] = useState<string | null>(null);

  const wallet = useMemo(() => {
    void version;
    return getMailCreditWallet();
  }, [version]);

  const addFunds = (cents: number, label: string) => {
    replenishMailCredits({ amountCents: cents, note: label, actorEmail });
    setNotice(`Added ${formatMailCreditsUsd(cents)} — new balance ${formatMailCreditsUsd(wallet.balanceCents + cents)}`);
    setVersion((v) => v + 1);
  };

  return (
    <div className={`${finelyOsCatalogCard('amber')} !p-5 md:!p-6 space-y-4 ${compact ? '' : 'w-full'}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-300">
            <Wallet size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Mailing balance</span>
          </div>
          <div className={`mt-2 text-3xl font-light ${FINELY_OS_ENTITY_VALUE}`}>{formatMailCreditsUsd(wallet.balanceCents)}</div>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
            Each certified color letter costs about {formatMailCreditsUsd(wallet.costPerLetterCents || DEFAULT_MAIL_COST_CENTS)} ({FINELY_MAIL_COPY.creditsEstimate}). Replenish before mailing dispute packets.
          </p>
        </div>
        <div className={`text-right ${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case`}>
          {Math.floor(wallet.balanceCents / (wallet.costPerLetterCents || DEFAULT_MAIL_COST_CENTS))} sends est.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((c) => (
          <button key={c} type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => addFunds(c, `Replenish ${formatMailCreditsUsd(c)}`)}>
            <PlusCircle size={14} /> {formatMailCreditsUsd(c)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className={FINELY_OS_ENTITY_SUBLABEL}>Custom amount (USD)</label>
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
          <Mail size={14} /> Add funds
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
