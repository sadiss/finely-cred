import React, { useMemo, useState } from 'react';
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { highlightMissingLetterPlaceholders } from '../../lib/letterSenderBlock';
import { plainTextToHtml, sanitizeHtmlForPreview } from '../../utils/richText';
import { RichTextEditor } from '../ui/RichTextEditor';

const BRACKET_PLACEHOLDER_RE = /\[[A-Z0-9 #/.,&'-]+\]/g;

export function highlightBracketPlaceholders(text: string): string {
  return text.replace(
    BRACKET_PLACEHOLDER_RE,
    (m) =>
      `<mark class="fc-litigation-placeholder" style="color:#b91c1c;font-weight:600;background:#fef2f2;padding:1px 4px;border-radius:3px;border:1px solid #fecaca">${m}</mark>`,
  );
}

function textToPreviewHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n/g, '<br/>');
  return highlightBracketPlaceholders(withBreaks);
}

export type DebtLetterPreviewProps = {
  /** Plain-text letter body */
  text?: string;
  /** HTML letter body (dispute studio) */
  html?: string;
  letterDate?: string;
  senderLines?: string[];
  recipientName?: string;
  recipientAddress?: string;
  accent?: 'emerald' | 'fuchsia' | 'sky' | 'violet';
  compact?: boolean;
  showToolbar?: boolean;
  /**
   * When false (default for full debt/court drafts), do NOT re-print sender/recipient
   * above the body — the letter HTML already contains Sender → Date → Recipient once.
   * Set true only for body-only dispute fragments that need chrome headers.
   */
  showAddressChrome?: boolean;
};

