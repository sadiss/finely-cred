import React, { useState } from 'react';
import {
  Archive,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Download,
  FileText,
  Gavel,
  Mail,
  Scale,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import type { LetterRecord, LetterStatus, LetterType, DisputeLetterMeta } from '../../domain/letters';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { sanitizeHtmlForPreview } from '../../utils/richText';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
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

function typeMeta(type: LetterType) {
  if (type === 'dispute') {
    return {
      label: 'Dispute letter',
      icon: Gavel,
      shell: 'from-fuchsia-600/20 via-violet-600/12 to-amber-500/10',
      glow: 'shadow-[0_24px_70px_-32px_rgba(217,70,239,0.55)]',
      ring: 'ring-fuchsia-400/20',
      chip: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100',
      seal: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/35',
    };
  }
  if (type === 'validation') {
    return {
      label: 'Validation / DV',
      icon: ShieldCheck,
      shell: 'from-amber-500/22 via-orange-500/12 to-emerald-500/10',
      glow: 'shadow-[0_24px_70px_-32px_rgba(245,158,11,0.5)]',
      ring: 'ring-amber-400/20',
      chip: 'border-amber-400/30 bg-amber-500/15 text-amber-100',
      seal: 'bg-amber-500/20 text-amber-200 border-amber-400/35',
    };
  }
  return {
    label: 'Court / Affidavit',
    icon: Scale,
    shell: 'from-rose-500/22 via-violet-500/12 to-sky-500/10',
    glow: 'shadow-[0_24px_70px_-32px_rgba(244,63,94,0.45)]',
    ring: 'ring-rose-400/20',
    chip: 'border-rose-400/30 bg-rose-500/15 text-rose-100',
    seal: 'bg-rose-500/20 text-rose-200 border-rose-400/35',
  };
}

function bureauTheme(bureau: string) {
  if (bureau === 'EXP') {
    return {
      badge: 'border-sky-400/40 bg-sky-500/20 text-sky-50',
      paper: 'from-sky-50 to-white',
      seal: 'bg-sky-500/15 text-sky-700 border-sky-300/50',
      accent: 'text-sky-300',
    };
  }
  if (bureau === 'EQF') {
    return {
      badge: 'border-rose-400/40 bg-rose-500/20 text-rose-50',
      paper: 'from-rose-50 to-white',
      seal: 'bg-rose-500/15 text-rose-700 border-rose-300/50',
      accent: 'text-rose-300',
    };
  }
  if (bureau === 'TUC') {
    return {
      badge: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-50',
      paper: 'from-emerald-50 to-white',
      seal: 'bg-emerald-500/15 text-emerald-700 border-emerald-300/50',
      accent: 'text-emerald-300',
    };
  }
  return {
    badge: 'border-white/15 bg-white/10 text-white/80',
    paper: 'from-slate-50 to-white',
    seal: 'bg-slate-500/15 text-slate-700 border-slate-300/50',
    accent: 'text-white/70',
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
    { key: 'pdf', label: 'PDF ready', done: hasPdf },
    { key: 'mail', label: 'Mailed', done: s === 'mailed' || s === 'waiting_response' || s === 'completed' || s === 'mail_pending' },
    { key: 'response', label: 'Response', done: s === 'waiting_response' || s === 'completed' },
  ];
}

export type SavedLetterCardProps = {
  letter: LetterRecord;
  id?: string;
  highlighted?: boolean;
  defaultSnapshotOpen?: boolean;
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
  onOpenPdf,
  onMail,
  onArchive,
  onDelete,
  canMail = false,
  mailDisabled = false,
  pdfDisabled = false,
}: SavedLetterCardProps) {
  const [snapshotOpen, setSnapshotOpen] = useState(defaultSnapshotOpen);
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
  const handleOpenContent = () => {
    if (hasPdf && onOpenPdf) {
      onOpenPdf();
      return;
    }
    if (letter.body) setSnapshotOpen(true);
  };
  const delivery = fmtDate(letter.mailing?.expectedDeliveryDate);

  return (
    <article
      id={id}
      className={
        'group relative overflow-hidden rounded-[28px] border transition-all duration-500 ' +
        (highlighted
          ? 'border-amber-300/55 bg-gradient-to-br from-amber-500/20 via-fuchsia-500/12 to-violet-600/15 shadow-[0_28px_80px_-28px_rgba(251,191,36,0.55)] ring-2 ring-amber-300/35 scale-[1.008]'
          : `border-white/14 bg-gradient-to-br ${meta.shell} hover:border-white/22 ${meta.glow} hover:scale-[1.005] ring-1 ${meta.ring}`)
      }
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      {highlighted ? (
        <>
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-300 via-fuchsia-400 to-violet-400" />
          <div className="absolute -top-20 -right-16 w-48 h-48 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />
        </>
      ) : (
        <div className="absolute -top-24 -right-20 w-56 h-56 rounded-full bg-white/[0.04] blur-3xl pointer-events-none group-hover:bg-white/[0.06] transition-colors" />
      )}

      <div className="relative p-5 md:p-6 lg:p-7">
        {highlighted ? (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/35 bg-gradient-to-r from-amber-500/15 via-fuchsia-500/10 to-transparent px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/20 text-amber-100 shrink-0">
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-amber-50">Letter saved to your vault</div>
              <div className="text-xs text-amber-100/75 mt-0.5">Open the PDF, print, or mail when you are ready.</div>
            </div>
            {onOpenPdf && canOpenContent ? (
              <button
                type="button"
                onClick={handleOpenContent}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 shadow-[0_10px_30px_-14px_rgba(251,191,36,0.8)]"
              >
                <Download size={14} /> {hasPdf ? 'Open now' : 'View letter'}
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-7">
          {/* Paper preview mock */}
          <div className="shrink-0 flex justify-center lg:justify-start">
            <div className="relative transition-transform duration-500 group-hover:-rotate-1 group-hover:scale-[1.02]">
              <div
                className={`relative w-[128px] h-[168px] md:w-[140px] md:h-[184px] rounded-2xl border border-white/25 bg-gradient-to-b ${bureauUi.paper} shadow-[0_20px_50px_-22px_rgba(0,0,0,0.65)] overflow-hidden`}
              >
                <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-100/95 to-white border-b border-black/[0.06]" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center text-[8px] font-black ${bureauUi.seal}`}>
                    {bureau ? bureauShortCode(bureau as Bureau).slice(0, 1) : 'F'}
                  </div>
                  {hasPdf ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
                      <CheckCircle2 size={12} />
                    </div>
                  ) : null}
                </div>
                <div className="absolute inset-x-4 top-12 space-y-2">
                  <div className="h-2 rounded-full bg-black/10 w-full" />
                  <div className="h-2 rounded-full bg-black/[0.07] w-[90%]" />
                  <div className="h-2 rounded-full bg-black/[0.07] w-[94%]" />
                  <div className="h-2 rounded-full bg-black/[0.05] w-[72%]" />
                  <div className="mt-4 h-10 rounded-lg border border-black/[0.07] bg-black/[0.03]" />
                  <div className="h-2 rounded-full bg-black/[0.05] w-[80%]" />
                </div>
                <div className="absolute bottom-0 inset-x-0 px-3 py-3 bg-gradient-to-t from-amber-100/95 via-amber-50/80 to-transparent">
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-amber-950/75">
                    <FileText size={11} />
                    {hasPdf ? 'Vault PDF' : 'Draft only'}
                  </div>
                </div>
              </div>
              {stats?.items ? (
                <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full border border-white/20 bg-fc-chrome/95 text-[9px] font-black uppercase tracking-widest text-white/90 shadow-lg">
                  {stats.items} item{stats.items === 1 ? '' : 's'}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${meta.chip}`}>
                  <Icon size={12} />
                  {meta.label}
                </span>
                {bureau ? (
                  <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${bureauUi.badge}`}>
                    {bureauShortCode(bureau as Bureau)}
                  </span>
                ) : null}
                <span
                  className={
                    'px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ' +
                    (statusTone(letter.status) === 'ok'
                      ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-100'
                      : statusTone(letter.status) === 'blocked'
                        ? 'border-red-400/35 bg-red-500/15 text-red-100'
                        : 'border-amber-400/35 bg-amber-500/15 text-amber-100')
                  }
                >
                  {statusLabel(letter.status)}
                </span>
              </div>

              <div>
                <h3 className={`text-xl md:text-2xl font-semibold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</h3>
                <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Saved {fmtWhen(letter.createdAt)}
                  {round ? ` · ${round}` : ''}
                  {tone ? ` · ${tone} tone` : ''}
                  {bureau ? ` · ${bureauFullName(bureau as Bureau)}` : ''}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {stats ? (
                  <>
                    <span className="px-3 py-1.5 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {stats.items} disputes
                    </span>
                    <span className="px-3 py-1.5 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {stats.evidence} screenshots
                    </span>
                    <span className="px-3 py-1.5 fc-light-glass-panel fc-light-chrome-panel rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/70">
                      {stats.reasons} reasons
                    </span>
                  </>
                ) : null}
                {letter.pdfFilename ? (
                  <span className="px-3 py-1.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-[10px] font-mono text-emerald-200/90 truncate max-w-full">
                    {letter.pdfFilename}
                  </span>
                ) : hasPdf ? (
                  <span className="px-3 py-1.5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                    PDF in vault
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl border border-amber-400/25 bg-amber-500/10 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                    No PDF yet
                  </span>
                )}
                {delivery ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sky-400/25 bg-sky-500/10 text-[10px] font-bold uppercase tracking-widest text-sky-100">
                    <Truck size={11} /> ETA {delivery}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Workflow rail */}
            <div className="fc-light-glass-panel fc-light-chrome-panel px-4 py-3">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Letter journey</div>
              <div className="grid grid-cols-4 gap-2">
                {steps.map((step, i) => (
                  <div key={step.key} className="min-w-0 text-center">
                    <div className="flex items-center justify-center mb-1.5">
                      {step.done ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <Circle size={14} className="text-white/25" />
                      )}
                    </div>
                    <div className={`text-[9px] font-black uppercase tracking-widest truncate ${step.done ? 'text-emerald-200/90' : 'text-white/35'}`}>
                      {step.label}
                    </div>
                    {i < steps.length - 1 ? (
                      <div className="hidden sm:block absolute" aria-hidden />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onOpenPdf ? (
                <button
                  type="button"
                  onClick={handleOpenContent}
                  disabled={pdfDisabled || !canOpenContent}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-[0_12px_32px_-14px_rgba(251,191,36,0.75)]"
                >
                  <Download size={15} /> {hasPdf ? 'Open PDF' : 'View letter'}
                </button>
              ) : null}
              {canMail && onMail ? (
                <button
                  type="button"
                  onClick={onMail}
                  disabled={mailDisabled || !hasPdf}
                  className={`inline-flex items-center gap-2 px-4 py-3 ${FINELY_OS_SECONDARY_BTN} disabled:opacity-45`}
                  title="Mail this letter"
                >
                  <Send size={14} /> Mail letter
                </button>
              ) : null}
              {onArchive ? (
                <button type="button" onClick={onArchive} className={`inline-flex items-center gap-2 px-4 py-3 ${FINELY_OS_SECONDARY_BTN}`}>
                  <Archive size={14} /> Archive
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-100 hover:bg-red-500/15"
                >
                  <Trash2 size={14} /> Delete
                </button>
              ) : null}
            </div>

            {letter.body ? (
              <button
                type="button"
                onClick={() => setSnapshotOpen((v) => !v)}
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white/80 transition-colors"
              >
                <ScrollText size={12} />
                Preview letter text
                <ChevronDown size={12} className={'transition-transform ' + (snapshotOpen ? 'rotate-180' : '')} />
              </button>
            ) : null}
          </div>
        </div>

        {snapshotOpen && letter.body ? (
          <div className="mt-5 pt-5 border-t border-white/[0.08]">
            <div className="fc-light-glass-panel fc-light-chrome-panel p-4 md:p-5 max-h-[260px] overflow-y-auto fc-scroll-area">
              <div className={`text-[13px] leading-relaxed ${FINELY_OS_ENTITY_BODY}`} dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(letter.body) }} />
            </div>
          </div>
        ) : null}

        {letter.mailing?.to ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
            <Calendar size={12} className="text-white/35" />
            <span>
              Mailed to {letter.mailing.to.city}, {letter.mailing.to.state}
              {letter.mailing.createdAt ? ` · ${fmtWhen(letter.mailing.createdAt)}` : ''}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}
