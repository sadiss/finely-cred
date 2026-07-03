import React, { useState } from 'react';
import { BarChart3, Download, ExternalLink, Mail, Sparkles, Trash2 } from 'lucide-react';
import type { CreditAnalysisReportRecord } from '../../domain/creditAnalysisReports';
import type { Partner } from '../../domain/partners';
import type { CreditReportRecord } from '../../domain/creditReports';
import {
  downloadCreditAnalysisPdf,
  openCreditAnalysisPdf,
} from '../../lib/creditAnalysisDocumentActions';
import { deliverCreditAnalysisReport } from '../../lib/creditAnalysisDelivery';
import { formatCreditAnalysisCardSubtitle } from '../../lib/creditAnalysisReportNaming';
import { deleteCreditAnalysisReport } from '../../data/creditAnalysisReportsRepo';
import {
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

export function CreditAnalysisDeliverableCard({
  item,
  compact = false,
  partner,
  creditReport,
  actorEmail,
  actorRole = 'admin',
  onChanged,
}: {
  item: CreditAnalysisReportRecord;
  compact?: boolean;
  partner?: Partner;
  creditReport?: CreditReportRecord | null;
  actorEmail?: string;
  actorRole?: 'admin' | 'partner' | 'credit_specialist';
  onChanged?: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<'open' | 'download' | 'send' | 'delete' | null>(null);

  const subtitle = formatCreditAnalysisCardSubtitle({
    pages: item.pages,
    createdAt: item.createdAt,
    sourceReportFilename: item.sourceReportFilename,
  });

  const isLegacyReport = item.engine !== 'premium_spreads' || (typeof item.pages === 'number' && item.pages < 10);

  const run = async (mode: 'open' | 'download') => {
    setErr(null);
    setBusy(mode);
    try {
      const fn = mode === 'open' ? openCreditAnalysisPdf : downloadCreditAnalysisPdf;
      const res = await fn({ blobRef: item.blobRef, filename: item.filename });
      if (!res.ok) setErr(res.message);
    } finally {
      setBusy(null);
    }
  };

  const sendToPartner = async () => {
    if (!partner) {
      setErr('Partner context required to send.');
      return;
    }
    setErr(null);
    setNotice(null);
    setBusy('send');
    try {
      const res = await deliverCreditAnalysisReport({
        partner,
        analysis: item,
        creditReport,
        actorEmail,
        actorRole,
      });
      setNotice(
        res.sent
          ? 'Delivered — partner emailed and report marked sent.'
          : `Saved to partner vault${res.reason ? ` (email: ${res.reason})` : ''}.`,
      );
      onChanged?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Send failed.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this strategy report? This cannot be undone.')) return;
    setBusy('delete');
    try {
      deleteCreditAnalysisReport(item.id);
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-indigo-300/30 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 ${
        compact ? 'px-3 py-3 max-w-[300px]' : 'px-4 py-4 max-w-[360px]'
      } shrink-0 snap-start shadow-[0_12px_32px_-16px_rgba(67,56,202,0.65)] ring-1 ring-inset ring-indigo-400/15`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center shadow-lg">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-200/90">
            <Sparkles size={10} /> Strategy analytics
            {item.engine === 'premium_spreads' ? ' · Premium spreads' : ''}
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-sm leading-snug line-clamp-2`}>{item.title}</div>
          {subtitle ? (
            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case text-[10px] opacity-80 line-clamp-1`}>{subtitle}</div>
          ) : null}
          {item.sentAt ? (
            <div className="mt-1 text-[10px] text-emerald-200/90">
              Sent {new Date(item.sentAt).toLocaleDateString()}
              {item.sentByEmail ? ` · ${item.sentByEmail}` : ''}
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-amber-200/80">Not yet delivered to partner</div>
          )}
          {isLegacyReport ? (
            <div className="mt-2 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-1.5 text-[10px] leading-snug text-amber-100">
              Legacy text layout — delete this report and tap <strong>Generate PDF</strong> on Reports to get the premium 10-spread design from your zip package.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('open')}
          className={`${FINELY_OS_PRIMARY_BTN} !py-1.5 !px-3 !text-[10px]`}
        >
          <ExternalLink size={12} /> {busy === 'open' ? 'Opening…' : 'Open'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('download')}
          className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px]`}
        >
          <Download size={12} /> {busy === 'download' ? 'Saving…' : 'Download'}
        </button>
        {partner ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void sendToPartner()}
            className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px] !border-emerald-400/30 !text-emerald-100`}
          >
            <Mail size={12} /> {busy === 'send' ? 'Sending…' : item.sentAt ? 'Resend' : 'Send to partner'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void remove()}
          className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px] !border-rose-400/25 !text-rose-200`}
        >
          <Trash2 size={12} /> {busy === 'delete' ? '…' : 'Delete'}
        </button>
      </div>

      {notice ? <div className="mt-2 text-[11px] text-emerald-200/90">{notice}</div> : null}
      {err ? <div className="mt-2 text-[11px] text-rose-200/90">{err}</div> : null}
    </div>
  );
}

export function CreditAnalysisDeliverableStrip({
  items,
  emptyHint,
  partner,
  creditReport,
  actorEmail,
  actorRole,
  onChanged,
}: {
  items: CreditAnalysisReportRecord[];
  emptyHint?: string;
  partner?: Partner;
  creditReport?: CreditReportRecord | null;
  actorEmail?: string;
  actorRole?: 'admin' | 'partner' | 'credit_specialist';
  onChanged?: () => void;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/55">
        {emptyHint ?? 'No strategy reports yet — generate one from the Analysis tab after uploading a credit report.'}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
      {items.map((item) => (
        <CreditAnalysisDeliverableCard
          key={item.id}
          item={item}
          compact
          partner={partner}
          creditReport={creditReport}
          actorEmail={actorEmail}
          actorRole={actorRole}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
