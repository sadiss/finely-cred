import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Mail,
  Plus,
  Upload,
} from 'lucide-react';
import {
  attachHetaSocietyDisputeReport,
  createHetaSocietyDispute,
  hetaDisputeSlotsRemaining,
  hetaDisputeSlotsUsed,
  listHetaSocietyDisputes,
  markHetaDisputeLetterReady,
  markHetaDisputeSent,
} from '../../lib/hetaSocietyDisputes';
import { leadMagnetDisputeProgress } from '../../lib/leadMagnetDispute';
import { HETA_SOCIETY_DISPUTE_LIMIT, HEAD_OF_SOCIETY_NAME } from '../../config/hetaSocietyProgram';
import { FINELY_OS_ENTITY_INPUT } from '../../features/os/finelyOsLightUi';
import type { LeadMagnetDispute } from '../../lib/leadMagnetDispute';

const BUREAUS = [
  { id: 'equifax' as const, label: 'Equifax' },
  { id: 'experian' as const, label: 'Experian' },
  { id: 'transunion' as const, label: 'TransUnion' },
];

type Props = {
  ownerKey: string;
  email: string;
  title?: string;
  className?: string;
};

export function HetaSocietyDisputeTracker({ ownerKey, email, title, className = '' }: Props) {
  const [disputes, setDisputes] = useState<LeadMagnetDispute[]>(() => listHetaSocietyDisputes(ownerKey));
  const [expandedId, setExpandedId] = useState<string | null>(disputes[0]?.id ?? null);
  const [showNew, setShowNew] = useState(disputes.length === 0);
  const [collectorName, setCollectorName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [bureau, setBureau] = useState<LeadMagnetDispute['bureau']>('equifax');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slotsUsed = hetaDisputeSlotsUsed(ownerKey);
  const slotsLeft = hetaDisputeSlotsRemaining(ownerKey);

  const refresh = () => setDisputes(listHetaSocietyDisputes(ownerKey));

  const startDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!collectorName.trim()) return setErr('Enter the collection or negative item name.');
    setBusy(true);
    try {
      createHetaSocietyDispute({
        ownerKey,
        email,
        collectorName,
        bureau,
        accountLast4,
        balance,
      });
      setCollectorName('');
      setAccountLast4('');
      setBalance('');
      setShowNew(false);
      refresh();
    } catch (ex: unknown) {
      setErr((ex as Error)?.message ?? 'Could not start dispute.');
    } finally {
      setBusy(false);
    }
  };

  const activeDispute = useMemo(
    () => disputes.find((d) => d.id === expandedId) ?? null,
    [disputes, expandedId],
  );
  const progress = activeDispute ? leadMagnetDisputeProgress(activeDispute) : null;

  return (
    <div className={`rounded-[1.65rem] border border-amber-400/25 bg-gradient-to-br from-[#14120c]/95 via-[#0f1218]/95 to-[#0a0f14]/95 p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200">{HEAD_OF_SOCIETY_NAME} · HOS restoration file</p>
          <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">
            {title ?? 'Dispute tracker'}
          </h3>
          <p className="mt-2 text-sm text-white/60">
            Track up to {HETA_SOCIETY_DISPUTE_LIMIT} items — upload reports, send round one, and follow bureau responses.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-amber-400/30 bg-black/30 px-4 py-3 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-200">Slots</p>
          <p className="text-2xl font-black text-white">
            {slotsUsed}/{HETA_SOCIETY_DISPUTE_LIMIT}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {disputes.map((d) => {
          const open = expandedId === d.id;
          const p = leadMagnetDisputeProgress(d);
          return (
            <div key={d.id} className="overflow-hidden rounded-xl border border-white/[0.1] bg-black/25">
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : d.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{d.collectorName}</p>
                  <p className="text-xs text-white/50">
                    {d.bureau} • Step {p.step}/{p.total}
                  </p>
                </div>
                {open ? <ChevronUp className="h-4 w-4 shrink-0 text-white/50" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />}
              </button>
              {open ? (
                <div className="space-y-3 border-t border-white/[0.08] px-4 py-4">
                  {progress && expandedId === d.id ? (
                    <p className="flex items-start gap-2 text-sm text-amber-100/90">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                      {leadMagnetDisputeProgress(d).nextAction}
                    </p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                      <Upload className="h-3.5 w-3.5" />
                      {d.reportFileName ? 'Replace report' : 'Upload report'}
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.html,.htm"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          attachHetaSocietyDisputeReport({ disputeId: d.id, fileName: f.name });
                          refresh();
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        markHetaDisputeLetterReady(d.id);
                        refresh();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/80"
                    >
                      <FileText className="h-3.5 w-3.5" /> Letter ready
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markHetaDisputeSent(d.id);
                        refresh();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/15 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-amber-100 sm:col-span-2"
                    >
                      <Mail className="h-3.5 w-3.5" /> Mark sent — start 30-day clock
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {[...d.timeline].reverse().slice(0, 4).map((entry) => (
                      <div key={entry.id} className="flex gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                        <div>
                          <p className="text-xs font-semibold text-white">{entry.label}</p>
                          <p className="text-[10px] text-white/40">{new Date(entry.at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {slotsLeft > 0 ? (
        showNew ? (
          <form onSubmit={startDispute} className="mt-4 space-y-2.5 rounded-xl border border-dashed border-amber-400/30 bg-amber-500/[0.06] p-4">
            <input
              value={collectorName}
              onChange={(e) => setCollectorName(e.target.value)}
              placeholder="Collection or negative item name"
              className={FINELY_OS_ENTITY_INPUT}
              required
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={accountLast4} onChange={(e) => setAccountLast4(e.target.value)} placeholder="Last 4 (optional)" className={FINELY_OS_ENTITY_INPUT} maxLength={4} />
              <input value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Balance (optional)" className={FINELY_OS_ENTITY_INPUT} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BUREAUS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBureau(b.id)}
                  className={`rounded-lg border px-2 py-2 text-[9px] font-black uppercase tracking-wider ${
                    bureau === b.id ? 'border-amber-300/50 bg-amber-300/15 text-amber-100' : 'border-white/[0.1] text-white/50'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            {err ? <p className="text-sm text-rose-300">{err}</p> : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 py-3 text-xs font-black uppercase tracking-wider text-[#1a1400] disabled:opacity-50">
                {busy ? 'Saving…' : 'Add dispute item'}
              </button>
              {disputes.length > 0 ? (
                <button type="button" onClick={() => setShowNew(false)} className="rounded-xl border border-white/[0.12] px-4 py-3 text-xs font-bold uppercase text-white/60">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 py-3 text-xs font-black uppercase tracking-wider text-amber-100"
          >
            <Plus className="h-4 w-4" /> Add another item ({slotsLeft} left)
          </button>
        )
      ) : (
        <p className="mt-4 text-center text-xs text-white/45">All {HETA_SOCIETY_DISPUTE_LIMIT} dispute slots are in use.</p>
      )}
    </div>
  );
}
