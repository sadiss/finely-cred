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
  Sparkles,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import type { LetterRecord, LetterStatus, LetterType, DisputeLetterMeta } from '../../domain/letters';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { sanitizeHtmlForPreview } from '../../utils/richText';
import { getBlobUrl } from '../../storage/getBlobUrl';
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
  const [detailOpen, setDetailOpen] = useState(Boolean(defaultSnapshotOpen || highlighted));
  const [textOpen, setTextOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewRevoke, setPreviewRevoke] = useState<null | (() => void)>(null);
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
    if (letter.body) setTextOpen(true);
  };
  const delivery = fmtDate(letter.mailing?.expectedDeliveryDate);
  const actionStop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  useEffect(() => {
    if (!textOpen || !letter.pdfBlobRef) return undefined;
    let alive = true;
    setPreviewUrl('');
    void getBlobUrl(letter.pdfBlobRef, { mimeType: 'application/pdf', preferSigned: true }).then((res) => {
      if (!alive) {
        res?.revoke?.();
        return;
      }
      if (res?.url) {
        setPreviewUrl(res.url);
        setPreviewRevoke(() => res.revoke ?? null);
      }
    });
    return () => {
      alive = false;
      try {
        previewRevoke?.();
      } catch {
        // ignore
      }
      setPreviewRevoke(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textOpen, letter.pdfBlobRef]);

  return (
    <>
      <button
        id={id}
        type="button"
        onClick={() => setDetailOpen(true)}
        className={
          'group relative min-h-[126px] w-full overflow-hidden rounded-[1.35rem] border p-0 text-left transition-all duration-300 ' +
          (highlighted
            ? 'border-amber-300/60 bg-[#120d05] ring-2 ring-amber-300/30 shadow-[0_18px_50px_-24px_rgba(251,191,36,0.8)]'
            : 'border-white/10 bg-[#090d12] hover:border-amber-300/35 hover:shadow-[0_18px_50px_-28px_rgba(251,191,36,0.45)]')
        }
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-300 via-fuchsia-400 to-violet-500" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-amber-300/0 via-amber-200/35 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-amber-400/12 blur-2xl transition-opacity group-hover:opacity-100" />
        <div className="relative flex h-full flex-col justify-between gap-2.5 p-3.5 pl-5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${meta.seal}`}>
                <Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className={`truncate text-[13px] font-black ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
                <div className={`mt-0.5 truncate text-[10px] ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>
                  {fmtWhen(letter.createdAt)}
                </div>
              </div>
            </div>
            <div className={`h-11 w-8 shrink-0 rounded-lg border bg-gradient-to-b ${bureauUi.paper} shadow-lg shadow-black/25 overflow-hidden rotate-2 transition-transform group-hover:rotate-0`}>
              <div className="h-2 bg-slate-900/10 border-b border-black/10" />
              <div className="p-1 space-y-0.5">
                <div className="h-0.5 rounded bg-black/15" />
                <div className="h-0.5 rounded bg-black/10 w-4/5" />
                <div className="h-0.5 rounded bg-black/10 w-3/5" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${meta.chip}`}>
              {letter.type === 'dispute' ? 'Dispute' : meta.label}
            </span>
            {bureau ? <span className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${bureauUi.badge}`}>{bureauShortCode(bureau as Bureau)}</span> : null}
            <span className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
              {hasPdf ? 'PDF ready' : 'Draft'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-white/35">Items</div>
              <div className={`text-sm font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.items ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-white/35">Proof</div>
              <div className={`text-sm font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.evidence ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-1.5">
              <div className="text-[8px] uppercase tracking-widest text-white/35">Reasons</div>
              <div className={`text-sm font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.reasons ?? '—'}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[10px] uppercase tracking-widest text-white/35">{statusLabel(letter.status)}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-200">
              Open <Eye size={13} />
            </span>
          </div>
        </div>
      </button>

      {detailOpen ? (
        <div className="fixed inset-0 z-[1000] isolate flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setDetailOpen(false)} />
          <div className={`relative z-[1001] w-full max-w-5xl max-h-[88vh] overflow-hidden rounded-[2rem] border border-white/14 bg-[#080c12] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] ${highlighted ? 'ring-2 ring-amber-300/25' : ''}`}>
            <div className="border-b border-white/10 bg-[radial-gradient(900px_360px_at_5%_0%,rgba(251,191,36,0.18),transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${meta.chip}`}>
                      <Icon size={12} /> {meta.label}
                    </span>
                    {bureau ? <span className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${bureauUi.badge}`}>{bureauShortCode(bureau as Bureau)}</span> : null}
                    <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-black/25 text-[10px] font-black uppercase tracking-widest text-white/60">
                      {statusLabel(letter.status)}
                    </span>
                  </div>
                  <h3 className={`mt-3 text-2xl md:text-3xl font-black leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</h3>
                  <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    Saved {fmtWhen(letter.createdAt)}
                    {round ? ` · ${round}` : ''}
                    {tone ? ` · ${tone} tone` : ''}
                    {bureau ? ` · ${bureauFullName(bureau as Bureau)}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setDetailOpen(false)} className={FINELY_OS_SECONDARY_BTN}>
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-5 grid lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className={`relative mx-auto h-[230px] w-[172px] rounded-2xl border border-white/20 bg-gradient-to-b ${bureauUi.paper} shadow-xl shadow-black/30 overflow-hidden`}>
                    <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-100/95 to-white border-b border-black/[0.06]" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <div className={`h-7 w-7 rounded-full border flex items-center justify-center text-[9px] font-black ${bureauUi.seal}`}>
                        {bureau ? bureauShortCode(bureau as Bureau).slice(0, 1) : 'F'}
                      </div>
                      {hasPdf ? <CheckCircle2 size={18} className="text-emerald-600" /> : null}
                    </div>
                    <div className="absolute inset-x-5 top-16 space-y-2">
                      <div className="h-2 rounded-full bg-black/12 w-full" />
                      <div className="h-2 rounded-full bg-black/[0.08] w-[90%]" />
                      <div className="h-2 rounded-full bg-black/[0.08] w-[75%]" />
                      <div className="mt-4 h-14 rounded-lg border border-black/[0.07] bg-black/[0.035]" />
                      <div className="h-2 rounded-full bg-black/[0.06] w-[88%]" />
                      <div className="h-2 rounded-full bg-black/[0.06] w-[62%]" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 px-3 py-4 bg-gradient-to-t from-amber-100/95 via-amber-50/80 to-transparent">
                      <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-amber-950/75">
                        <FileText size={11} /> {hasPdf ? 'Vault PDF' : 'Draft only'}
                      </div>
                    </div>
                  </div>
                </div>
                {letter.pdfFilename ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-[11px] font-mono text-emerald-100 break-all">{letter.pdfFilename}</div> : null}
                {delivery ? <div className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-3 text-xs text-sky-100"><Truck size={14} /> ETA {delivery}</div> : null}
              </div>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>PDF</div>
                    <div className={`mt-1 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{hasPdf ? 'Ready' : 'Missing'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Items</div>
                    <div className={`mt-1 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.items ?? '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Evidence</div>
                    <div className={`mt-1 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.evidence ?? '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Reasons</div>
                    <div className={`mt-1 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{stats?.reasons ?? '—'}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Letter journey</div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {steps.map((step) => (
                      <div key={step.key} className="text-center">
                        <div className="flex justify-center">{step.done ? <CheckCircle2 size={17} className="text-emerald-400" /> : <Circle size={15} className="text-white/25" />}</div>
                        <div className={`mt-1 text-[9px] font-black uppercase tracking-widest ${step.done ? 'text-emerald-200/90' : 'text-white/35'}`}>{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onOpenPdf ? (
                    <button type="button" onClick={handleOpenContent} disabled={pdfDisabled || !canOpenContent} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 disabled:opacity-45">
                      <Download size={15} /> {hasPdf ? 'Open PDF' : 'View letter'}
                    </button>
                  ) : null}
                  {letter.body || hasPdf ? (
                    <button type="button" onClick={() => setTextOpen(true)} className={FINELY_OS_SECONDARY_BTN}>
                      <ScrollText size={14} /> Preview generated letter
                    </button>
                  ) : null}
                  {canMail && onMail ? (
                    <button type="button" onClick={onMail} disabled={mailDisabled || !hasPdf} className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-45`}>
                      <Send size={14} /> Mail
                    </button>
                  ) : null}
                  {onArchive ? <button type="button" onClick={onArchive} className={FINELY_OS_SECONDARY_BTN}><Archive size={14} /> Archive</button> : null}
                  {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/25 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-100 hover:bg-red-500/15"><Trash2 size={14} /> Delete</button> : null}
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
        </div>
      ) : null}

      {textOpen && letter.body ? (
        <div className="fixed inset-0 z-[1100] isolate flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setTextOpen(false)} />
          <div className="relative z-[1101] w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/14 bg-[#080c12] shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Generated letter preview</div>
                <div className={`mt-1 text-xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{letter.title}</div>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setTextOpen(false)}><X size={14} /> Close</button>
            </div>
            <div className="max-h-[78vh] overflow-y-auto bg-slate-100 p-4 md:p-6">
              {previewUrl ? (
                <iframe title="Generated letter PDF preview" src={previewUrl} className="h-[72vh] w-full rounded-xl border border-slate-300 bg-white shadow-xl" />
              ) : (
                <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500 font-black">Finely Cred generated letter</div>
                  <div className="mt-5 prose prose-slate max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtmlForPreview(letter.body || '') }} />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
