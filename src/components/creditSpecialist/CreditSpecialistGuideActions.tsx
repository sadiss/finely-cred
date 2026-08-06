import React, { useCallback, useState } from 'react';
import { ArrowRight, BookOpen, Download, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FINELY_OS_SECONDARY_BTN, FINELY_OS_SUCCESS_BTN } from '../../features/os/finelyOsLightUi';
import { CS_GUIDE_READ_PATH, CS_JOIN_PATH } from '../../pages/leadmagnet/creditSpecialistGuideContent';
import {
  CREDIT_SPECIALIST_TWO_SHEET,
  downloadCreditSpecialistTwoSheet,
} from '../../resources/buildCreditSpecialistTwoSheetPdf';

/**
 * Paired "Read Guide" + "Download 2-sheet playbook" actions.
 *
 * Both buttons stay high-contrast — the download is a real sibling of the read CTA,
 * not a ghosted afterthought. Side by side on desktop, stacked full-width on mobile.
 */
export type CreditSpecialistGuideActionsTone = 'gold' | 'onDark' | 'onLight' | 'os';

type Props = {
  /**
   * `gold` for surfaces with no gold primary yet, `onDark` when a gold CTA already owns the
   * viewport, `onLight` for ivory panels, `os` for theme-aware Finely OS surfaces.
   */
  tone?: CreditSpecialistGuideActionsTone;
  size?: 'md' | 'sm' | 'lg';
  className?: string;
  readLabel?: string;
  /** Overrides the default navigation to the in-app reader. */
  onReadGuide?: () => void;
  showJoinLink?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const BASE =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl font-black uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto';

const SIZE: Record<'md' | 'sm' | 'lg', string> = {
  md: 'h-12 px-6 text-[11px]',
  sm: 'h-10 px-4 text-[10px]',
  lg: 'h-14 px-8 text-[12px]',
};

type StyledTone = Exclude<CreditSpecialistGuideActionsTone, 'os'>;

const READ_TONE: Record<StyledTone, string> = {
  gold: 'border border-amber-200/60 bg-gradient-to-r from-[#f4d488] via-[#d4a447] to-[#b8862b] text-[#0a1628] shadow-lg shadow-amber-500/25 hover:brightness-110',
  onDark: 'border border-white/80 bg-white text-[#0a1628] shadow-lg shadow-black/30 hover:bg-white/90',
  onLight: 'border border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800',
};

const DOWNLOAD_TONE: Record<StyledTone, string> = {
  gold: 'border-2 border-[#95e000]/70 bg-[#95e000]/15 text-[#c9f56b] hover:border-[#95e000] hover:bg-[#95e000]/25 hover:text-white',
  onDark: 'border-2 border-white/70 bg-white/10 text-white hover:border-white hover:bg-white/20',
  onLight: 'border-2 border-slate-900/30 bg-white text-slate-900 hover:border-slate-900/60 hover:bg-slate-50',
};

const JOIN_TONE: Record<CreditSpecialistGuideActionsTone, string> = {
  gold: 'text-white/60 hover:text-[#f0cc75]',
  onDark: 'text-white/60 hover:text-white',
  onLight: 'text-slate-600 hover:text-slate-900',
  os: 'text-white/60 hover:text-amber-300',
};

export function CreditSpecialistGuideActions({
  tone = 'gold',
  size = 'md',
  className,
  readLabel = 'Read Guide',
  onReadGuide,
  showJoinLink = false,
}: Props) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      await downloadCreditSpecialistTwoSheet();
    } catch (e) {
      setError((e as Error)?.message || 'Download failed — please try again.');
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleRead = onReadGuide ?? (() => navigate(CS_GUIDE_READ_PATH));
  const iconSize = size === 'lg' ? 18 : size === 'md' ? 16 : 14;
  const osSizeOverride = size === 'lg' ? '!h-14 !px-8 !text-xs' : size === 'sm' ? '!h-10 !px-4 !text-[10px]' : '';

  // Finely OS surfaces flip with the light/dark theme, so they reuse theme-aware tokens
  // instead of the hand-rolled contrast pairs.
  const readClass =
    tone === 'os'
      ? cn('w-full sm:w-auto', osSizeOverride, FINELY_OS_SUCCESS_BTN)
      : cn(BASE, SIZE[size], READ_TONE[tone]);
  const downloadClass =
    tone === 'os'
      ? cn('w-full sm:w-auto !border-emerald-400/45 ring-1 ring-emerald-400/25', osSizeOverride, FINELY_OS_SECONDARY_BTN)
      : cn(BASE, SIZE[size], DOWNLOAD_TONE[tone]);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button type="button" onClick={handleRead} className={readClass}>
          <BookOpen size={iconSize} /> {readLabel} <ArrowRight size={iconSize} />
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className={downloadClass}
          aria-label={`${CREDIT_SPECIALIST_TWO_SHEET.downloadLabel} (PDF)`}
        >
          {downloading ? <Loader2 size={iconSize} className="animate-spin" /> : <Download size={iconSize} />}
          {downloading ? 'Building PDF…' : CREDIT_SPECIALIST_TWO_SHEET.downloadLabel}
        </button>
        {showJoinLink ? (
          <button
            type="button"
            onClick={() => navigate(CS_JOIN_PATH)}
            className={cn(
              'inline-flex items-center justify-center px-1 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors',
              JOIN_TONE[tone],
            )}
          >
            Pricing &amp; join →
          </button>
        ) : null}
      </div>
      <p
        className={cn(
          'mt-2 text-[11px]',
          tone === 'onLight' ? 'text-slate-500' : 'text-white/45',
        )}
      >
        Free to read — no signup. The {CREDIT_SPECIALIST_TWO_SHEET.shortLabel} is a 2-page PDF: the offer on sheet one,
        your weekly operating rhythm on sheet two.
      </p>
      {error ? <p className="mt-1 text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
}

export default CreditSpecialistGuideActions;
