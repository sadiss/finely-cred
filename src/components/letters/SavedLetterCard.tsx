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
  Gavel,
  Scale,
  Send,
  ShieldCheck,
  Trash2,
  Truck,
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
import {
  debtLetterCardFactsFromLetter,
  formatDebtLetterStatLine,
} from '../../lib/debtLetterCardFacts';

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

export const SAVED_LETTER_DECK_ACCENTS: FinelyOsDeckAccent[] = ['emerald', 'sky', 'violet', 'amber', 'fuchsia', 'rose'];

function deckAccentFace(accent: FinelyOsDeckAccent) {
  const map: Record<
    FinelyOsDeckAccent,
    {
      hover: string;
      highlight: string;
      bar: string;
      orb: string;
      paper: string;
      paperBar: string;
      openText: string;
      roundChip: string;
      iconShadow: string;
    }
  > = {
    emerald: {
      hover: 'hover:border-emerald-400/35',
      highlight: 'ring-2 ring-emerald-400/50 scale-[1.02] border-emerald-300/50',
      bar: 'bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-500',
      orb: 'bg-emerald-500/10',
      paper: 'border-emerald-400/35 shadow-[0_0_12px_-2px_rgba(16,185,129,0.45)]',
      paperBar: 'from-emerald-500/50 via-teal-400/40 to-emerald-500/30',
      openText: 'text-emerald-200',
      roundChip: 'border-emerald-400/25 bg-emerald-500/15 text-emerald-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(16,185,129,0.55)]',
    },
    sky: {
      hover: 'hover:border-sky-400/35',
      highlight: 'ring-2 ring-sky-400/50 scale-[1.02] border-sky-300/50',
      bar: 'bg-gradient-to-b from-sky-300 via-sky-500 to-cyan-500',
      orb: 'bg-sky-500/10',
      paper: 'border-sky-400/35 shadow-[0_0_12px_-2px_rgba(14,165,233,0.45)]',
      paperBar: 'from-sky-500/50 via-cyan-400/40 to-sky-500/30',
      openText: 'text-sky-200',
      roundChip: 'border-sky-400/25 bg-sky-500/15 text-sky-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(14,165,233,0.55)]',
    },
    violet: {
      hover: 'hover:border-violet-400/35',
      highlight: 'ring-2 ring-violet-400/50 scale-[1.02] border-violet-300/50',
      bar: 'bg-gradient-to-b from-violet-300 via-violet-500 to-purple-500',
      orb: 'bg-violet-500/10',
      paper: 'border-violet-400/35 shadow-[0_0_12px_-2px_rgba(139,92,246,0.45)]',
      paperBar: 'from-violet-500/50 via-purple-400/40 to-violet-500/30',
      openText: 'text-violet-200',
      roundChip: 'border-violet-400/25 bg-violet-500/15 text-violet-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(139,92,246,0.55)]',
    },
    amber: {
      hover: 'hover:border-amber-400/35',
      highlight: 'ring-2 ring-amber-400/50 scale-[1.02] border-amber-300/50',
      bar: 'bg-gradient-to-b from-amber-300 via-amber-500 to-orange-500',
      orb: 'bg-amber-500/10',
      paper: 'border-amber-400/35 shadow-[0_0_12px_-2px_rgba(245,158,11,0.45)]',
      paperBar: 'from-amber-500/50 via-orange-400/40 to-amber-500/30',
      openText: 'text-amber-200',
      roundChip: 'border-amber-400/25 bg-amber-500/15 text-amber-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(245,158,11,0.55)]',
    },
    fuchsia: {
      hover: 'hover:border-fuchsia-400/35',
      highlight: 'ring-2 ring-fuchsia-400/50 scale-[1.02] border-fuchsia-300/50',
      bar: 'bg-gradient-to-b from-fuchsia-300 via-fuchsia-500 to-violet-500',
      orb: 'bg-fuchsia-500/10',
      paper: 'border-fuchsia-400/35 shadow-[0_0_12px_-2px_rgba(217,70,239,0.45)]',
      paperBar: 'from-fuchsia-500/50 via-violet-400/40 to-fuchsia-500/30',
      openText: 'text-fuchsia-200',
      roundChip: 'border-fuchsia-400/25 bg-fuchsia-500/15 text-fuchsia-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(217,70,239,0.55)]',
    },
    rose: {
      hover: 'hover:border-rose-400/35',
      highlight: 'ring-2 ring-rose-400/50 scale-[1.02] border-rose-300/50',
      bar: 'bg-gradient-to-b from-rose-300 via-rose-500 to-pink-500',
      orb: 'bg-rose-500/10',
      paper: 'border-rose-400/35 shadow-[0_0_12px_-2px_rgba(244,63,94,0.45)]',
      paperBar: 'from-rose-500/50 via-pink-400/40 to-rose-500/30',
      openText: 'text-rose-200',
      roundChip: 'border-rose-400/25 bg-rose-500/15 text-rose-100',
      iconShadow: 'shadow-[0_0_14px_-4px_rgba(244,63,94,0.55)]',
    },
  };
  return map[accent];
}

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
  onMail?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onResumeStudio?: () => void;
  onEdit?: () => void;
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
  onMail,
  onArchive,
  onDelete,
  onResumeStudio,
  onEdit,
  canMail = false,
  mailDisabled = false,
  pdfDisabled = false,
}: SavedLetterCardProps) {
  const [detailOpen, setDetailOpen] = useState(Boolean(defaultSnapshotOpen || highlighted));
  const [textOpen, setTextOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const meta = typeMeta(letter.type);
  const Icon = meta.icon;
  const face = deckAccentFace(deckAccent);
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
  const debtFacts = debtLetterCardFactsFromLetter(letter);
  const bureauUi = bureauTheme(bureau);
  const steps = workflowSteps(letter.status, hasPdf);
  const delivery = fmtDate(letter.mailing?.expectedDeliveryDate);
  const toneChip = statusTone(letter.status);

  const openViewPdf = () => {
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
      <div className="group relative">
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
            className="absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/25 bg-black/70 text-red-200/90 opacity-0 transition-all hover:bg-red-500/15 group-hover:opacity-100 focus:opacity-100"
            aria-label="Delete letter"
            title="Delete letter"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
        <button
          id={id}
          type="button"
          onClick={() => setDetailOpen(true)}
          className={`group relative min-h-[100px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#090d12] text-left shadow-[0_8px_24px_-12px_rgba(0,0,0,0.65)] transition-all hover:scale-[1.02] ${face.hover} ${
            highlighted ? face.highlight : ''
          }`}
        >
        <div className={`absolute inset-y-0 left-0 w-1 ${face.bar}`} />
        <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl ${face.orb}`} />
        <div className="relative flex h-full items-stretch gap-2.5 p-3 pl-4">
          <div
            className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${face.iconShadow} ${meta.chip}`}
          >
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
            <Icon size={17} strokeWidth={2.25} className="relative text-current drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className={`truncate text-[10px] font-black uppercase tracking-[0.14em] ${FINELY_OS_ENTITY_SUBLABEL}`}>Generated letter</div>
                <div className="truncate text-[12px] font-black leading-tight text-white/95">{letter.title}</div>
                <div className={`truncate text-[9px] normal-case ${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(letter.createdAt)}</div>
              </div>
              <div
                className={`relative h-10 w-8 shrink-0 rounded-sm border bg-[#120a18] overflow-hidden rotate-2 group-hover:rotate-0 transition-transform ${face.paper}`}
                aria-hidden
              >
                <div className={`h-1 bg-gradient-to-r ${face.paperBar}`} />
                <div className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-emerald-400/40 bg-emerald-500/25" />
                <div className="p-0.5 space-y-0.5">
                  <div className="h-0.5 rounded bg-white/20 w-full" />
                  <div className="h-0.5 rounded bg-white/12 w-4/5" />
                  <div className="h-0.5 rounded bg-white/12 w-full" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className={finelyOsMicroStat(meta.accent)}>{meta.label}</span>
              {bureau ? <span className={finelyOsMicroStat(bureauUi.badge)}>{bureauFullName(bureau as Bureau)}</span> : null}
              {round ? <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase ${face.roundChip}`}>{round}</span> : null}
              <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-100">{hasPdf ? 'PDF ready' : 'Draft'}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className={`truncate text-[9px] ${FINELY_OS_ENTITY_BODY}`}>{statLine}</span>
              <span className={`inline-flex shrink-0 items-center gap-0.5 text-[9px] font-black uppercase tracking-widest ${face.openText}`}>
                <Eye size={11} /> Open letter
              </span>
            </div>
          </div>
        </div>
        </button>
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
                    <span className={finelyOsMicroStat(meta.accent)}>
                      <Icon size={10} className="inline mr-1" /> {meta.label}
                    </span>
                    {bureau ? <span className={finelyOsMicroStat(bureauUi.badge)}>{bureauFullName(bureau as Bureau)}</span> : null}
                    <span className={finelyOsStatusChip(toneChip)}>{statusLabel(letter.status)}</span>
                  </div>
                  <h3 className="mt-2 text-lg sm:text-xl font-black leading-tight text-white/95">{letter.title}</h3>
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

              {delivery ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
                  <Truck size={13} /> ETA {delivery}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
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
                {canMail && onMail ? (
                  <button
                    type="button"
                    onClick={onMail}
                    disabled={mailDisabled || !hasPdf}
                    className={`${FINELY_OS_PRIMARY_BTN} !py-2.5 !px-4 !text-sm !bg-amber-500/90 disabled:opacity-45`}
                  >
                    <Send size={16} /> Mail letter
                  </button>
                ) : null}
                {onResumeStudio && !hasPdf ? (
                  <button type="button" onClick={onResumeStudio} className={`${FINELY_OS_SECONDARY_BTN} !py-2.5 !px-4 !text-sm`}>
                    <FileText size={16} /> Resume Studio
                  </button>
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
        <LetterBodyEditorModal letter={letter} open={editOpen} onClose={() => setEditOpen(false)} />
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
