import React, { useState } from 'react';
import { BarChart3, Download, ExternalLink, Mail, MessageSquareText, Sparkles, Trash2 } from 'lucide-react';
import type { CreditAnalysisReportRecord } from '../../domain/creditAnalysisReports';
import type { Partner } from '../../domain/partners';
import type { CreditReportRecord } from '../../domain/creditReports';
import {
  downloadCreditAnalysisPdf,
  openCreditAnalysisPdf,
} from '../../lib/creditAnalysisDocumentActions';
import { deliverCreditAnalysisReport } from '../../lib/creditAnalysisDelivery';
import { shareCreditAnalysisReportToChat } from '../../lib/creditAnalysisChatSharing';
import { formatCreditAnalysisCardSubtitle } from '../../lib/creditAnalysisReportNaming';
import { archiveCreditAnalysisReport, deleteCreditAnalysisReport } from '../../data/creditAnalysisReportsRepo';
import { openCommunicationHub } from '../chat/communicationHubModel';
import { creditAnalysisEngineOption } from '../../lib/creditAnalysisEngineOptions';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
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
  const [busy, setBusy] = useState<'open' | 'download' | 'send' | 'chat' | 'delete' | null>(null);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [deletePhrase, setDeletePhrase] = useState('');

  const subtitle = formatCreditAnalysisCardSubtitle({
    pages: item.pages,
    createdAt: item.createdAt,
    sourceReportFilename: item.sourceReportFilename,
  });

  const isPremiumEngine = item.engine === 'structured_premium' || item.engine === 'premium_spreads';
  const isLegacyReport =
    item.engine === 'paginated_text' ||
    (item.engine === 'premium_spreads' && typeof item.pages === 'number' && item.pages <= 10);

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
    if (deleteStep === 'idle') {
      setDeleteStep('confirm');
      setDeletePhrase('');
      return;
    }
    const need = actorRole === 'admin' ? 'DELETE' : 'ARCHIVE';
    if (deletePhrase.trim().toUpperCase() !== need) {
      setErr(`Type ${need} to confirm.`);
      return;
    }
    setBusy('delete');
    setErr(null);
    try {
      if (actorRole === 'admin') deleteCreditAnalysisReport(item.id);
      else archiveCreditAnalysisReport(item.id);
      setNotice(actorRole === 'admin' ? 'Report deleted.' : 'Report archived and removed from vault.');
      setDeleteStep('idle');
      onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  const shareToChat = () => {
    if (!partner) {
      setErr('Partner context required to share in chat.');
      return;
    }
    setErr(null);
    setNotice(null);
    setBusy('chat');
    try {
      const res = shareCreditAnalysisReportToChat({
        partner,
        analysis: item,
        actorEmail,
        actorRole,
      });
      setNotice('Posted to Team chat with the report vault link.');
      openCommunicationHub({
        tab: 'team',
        threadId: res.threadId,
        topic: 'disputes',
        expanded: true,
        partnerId: partner.id,
        partnerDisplayName: partner.profile.fullName,
        lane: partner.lane,
      });
      onChanged?.();
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not share in chat.');
    } finally {
      setBusy(null);
    }
  };

  const engineMeta = creditAnalysisEngineOption(item.engine);
  const engineLabel = engineMeta.shortLabel;

  return (
    <div
      className={`${finelyOsCatalogCardCompact('amber')} ${
        compact ? 'max-w-[320px]' : 'max-w-[380px]'
      } shrink-0 snap-start !p-3 ring-1 ring-inset ring-amber-400/20`}
      data-fc-accent="amber"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/35 bg-gradient-to-br from-emerald-500/25 via-amber-400/20 to-fuchsia-500/20 shadow-[0_0_24px_rgba(251,191,36,0.18)]">
          <BarChart3 size={16} className="text-amber-100" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="inline-flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-amber-200/90">
            <Sparkles size={10} /> Strategy report
            {isPremiumEngine ? (
              <span className="rounded-md border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[8px] text-emerald-100">
                {engineLabel}
              </span>
            ) : (
              <span className="rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 text-[8px] text-white/60">
                {engineLabel}
              </span>
            )}
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-sm leading-snug line-clamp-2`}>{item.title}</div>
          {subtitle ? (
            <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case text-[10px] opacity-80 line-clamp-1`}>
              {subtitle}
            </div>
          ) : null}
          <p className={`mt-1 text-[10px] line-clamp-2 ${FINELY_OS_ENTITY_BODY}`}>{engineMeta.summary}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
            {typeof item.pages === 'number' ? (
              <span className="rounded-md border border-white/10 bg-black/25 px-1.5 py-0.5 text-white/70">
                {item.pages} pages
              </span>
            ) : null}
            {item.sentAt ? (
              <span className="text-emerald-200/90">
                Sent {new Date(item.sentAt).toLocaleDateString()}
                {item.sentByEmail ? ` · ${item.sentByEmail}` : ''}
              </span>
            ) : (
              <span className="text-amber-200/80">Not yet delivered</span>
            )}
          </div>
          {isLegacyReport ? (
            <div className="mt-2 rounded-lg border border-amber-400/35 bg-amber-500/15 px-2 py-1.5 text-[10px] leading-snug text-amber-100">
              Legacy layout — regenerate with Structured premium for the full partner dossier (tradelines + roadmap).
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
        {partner ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={shareToChat}
            className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px] !border-fuchsia-400/30 !text-fuchsia-100`}
          >
            <MessageSquareText size={12} /> {busy === 'chat' ? 'Posting…' : 'Share in chat'}
          </button>
        ) : null}
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void remove()}
          className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px] !border-rose-400/25 !text-rose-200`}
        >
          <Trash2 size={12} />{' '}
          {busy === 'delete' ? '…' : deleteStep === 'confirm' ? (actorRole === 'admin' ? 'Confirm delete' : 'Confirm archive') : actorRole === 'admin' ? 'Delete' : 'Archive'}
        </button>
        {deleteStep === 'confirm' ? (
          <button
            type="button"
            className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[10px]`}
            onClick={() => {
              setDeleteStep('idle');
              setDeletePhrase('');
            }}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {deleteStep === 'confirm' ? (
        <div className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/10 px-2 py-2 space-y-1.5">
          <p className="text-[10px] text-rose-100/90">
            {actorRole === 'admin'
              ? 'Hard delete — type DELETE to confirm. Also removes linked evidence rows so the report cannot reappear.'
              : 'Archive — type ARCHIVE to remove from your vault (2-step safety).'}
          </p>
          <input
            value={deletePhrase}
            onChange={(e) => setDeletePhrase(e.target.value)}
            placeholder={actorRole === 'admin' ? 'Type DELETE' : 'Type ARCHIVE'}
            className="w-full rounded-md border border-white/15 bg-black/35 px-2 py-1.5 text-xs text-white"
          />
        </div>
      ) : null}

      <p className="mt-2 text-[9px] leading-snug text-white/35">
        Results vary · not legal advice · funding subject to underwriting
      </p>

      {notice ? <div className="mt-1.5 text-[11px] text-emerald-200/90">{notice}</div> : null}
      {err ? <div className="mt-1.5 text-[11px] text-rose-200/90">{err}</div> : null}
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
      <div className={`${finelyOsCatalogCardCompact('amber')} !p-4 text-sm text-white/55`} data-fc-accent="amber">
        {emptyHint ??
          'No strategy reports yet — generate one from the Analysis tab after uploading a credit report. Results vary · not legal advice.'}
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