export function DebtLetterPreview({
  text,
  html,
  letterDate,
  senderLines = [],
  recipientName,
  recipientAddress,
  accent = 'emerald',
  compact = false,
  showToolbar = true,
  showAddressChrome = false,
}: DebtLetterPreviewProps) {
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);

  const previewHtml = useMemo(() => {
    if (html?.trim()) {
      return highlightBracketPlaceholders(
        highlightMissingLetterPlaceholders(sanitizeHtmlForPreview(html)),
      );
    }
    return textToPreviewHtml(text || '');
  }, [html, text]);

  const accentBorder =
    accent === 'fuchsia'
      ? 'border-fuchsia-500/20 shadow-[0_0_40px_-12px_rgba(217,70,239,0.35)]'
      : accent === 'sky'
        ? 'border-sky-500/20 shadow-[0_0_40px_-12px_rgba(14,165,233,0.3)]'
        : accent === 'violet'
          ? 'border-violet-500/20 shadow-[0_0_40px_-12px_rgba(139,92,246,0.3)]'
          : 'border-emerald-500/20 shadow-[0_0_40px_-12px_rgba(16,185,129,0.3)]';

  return (
    <div className="space-y-2">
      {showToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-widest text-white/45">Paper preview</div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-black/30 text-white/60 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] text-white/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 bg-black/30 text-white/60 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setFull((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/30 text-[10px] font-bold uppercase tracking-widest text-white/65 hover:text-white"
            >
              {full ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {full ? 'Fit' : 'Expand'}
            </button>
          </div>
        </div>
      ) : null}

      <div className={`rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-black/30 p-2 sm:p-3 ${accentBorder}`}>
        <div
          className={`mx-auto transition-all duration-200 ${full ? 'max-w-[920px]' : 'max-w-[860px]'}`}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <div
            className={`rounded-sm border border-neutral-200/80 bg-white overflow-hidden shadow-2xl ${
              full ? 'min-h-[720px]' : compact ? 'h-[360px]' : 'h-[min(520px,58vh)]'
            }`}
          >
            <div className={`${full ? 'p-10 sm:p-12' : 'p-6 sm:p-8'} h-full overflow-y-auto`}>
              {showAddressChrome && (senderLines.length > 0 || letterDate) ? (
                <div className="mb-8 text-[11px] leading-relaxed text-black/85 font-serif border-b border-black/10 pb-6">
                  {senderLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                  {letterDate ? <div className="mt-4">{letterDate}</div> : null}
                </div>
              ) : null}

              {showAddressChrome && (recipientName || recipientAddress) ? (
                <div className="mb-8 text-[11px] leading-relaxed text-black/85 font-serif">
                  {recipientName ? <div className="font-semibold">{recipientName}</div> : null}
                  {recipientAddress ? (
                    <div className="whitespace-pre-wrap mt-1">{recipientAddress}</div>
                  ) : null}
                </div>
              ) : null}

              {html?.trim() ? (
                <div className="fc-paper-prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <div
                  className="fc-paper-prose whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-white/40">
        Red highlights mark missing fields — complete case intel (plaintiff attorney, county, loan ID) before mailing.
      </p>
    </div>
  );
}

/** Split editor + preview for debt letter drafts. */
export function DebtLetterDraftWorkspace({
  text,
  onTextChange,
  letterDate,
  senderLines,
  recipientName,
  recipientAddress,
  accent = 'emerald',
  editorLabel = 'Editor',
  minRows = 20,
  heroLayout = false,
}: {
  text: string;
  onTextChange: (text: string) => void;
  letterDate?: string;
  senderLines?: string[];
  recipientName?: string;
  recipientAddress?: string;
  accent?: 'emerald' | 'fuchsia' | 'sky' | 'violet';
  editorLabel?: string;
  minRows?: number;
  /** Paper preview first; editor in collapsible details */
  heroLayout?: boolean;
}) {
  const [view, setView] = useState<'split' | 'edit' | 'preview'>(heroLayout ? 'preview' : 'split');

  if (heroLayout) {
    return (
      <div className="space-y-3">
        <DebtLetterPreview
          text={text}
          letterDate={letterDate}
          senderLines={senderLines}
          recipientName={recipientName}
          recipientAddress={recipientAddress}
          accent={accent}
          compact={false}
        />
        <details className="rounded-xl border border-white/10 bg-black/25 !p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-white">{editorLabel} — edit body</summary>
          <div className="mt-3 space-y-2">
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={Math.min(minRows, 16)}
              className="w-full min-h-[200px] font-mono text-[13px] leading-relaxed rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white/90 focus:border-emerald-500/40 focus:outline-none"
              placeholder="Write your letter here…"
            />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-white/10 bg-black/25 w-fit">
        {(['split', 'edit', 'preview'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === v ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div
        className={`grid gap-4 ${
          view === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {view !== 'preview' ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-white/85">{editorLabel}</div>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              rows={minRows}
              className="w-full min-h-[280px] font-mono text-[13px] leading-relaxed rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white/90 focus:border-emerald-500/40 focus:outline-none"
              placeholder="Write your letter here…"
            />
          </div>
        ) : null}

        {view !== 'edit' ? (
          <DebtLetterPreview
            text={text}
            letterDate={letterDate}
            senderLines={senderLines}
            recipientName={recipientName}
            recipientAddress={recipientAddress}
            accent={accent}
          />
        ) : null}
      </div>
    </div>
  );
}

export function debtLetterPreviewHtmlFromText(text: string): string {
  return textToPreviewHtml(text);
}

export function debtLetterPreviewHtmlFromRich(html: string): string {
  return highlightBracketPlaceholders(highlightMissingLetterPlaceholders(sanitizeHtmlForPreview(html)));
}

/** Split rich-text editor + paper preview for debt/court letter drafts. */
export function DebtLetterRichDraftWorkspace({
  html,
  onChangeHtml,
  letterDate,
  senderLines,
  recipientName,
  recipientAddress,
  accent = 'emerald',
  editorLabel = 'Letter editor',
  minHeightPx = 280,
  heroLayout = false,
  showAddressChrome = false,
}: {
  html: string;
  onChangeHtml: (html: string) => void;
  letterDate?: string;
  senderLines?: string[];
  recipientName?: string;
  recipientAddress?: string;
  accent?: 'emerald' | 'fuchsia' | 'sky' | 'violet';
  editorLabel?: string;
  minHeightPx?: number;
  heroLayout?: boolean;
  /** Keep false for debt/court letters — body already has Sender → Date → Recipient. */
  showAddressChrome?: boolean;
}) {
  const [view, setView] = useState<'split' | 'edit' | 'preview'>(heroLayout ? 'preview' : 'edit');

  if (heroLayout) {
    return (
      <div className="space-y-3">
        <DebtLetterPreview
          html={html}
          letterDate={letterDate}
          senderLines={senderLines}
          recipientName={recipientName}
          recipientAddress={recipientAddress}
          accent={accent}
          compact={false}
          showAddressChrome={showAddressChrome}
        />
        <details open className="rounded-xl border border-white/10 bg-black/25 !p-3">
          <summary className="cursor-pointer select-none text-sm font-semibold text-white">Edit letter — full body editable</summary>
          <div className="mt-3">
            <RichTextEditor valueHtml={html} onChangeHtml={onChangeHtml} minHeightPx={minHeightPx} placeholder="Write your letter here…" />
          </div>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-white/10 bg-black/25 w-fit">
        {(['split', 'edit', 'preview'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              view === v ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${view === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {view !== 'preview' ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-white/85">{editorLabel}</div>
            <RichTextEditor valueHtml={html} onChangeHtml={onChangeHtml} minHeightPx={minHeightPx} placeholder="Write your letter here…" />
          </div>
        ) : null}

        {view !== 'edit' ? (
          <DebtLetterPreview
            html={html}
            letterDate={letterDate}
            senderLines={senderLines}
            recipientName={recipientName}
            recipientAddress={recipientAddress}
            accent={accent}
            showAddressChrome={showAddressChrome}
          />
        ) : null}
      </div>
    </div>
  );
}
