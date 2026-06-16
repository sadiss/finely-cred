import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  Upload,
} from 'lucide-react';
import {
  attachLeadMagnetDisputeReport,
  createLeadMagnetCollectionDispute,
  getLeadMagnetDisputeByLead,
  leadMagnetDisputeProgress,
  markLeadMagnetDisputeLetterReady,
  markLeadMagnetDisputeSent,
  type LeadMagnetDispute,
} from '../../lib/leadMagnetDispute';
import { FINELY_OS_ENTITY_INPUT } from '../../features/os/finelyOsLightUi';
import { HEAD_OF_SOCIETY_NAME, HEAD_OF_SOCIETY_PATH } from '../../config/hetaSocietyProgram';

type Props = {
  leadId: string;
  email: string;
  className?: string;
  onChange?: (dispute: LeadMagnetDispute | null) => void;
};

const BUREAUS = [
  { id: 'equifax' as const, label: 'Equifax' },
  { id: 'experian' as const, label: 'Experian' },
  { id: 'transunion' as const, label: 'TransUnion' },
];

export function FunnelCollectionDisputePanel({ leadId, email, className = '', onChange }: Props) {
  const [dispute, setDispute] = useState<LeadMagnetDispute | null>(() => getLeadMagnetDisputeByLead(leadId));
  const [collectorName, setCollectorName] = useState('');
  const [accountLast4, setAccountLast4] = useState('');
  const [balance, setBalance] = useState('');
  const [bureau, setBureau] = useState<LeadMagnetDispute['bureau']>('equifax');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const d = getLeadMagnetDisputeByLead(leadId);
    setDispute(d);
    onChange?.(d);
  }, [leadId, onChange]);

  const progress = useMemo(() => (dispute ? leadMagnetDisputeProgress(dispute) : null), [dispute]);

  const refresh = (d: LeadMagnetDispute | null) => {
    setDispute(d);
    onChange?.(d);
  };

  const startDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!collectorName.trim()) return setErr('Enter the collection company or account name.');
    setBusy(true);
    try {
      const created = createLeadMagnetCollectionDispute({
        leadId,
        email,
        collectorName,
        bureau,
        accountLast4,
        balance,
      });
      refresh(created);
    } finally {
      setBusy(false);
    }
  };

  const onReportFile = (file: File | null) => {
    if (!file || !dispute) return;
    setBusy(true);
    try {
      const next = attachLeadMagnetDisputeReport({ leadId, fileName: file.name });
      refresh(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      id="fg-dispute-track"
      className={`scroll-mt-24 rounded-[1.65rem] border border-emerald-400/25 bg-emerald-500/[0.08] p-4 sm:p-6 ${className}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Included with your free kit</p>
          <h3 className="mt-1 text-xl font-black text-white sm:text-2xl">Dispute 1 collection — free</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          Start one collection dispute, upload your report, send round one, and track the bureau response window here.
          Need more slots?{' '}
          <a href={HEAD_OF_SOCIETY_PATH} className="font-semibold text-emerald-300 underline-offset-2 hover:underline">
            Join {HEAD_OF_SOCIETY_NAME} (HOS)
          </a>{' '}
          for up to 5 tracked items.
        </p>
        </div>
        {progress ? (
          <div className="shrink-0 rounded-2xl border border-emerald-400/30 bg-black/25 px-4 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Progress</p>
            <p className="text-2xl font-black text-white">
              {progress.step}/{progress.total}
            </p>
          </div>
        ) : null}
      </div>

      {!dispute ? (
        <form onSubmit={startDispute} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Which collection are you disputing first?</p>
          <input
            value={collectorName}
            onChange={(e) => setCollectorName(e.target.value)}
            placeholder="Collection company or account name"
            className={FINELY_OS_ENTITY_INPUT}
            required
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={accountLast4}
              onChange={(e) => setAccountLast4(e.target.value)}
              placeholder="Last 4 of account (optional)"
              className={FINELY_OS_ENTITY_INPUT}
              maxLength={4}
            />
            <input
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="Balance shown (optional)"
              className={FINELY_OS_ENTITY_INPUT}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BUREAUS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBureau(b.id)}
                className={`rounded-xl border px-2 py-2.5 text-[10px] font-black uppercase tracking-wider transition ${
                  bureau === b.id
                    ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100'
                    : 'border-white/[0.1] bg-white/[0.04] text-white/55 hover:text-white'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
          {err ? <p className="text-sm text-rose-300">{err}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full fg-cta-primary rounded-xl py-3.5 text-sm font-black uppercase tracking-wider disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start my free collection dispute'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.1] bg-black/25 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Your file</p>
            <p className="mt-1 text-lg font-black text-white">{dispute.collectorName}</p>
            <p className="mt-1 text-sm text-white/55">
              {dispute.bureau.charAt(0).toUpperCase() + dispute.bureau.slice(1)}
              {dispute.accountLast4 ? ` • •••• ${dispute.accountLast4}` : ''}
              {dispute.balance ? ` • ${dispute.balance}` : ''}
            </p>
            {progress ? (
              <p className="mt-3 flex items-start gap-2 text-sm text-emerald-100/90">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                {progress.nextAction}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:border-emerald-300/35">
              <Upload className="h-4 w-4" />
              {dispute.reportFileName ? 'Replace report' : 'Upload credit report'}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.html,.htm"
                className="sr-only"
                onChange={(e) => onReportFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              disabled={busy || dispute.status !== 'report_uploaded' && dispute.status !== 'intake'}
              onClick={() => refresh(markLeadMagnetDisputeLetterReady(leadId))}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/80 hover:border-emerald-300/35 disabled:opacity-40"
            >
              <FileText className="h-4 w-4" /> Letter ready
            </button>
            <button
              type="button"
              disabled={busy || !['letter_ready', 'report_uploaded'].includes(dispute.status)}
              onClick={() => refresh(markLeadMagnetDisputeSent(leadId))}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-3 text-xs font-bold uppercase tracking-wider text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-40 sm:col-span-2"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Mark dispute sent — start 30-day clock
            </button>
          </div>

          {dispute.reportFileName ? (
            <p className="text-xs text-white/50">
              Report on file: <span className="font-semibold text-white/75">{dispute.reportFileName}</span>
            </p>
          ) : null}

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Timeline</p>
            <div className="space-y-2">
              {[...dispute.timeline].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{entry.label}</p>
                    {entry.note ? <p className="text-xs text-white/55">{entry.note}</p> : null}
                    <p className="mt-0.5 text-[10px] text-white/40">
                      {new Date(entry.at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
