import React, { useEffect, useState } from 'react';
import {
  Archive,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  Eye,
  FileText,
  Gavel,
  Scale,
  ScrollText,
  Send,
  ShieldCheck,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import type { LetterRecord, LetterStatus, LetterType, DisputeLetterMeta } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { LetterFullPreviewModal } from './LetterFullPreviewModal';
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

function statusTone(status: LetterStatus | string | undefined): 'ok' | 'warn' | 'blocked' {
  const s = String(status || 'generated').toLowerCase();
  if (s === 'mailed' || s === 'completed') return 'ok';
  if (s === 'mail_failed') return 'blocked';
  return 'warn';
}

function statusLabel(status: LetterStatus | string | undefined) {
  return String(status || 'generated').replaceAll('_', ' ');
}

function typeMeta(type: LetterType): {
  label: string;
  icon: typeof Gavel;
  accent: FinelyOsDeckAccent;
  chip: string;
  seal: string;
} {
  if (type === 'dispute') {
    return {
      label: 'Dispute',
      icon: Gavel,
      accent: 'fuchsia',
      chip: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100',
      seal: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/35',
    };
  }
  if (type === 'validation') {
    return {
      label: 'Validation',
      icon: ShieldCheck,
      accent: 'amber',
      chip: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
      seal: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
    };
  }
  return {
    label: 'Affidavit',
    icon: Scale,
    accent: 'rose',
    chip: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
    seal: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
  };
}

function bureauTheme(bureau: string) {
  if (bureau === 'EXP') return { badge: 'sky' as const, paper: 'from-sky-50 to-white', seal: 'bg-sky-500/15 text-sky-700 border-sky-300/50' };
  if (bureau === 'EQF') return { badge: 'rose' as const, paper: 'from-rose-50 to-white', seal: 'bg-rose-500/15 text-rose-700 border-rose-300/50' };
  if (bureau === 'TUC') return { badge: 'emerald' as const, paper: 'from-emerald-50 to-white', seal: 'bg-emerald-500/15 text-emerald-700 border-emerald-300/50' };
  return { badge: 'violet' as const, paper: 'from-slate-50 to-white', seal: 'bg-slate-500/15 text-slate-700 border-slate-300/50' };
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

export type SavedLetterCardProps = {
  letter: LetterRecord;
  id?: string;
  highlighted?: boolean;
  defaultSnapshotOpen?: boolean;
  autoOpenPreview?: boolean;
  evidence?: EvidenceItem[];
  onOpenPdf?: () => void;
  onMail?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
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
  onOpenPdf,
  onMail,
  onArchive,
  onDelete,
  canMail = false,
  mailDisabled = false,
  pdfDisabled = false,
}: SavedLetterCardProps) {
  const [detailOpen, setDetailOpen] = useState(Boolean(defaultSnapshotOpen || highlighted));
  const [textOpen, setTextOpen] = useState(false);
  const meta = typeMeta(letter.type);
  const Icon = meta.icon;
  const hasPdf = Boolean(letter.pdfBlobRef);
  const canOpenContent = hasPdf || Boolean(letter.body);
  const bureau =
    letter.meta && typeof letter.meta === 'object' && 'bureau' in letter.meta
      ? String((letter.meta as { bureau?: Bureau }).bureau || '')
      : '';
  const round =
    letter.meta && typeof letter.meta === 'object' && 'round' in letter.meta
      ? String((letter.meta as { round?: string }).round || '')
      : '';
  const tone =
    letter.meta && typeof letter.meta === 'object' && 'tone' in letter.meta
      ? String((letter.meta as { tone?: string }).tone || '')
      : '';
  const stats = disputeStats(letter);
  const bureauUi = bureauTheme(bureau);
  const steps = workflowSteps(letter.status, hasPdf);
  const delivery = fmtDate(letter.mailing?.expectedDeliveryDate);
  const toneChip = statusTone(letter.status);

  const openPreview = () => {
    if (hasPdf || letter.body) {
      setDetailOpen(false);
      setTextOpen(true);
    }
  };

  useEffect(() => {
    if (autoOpenPreview && (hasPdf || letter.body)) {
      setDetailOpen(false);
      setTextOpen(true);
    }
  }, [autoOpenPreview, hasPdf, letter.body]);

  const handleOpenContent = () => {
    if (hasPdf && onOpenPdf) {
      onOpenPdf();
      return;
    }
    openPreview();
  };

  useEffect(() => {
    if (!highlighted) return;
    const t = window.setTimeout(() => setDetailOpen(true), 120);
    return () => window.clearTimeout(t);
  }, [highlighted]);

  const statLine = stats
    ? `${stats.items} items · ${stats.evidence} proof · ${stats.reasons} reasons`
    : hasPdf
      ? 'PDF stored'
      : 'Draft letter';

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setDetailOpen(true)}
        className={`${finelyOsDeckTile(meta.accent, highlighted)} min-h-[92px] ${
          highlighted ? 'scale-[1.02]' : 'hover:brightness-105'
        }`}
      >
        <div className="relative flex h-full items-stretch gap-2.5 p-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${meta.seal}`}>
            <Icon size={15} />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`truncate text-[12px] font-black leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
                <div className={`truncate text-[9px] ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>{fmtWhen(letter.createdAt)}</div>
              </div>
              <div
                className={`h-9 w-7 shrink-0 rounded-md border bg-gradient-to-b ${bureauUi.paper} shadow-md shadow-black/20 overflow-hidden rotate-3 group-hover:rotate-0 transition-transform`}
                aria-hidden
              >
                <div className="h-1.5 bg-slate-900/10 border-b border-black/10" />
                <div className="p-0.5 space-y-0.5">
                  <div className="h-0.5 rounded bg-black/12 w-full" />
                  <div className="h-0.5 rounded bg-black/8 w-4/5" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className={finelyOsMicroStat(meta.accent)}>{meta.label}</span>
              {bureau ? <span className={finelyOsMicroStat(bureauUi.badge)}>{bureauShortCode(bureau as Bureau)}</span> : null}
              <span className={finelyOsStatusChip(toneChip)}>{hasPdf ? 'PDF' : 'Draft'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className={`truncate text-[9px] ${FINELY_OS_ENTITY_BODY}`}>{statLine}</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[9px] font-black uppercase tracking-widest text-amber-200/90 opacity-80 group-hover:opacity-100">
                <Eye size={11} /> Open
              </span>
            </div>
          </div>
        </div>
      </button>

      {detailOpen ? (
        <div className="fixed inset-0 z-[1000] isolate flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setDetailOpen(false)} />
          <div
            className={`relative z-[1001] w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-[1.75rem] border border-white/12 bg-[#080c12] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] ${
              highlighted ? 'ring-2 ring-amber-300/25' : ''
            }`}
          >
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={finelyOsMicroStat(meta.accent)}>
                      <Icon size={10} className="inline mr-1" /> {meta.label}
                    </span>
                    {bureau ? <span className={finelyOsMicroStat(bureauUi.badge)}>{bureauShortCode(bureau as Bureau)}</span> : null}
                    <span className={finelyOsStatusChip(toneChip)}>{statusLabel(letter.status)}</span>
                  </div>
                  <h3 className={`mt-2 text-lg sm:text-xl font-black leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</h3>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    {fmtWhen(letter.createdAt)}
                    {round ? ` · ${round}` : ''}
                    {tone ? ` · ${tone}` : ''}
                    {bureau ? ` · ${bureauFullName(bureau as Bureau)}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setDetailOpen(false)} className={`${FINELY_OS_SECONDARY_BTN} !py-2`}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'PDF', value: hasPdf ? 'Ready' : '—' },
                  { label: 'Items', value: stats?.items ?? '—' },
                  { label: 'Proof', value: stats?.evidence ?? '—' },
                  { label: 'Reasons', value: stats?.reasons ?? '—' },
                ].map((kpi, i) => (
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
                  onClick={openPreview}
                  className={`${finelyOsDeckTile('sky')} w-full !min-h-0 p-4 text-left hover:brightness-105`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-11 w-11 place-items-center rounded-xl border border-sky-400/25 bg-sky-500/10 text-sky-100">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-sm font-black ${FINELY_OS_ENTITY_VALUE}`}>Preview generated letter</div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                          {hasPdf ? 'Full PDF preview in viewer' : 'Formatted letter text'}
                          {letter.pdfFilename ? ` · ${letter.pdfFilename}` : ''}
                        </div>
                      </div>
                    </div>
                    <Eye size={18} className="shrink-0 text-sky-200" />
                  </div>
                </button>
              ) : null}

              {delivery ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                  <Truck size={13} /> ETA {delivery}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {onOpenPdf ? (
                  <button
                    type="button"
                    onClick={handleOpenContent}
                    disabled={pdfDisabled || !canOpenContent}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2 !text-[10px] disabled:opacity-45`}
                  >
                    <Download size={14} /> {hasPdf ? 'Open PDF' : 'View letter'}
                  </button>
                ) : null}
                {canOpenContent ? (
                  <button type="button" onClick={openPreview} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-[10px]`}>
                    <ScrollText size={14} /> Preview
                  </button>
                ) : null}
                {canMail && onMail ? (
                  <button type="button" onClick={onMail} disabled={mailDisabled || !hasPdf} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-[10px] disabled:opacity-45`}>
                    <Send size={14} /> Mail
                  </button>
                ) : null}
                {onArchive ? (
                  <button type="button" onClick={onArchive} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-[10px]`}>
                    <Archive size={14} /> Archive
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-100 hover:bg-red-500/15"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                ) : null}
              </div>

              {letter.mailing?.to ? (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/50">
                  <Calendar size={12} className="text-white/35" />
                  <span>
                    Mailed to {letter.mailing.to.city}, {letter.mailing.to.state}
                    {letter.mailing.createdAt ? ` · ${fmtWhen(letter.mailing.createdAt)}` : ''}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {textOpen && (letter.body || letter.pdfBlobRef) ? (
        <LetterFullPreviewModal letter={letter} evidence={evidence} onClose={() => setTextOpen(false)} />
      ) : null}
    </>
  );
}
