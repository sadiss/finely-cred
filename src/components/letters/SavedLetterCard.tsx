import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Archive,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  FileText,
  Send,
  Trash2,
  Truck,
  RefreshCw,
  X,
} from 'lucide-react';
import type { LetterRecord, LetterStatus, LetterType, DisputeLetterMeta } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName } from '../../utils/bureaus';
import { LetterFullPreviewModal } from './LetterFullPreviewModal';
import { LetterBodyEditorModal } from './LetterBodyEditorModal';
import { FinelyOsTypedDeleteDialog } from '../../features/os/FinelyOsTypedDeleteDialog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
  finelyOsMicroStat,
  finelyOsStatusChip,
  type FinelyOsDeckAccent,
} from '../../features/os/finelyOsLightUi';
import { downloadLetterPdf } from '../../lib/downloadLetterPdf';
import {
  debtLetterCardFactsFromLetter,
  formatDebtLetterStatLine,
} from '../../lib/debtLetterCardFacts';
import { isLetterDraft } from '../../lib/letterDraftLifecycle';
import { isLetterPhysicallyMailed } from '../../lib/letterMailState';
import { letterVaultPrimaryStatus } from '../../lib/letterVaultStatus';
import { canRefreshLetterFromCatalog, refreshLabelForLetter } from '../../lib/rehydrateSavedLetterFromCatalog';
import '../debt/validationDebtLayout.css';

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtDate(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function vaultCardAccentClass(accent: FinelyOsDeckAccent): string {
  const map: Record<FinelyOsDeckAccent, string> = {
    emerald: 'fc-letter-vault-card--emerald',
    sky: 'fc-letter-vault-card--sky',
    violet: 'fc-letter-vault-card--violet',
    amber: 'fc-letter-vault-card--amber',
    fuchsia: 'fc-letter-vault-card--fuchsia',
    rose: 'fc-letter-vault-card--rose',
  };
  return map[accent] ?? 'fc-letter-vault-card--violet';
}

function statusToneChip(tone: ReturnType<typeof letterVaultPrimaryStatus>['tone']) {
  if (tone === 'mailed') return finelyOsStatusChip('ok');
  if (tone === 'blocked') return finelyOsStatusChip('blocked');
  if (tone === 'draft') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

function typeMeta(type: LetterType): {
  label: string;
  accent: FinelyOsDeckAccent;
  chip: string;
  seal: string;
} {
  if (type === 'dispute') {
    return {
      label: 'Dispute',
      accent: 'fuchsia',
      chip: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100',
      seal: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/35',
    };
  }
  if (type === 'validation') {
    return {
      label: 'Validation',
      accent: 'sky',
      chip: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
      seal: 'bg-sky-500/20 text-sky-200 border-sky-400/35',
    };
  }
  return {
    label: 'Affidavit',
    accent: 'rose',
    chip: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
    seal: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
  };
}

function disputeStats(letter: LetterRecord) {
  const meta = letter.meta as DisputeLetterMeta | undefined;
  if (!meta || letter.type !== 'dispute') return null;
  const items = meta.candidateIds?.length ?? 0;
  const evidence = Object.values(meta.evidenceByCandidateId ?? {}).filter(Boolean).length;
  const reasons = Object.values(meta.reasonsByCandidateId ?? {}).reduce((n, arr) => n + (arr?.filter(Boolean).length ?? 0), 0);
  return { items, evidence, reasons };
}

function workflowSteps(status: LetterStatus | string | undefined, hasPdf: boolean) {
  const s = String(status || 'generated').toLowerCase();
  return [
    { key: 'saved', label: 'Saved', done: true },
    { key: 'pdf', label: 'PDF', done: hasPdf },
    { key: 'mail', label: 'Mailed', done: s === 'mailed' || s === 'waiting_response' || s === 'completed' || s === 'mail_pending' },
    { key: 'response', label: 'Reply', done: s === 'waiting_response' || s === 'completed' },
  ];
}

export const SAVED_LETTER_DECK_ACCENTS: FinelyOsDeckAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia', 'rose'];

export type SavedLetterCardProps = {
  letter: LetterRecord;
  id?: string;
  highlighted?: boolean;
  defaultSnapshotOpen?: boolean;
  autoOpenPreview?: boolean;
  evidence?: EvidenceItem[];
  deckAccent?: FinelyOsDeckAccent;
  /** Vault strip registers draft preview opener for body-only letters. */
  onOpenLetter?: (openPreview: () => void) => (() => void) | void;
  onOpenPdf?: () => void;
  onDownload?: () => void;
  onMail?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onResumeStudio?: () => void;
  onEdit?: () => void;
  onSaved?: () => void;
  onMarkFinal?: () => void;
  onRefreshTemplate?: () => void;
  canMail?: boolean;
  mailDisabled?: boolean;
  pdfDisabled?: boolean;
};

export function SavedLetterCard({
  letter,
  id,
  highlighted = false,
  defaultSnapshotOpen = false,
  autoOpenPreview = false,
  evidence = [],
  deckAccent = 'fuchsia',
  onOpenLetter,
  onOpenPdf,
  onDownload,
  onMail,
  onArchive,
  onDelete,
  onResumeStudio,
  onEdit,
  onSaved,
  onMarkFinal,
  onRefreshTemplate,
  canMail = false,
  mailDisabled = false,
  pdfDisabled = false,
}: SavedLetterCardProps) {
  const [detailOpen, setDetailOpen] = useState(Boolean(defaultSnapshotOpen || highlighted));
  const [textOpen, setTextOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadErr, setDownloadErr] = useState<string | null>(null);
  const meta = typeMeta(letter.type);
  const hasPdf = Boolean(letter.pdfBlobRef);
  const isDraft = isLetterDraft(letter);
  const canOpenContent = hasPdf || Boolean(letter.body);
  const bureau =
    letter.meta && typeof letter.meta === 'object' && 'bureau' in letter.meta
      ? String((letter.meta as { bureau?: Bureau }).bureau || '')
      : '';
  const round =
    letter.meta && typeof letter.meta === 'object' && 'round' in letter.meta
      ? String((letter.meta as { round?: string }).round || '')
      : '';
  const priorRoundTransfer =
    letter.meta && typeof letter.meta === 'object' && 'priorRoundTransferNote' in letter.meta
      ? String((letter.meta as DisputeLetterMeta).priorRoundTransferNote || '').trim()
      : '';
  const tone =
    letter.meta && typeof letter.meta === 'object' && 'tone' in letter.meta
      ? String((letter.meta as { tone?: string }).tone || '')
      : '';
  const stats = disputeStats(letter);
  const debtFacts = debtLetterCardFactsFromLetter(letter);
  const steps = workflowSteps(letter.status, hasPdf);
  const delivery = fmtDate(letter.mailing?.expectedDeliveryDate);
  const trackingNum = (letter.mailing?.trackingNumber || '').trim();
  const delivered = fmtDate(letter.mailing?.deliveredAt);
  const vaultStatus = letterVaultPrimaryStatus(letter);
  const alreadyMailed = isLetterPhysicallyMailed(letter);
  const mailRef = (letter.mailing?.providerId || '').trim();
  const showsMailing = Boolean(letter.mailing?.to || alreadyMailed || delivery || trackingNum || delivered);

  const openViewPdf = () => {
    if (hasPdf && onOpenPdf) {
      setDetailOpen(false);
      setTextOpen(false);
      void onOpenPdf();
      return;
    }
    if (hasPdf || letter.body) {
      setDetailOpen(false);
      setTextOpen(true);
    }
  };

  const startEdit = () => {
    setDetailOpen(false);
    setTextOpen(false);
    if (onEdit) {
      onEdit();
      return;
    }
    setEditOpen(true);
  };

  const runDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!hasPdf) return;
    setDownloadBusy(true);
    setDownloadErr(null);
    const res = await downloadLetterPdf(letter);
    if (!res.ok) setDownloadErr(res.message || 'Download failed');
    setDownloadBusy(false);
  };

  useEffect(() => {
    if (autoOpenPreview && (hasPdf || letter.body)) {
      setDetailOpen(false);
      setTextOpen(true);
    }
  }, [autoOpenPreview, hasPdf, letter.body]);

  useEffect(() => {
    if (!onOpenLetter) return;
    const openPreview = () => {
      setDetailOpen(false);
      setTextOpen(true);
    };
    return onOpenLetter(openPreview) ?? undefined;
  }, [onOpenLetter, letter.id]);

  useEffect(() => {
    if (!highlighted) return;
    const t = window.setTimeout(() => setDetailOpen(true), 120);
    return () => window.clearTimeout(t);
  }, [highlighted]);

  const statLine = stats
    ? `${stats.items} items · ${stats.evidence} proof · ${stats.reasons} reasons`
    : debtFacts
      ? formatDebtLetterStatLine(debtFacts)
      : hasPdf
        ? 'PDF stored'
        : 'Draft letter';

  return (
    <>
      <div className={`group relative fc-letter-vault-card ${vaultCardAccentClass(deckAccent)} ${highlighted ? 'ring-2 ring-white/40 scale-[1.01]' : ''}`}>
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="absolute top-2 right-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/35 bg-black/60 text-red-100 opacity-0 transition-all hover:bg-red-500/20 group-hover:opacity-100 focus:opacity-100"
            aria-label="Delete letter"
            title="Delete letter"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
        <div id={id} className="fc-letter-vault-card__inner">
          <div className="min-w-0">
            <div className={`truncate text-[10px] font-black uppercase tracking-[0.14em] ${FINELY_OS_ENTITY_SUBLABEL}`}>
              {meta.label}
              {bureau ? ` · ${bureauFullName(bureau as Bureau)}` : ''}
              {round ? ` · ${round}` : ''}
            </div>
            <div className="truncate text-sm font-black leading-tight text-white/95 mt-0.5">{letter.title}</div>
            <div className={`truncate text-[9px] normal-case mt-0.5 ${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(letter.createdAt)}</div>
          </div>

          <div className="space-y-1">
            <span className={statusToneChip(vaultStatus.tone)}>{vaultStatus.label}</span>
            {vaultStatus.detail ? (
              <p className={`text-[10px] leading-snug ${FINELY_OS_ENTITY_BODY} text-white/75`}>{vaultStatus.detail}</p>
            ) : null}
            {showsMailing && (trackingNum || delivered) ? (
              <p className={`text-[9px] leading-snug ${FINELY_OS_ENTITY_BODY} text-white/60`}>
                {trackingNum ? (
                  <span className="inline-flex items-center gap-1 text-sky-100/80">
                    <Truck size={9} className="shrink-0 text-sky-300/70" />
                    {trackingNum}
                  </span>
                ) : null}
                {trackingNum && delivered ? <span className="text-white/35"> · </span> : null}
                {delivered ? (
                  <span className="inline-flex items-center gap-1 text-emerald-100/80">
                    <CheckCircle2 size={9} className="shrink-0 text-emerald-300/70" />
                    Delivered {delivered}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          <p className={`text-[10px] leading-snug line-clamp-2 ${FINELY_OS_ENTITY_BODY} text-white/80`}>{statLine}</p>
          {priorRoundTransfer ? (
            <p className={`text-[10px] leading-snug line-clamp-2 ${FINELY_OS_ENTITY_BODY} text-sky-100/85`}>
              Carried-forward findings from prior round
            </p>
          ) : null}

          <div className="fc-letter-vault-card__actions">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/90 hover:bg-white/16"
            >
              <Eye size={11} /> Open letter
            </button>
            {hasPdf ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void runDownload();
                }}
                disabled={downloadBusy}
                className="inline-flex items-center gap-1 rounded-md border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/90 hover:bg-white/16 disabled:opacity-50"
              >
                <Download size={11} /> {downloadBusy ? '…' : 'Download'}
              </button>
            ) : null}
            {canMail && onMail && !alreadyMailed && hasPdf ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMail();
                }}
                disabled={mailDisabled}
                className="inline-flex items-center gap-1 rounded-md border border-violet-400/45 bg-violet-600 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white hover:bg-violet-500 disabled:opacity-50"
              >
                <Send size={11} /> Mail
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {detailOpen
        ? createPortal(
        <div className="fixed inset-0 z-[8000] isolate flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setDetailOpen(false)} />
          <div
            className={`relative z-[1] w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-fuchsia-400/20 bg-[#080c12] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] ${
              highlighted ? 'ring-2 ring-fuchsia-300/25' : ''
            }`}
          >
            <div className="border-b border-white/10 px-4 py-4 sm:px-5 bg-[radial-gradient(900px_360px_at_5%_0%,rgba(217,70,239,0.18),transparent_60%),linear-gradient(180deg,#120a18_0%,#080c12_100%)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={finelyOsMicroStat(meta.accent)}>{meta.label}</span>
                    {isDraft ? (
                      <span className="rounded-md border-2 border-amber-400/70 bg-amber-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-50">
                        DRAFT
                      </span>
                    ) : (
                      <span className="rounded-md border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-100">
                        FINAL
                      </span>
                    )}
                    <span className={statusToneChip(vaultStatus.tone)}>{vaultStatus.label}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-black leading-tight text-white/95">{letter.title}</h3>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    {fmtWhen(letter.createdAt)}
                    {bureau ? ` · ${bureauFullName(bureau as Bureau)}` : ''}
                    {round ? ` · ${round}` : ''}
                    {tone ? ` · ${tone}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setDetailOpen(false)} className={`${FINELY_OS_SECONDARY_BTN} !py-2`}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(debtFacts
                  ? [
                      { label: 'PDF', value: hasPdf ? 'Ready' : '—' },
                      {
                        label: 'Principle',
                        value: debtFacts.keyPrinciple || '—',
                      },
                      {
                        label: 'When',
                        value: debtFacts.whenToUse[0] || '—',
                      },
                      {
                        label: 'Laws',
                        value: debtFacts.laws.length ? debtFacts.laws.slice(0, 2).join(' · ') : '—',
                      },
                    ]
                  : [
                      { label: 'PDF', value: hasPdf ? 'Ready' : '—' },
                      { label: 'Items', value: stats?.items ?? '—' },
                      { label: 'Proof', value: stats?.evidence ?? '—' },
                      { label: 'Reasons', value: stats?.reasons ?? '—' },
                    ]
                ).map((kpi, i) => (
                  <div key={kpi.label} className={`${finelyOsDeckTile(['fuchsia', 'sky', 'emerald', 'amber'][i] as FinelyOsDeckAccent)} !min-h-0 p-3`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{kpi.label}</div>
                    <div className={`mt-1 text-lg font-black ${FINELY_OS_ENTITY_VALUE}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {steps.map((step) => (
                  <div key={step.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 text-center">
                    <div className="flex justify-center">
                      {step.done ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Circle size={13} className="text-white/25" />}
                    </div>
                    <div className={`mt-1 text-[8px] font-black uppercase tracking-widest ${step.done ? 'text-emerald-200/90' : 'text-white/35'}`}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>

              {canOpenContent ? (
                <button
                  type="button"
                  onClick={openViewPdf}
                  className={`${finelyOsDeckTile('fuchsia')} w-full !min-h-0 p-4 text-left hover:brightness-105`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-11 w-11 place-items-center rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-100">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-black ${FINELY_OS_ENTITY_VALUE}`}>View PDF</div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                          {hasPdf ? 'Full letter with screenshots in PDF viewer' : 'No PDF yet — edit or resume studio'}
                          {letter.pdfFilename ? ` · ${letter.pdfFilename}` : ''}
                        </div>
                      </div>
                    </div>
                    <Eye size={18} className="shrink-0 text-fuchsia-200" />
                  </div>
                </button>
              ) : null}

              {delivery || trackingNum || delivered ? (
                <div className="flex flex-wrap gap-2">
                  {delivery ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[11px] text-sky-100">
                      <Truck size={12} /> ETA {delivery}
                    </div>
                  ) : null}
                  {trackingNum ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-[11px] text-sky-100">
                      <Truck size={12} />
                      <span className="font-mono tracking-tight">{trackingNum}</span>
                    </div>
                  ) : null}
                  {delivered ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-100">
                      <CheckCircle2 size={12} /> Delivered {delivered}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {hasPdf ? (
                  <button
                    type="button"
                    onClick={() => void runDownload()}
                    disabled={downloadBusy || pdfDisabled}
                    className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm disabled:opacity-45`}
                  >
                    <Download size={16} /> {downloadBusy ? 'Downloading…' : 'Download PDF'}
                  </button>
                ) : null}
                {onOpenPdf && hasPdf ? (
                  <button
                    type="button"
                    onClick={() => onOpenPdf()}
                    disabled={pdfDisabled}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-4 !text-sm disabled:opacity-45`}
                  >
                    <Download size={16} /> Open PDF
                  </button>
                ) : null}
                {canOpenContent ? (
                  <button type="button" onClick={openViewPdf} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm`}>
                    <Eye size={16} /> View PDF
                  </button>
                ) : null}
                {(onEdit || letter.body || !hasPdf) ? (
                  <button type="button" onClick={startEdit} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm`}>
                    <FileText size={16} /> Edit
                  </button>
                ) : null}
                {onRefreshTemplate && canRefreshLetterFromCatalog(letter) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailOpen(false);
                      setTextOpen(false);
                      onRefreshTemplate();
                    }}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-4 !text-sm !bg-violet-600 !text-white hover:!bg-violet-500`}
                    title="Pull the latest template wording and case fields into this saved letter"
                  >
                    <RefreshCw size={16} /> {refreshLabelForLetter(letter)}
                  </button>
                ) : null}
                {isDraft && onMarkFinal ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailOpen(false);
                      setTextOpen(false);
                      onMarkFinal();
                    }}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-4 !text-sm !bg-emerald-600/90`}
                  >
                    <CheckCircle2 size={16} /> Mark as final
                  </button>
                ) : null}
                {canMail && onMail && !alreadyMailed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailOpen(false);
                      setTextOpen(false);
                      onMail();
                    }}
                    disabled={mailDisabled || !hasPdf}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-4 !text-sm !bg-violet-600 !text-white hover:!bg-violet-500 disabled:opacity-45`}
                  >
                    <Send size={16} /> Mail letter
                  </button>
                ) : alreadyMailed ? (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                    <Truck size={14} />
                    Mailed
                    {trackingNum ? ` · ${trackingNum}` : mailRef ? ` · ref ${mailRef}` : ''}
                    {delivered ? ` · delivered ${delivered}` : ''}
                    {' '}— remail blocked
                  </span>
                ) : null}
                {onResumeStudio && !hasPdf ? (
                  <button type="button" onClick={onResumeStudio} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm`}>
                    <FileText size={16} /> Resume Studio
                  </button>
                ) : null}

              {downloadErr ? (
                <p className="text-xs text-rose-300/90">{downloadErr}</p>
              ) : null}

              {onArchive ? (
                  <button type="button" onClick={onArchive} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-[10px]`}>
                    <Archive size={14} /> Archive
                  </button>
                ) : null}
              </div>

              {onDelete ? (
                <div className="pt-2 mt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-200/90 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> Delete letter…
                  </button>
                </div>
              ) : null}

              {letter.mailing?.to ? (
                <div className="space-y-1 text-[11px] text-white/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <Calendar size={12} className="text-white/35" />
                    <span>
                      Mailed to {letter.mailing.to.city}, {letter.mailing.to.state}
                      {letter.mailing.createdAt ? ` · ${fmtWhen(letter.mailing.createdAt)}` : ''}
                    </span>
                  </div>
                  {trackingNum ? (
                    <div className="flex flex-wrap items-center gap-2 pl-5 text-sky-100/75">
                      <Truck size={11} className="text-sky-300/60" />
                      <span className="font-mono tracking-tight">{trackingNum}</span>
                    </div>
                  ) : null}
                  {delivered ? (
                    <div className="flex flex-wrap items-center gap-2 pl-5 text-emerald-100/80">
                      <CheckCircle2 size={11} className="text-emerald-300/60" />
                      <span>Delivered {delivered}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}

      {textOpen ? (
        <LetterFullPreviewModal
          letter={letter}
          onClose={() => setTextOpen(false)}
          onOpenPdfTab={onOpenPdf && hasPdf ? () => onOpenPdf() : undefined}
          onEdit={startEdit}
        />
      ) : null}

      {editOpen ? (
        <LetterBodyEditorModal
          letter={letter}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => onSaved?.()}
          evidence={evidence}
        />
      ) : null}

      <FinelyOsTypedDeleteDialog
        open={deleteOpen}
        title="Delete this letter?"
        description="This permanently removes the letter and stored PDF from the vault. This cannot be undone."
        entityLabel={letter.title}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          onDelete?.();
        }}
      />
    </>
  );
}
