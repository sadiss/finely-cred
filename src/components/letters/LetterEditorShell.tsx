import React, { useState } from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';
import { DebtLetterPreview, type DebtLetterPreviewProps } from './DebtLetterPreview';

export type LetterEditorShellProps = {
  html: string;
  onChangeHtml: (html: string) => void;
  accent?: DebtLetterPreviewProps['accent'];
  editorLabel?: string;
  /** Minimum editor height — unified letter editor default 480px. */
  minHeightPx?: number;
  placeholder?: string;
  disabled?: boolean;
  previewCompact?: boolean;
  showAddressChrome?: boolean;
  letterDate?: string;
  senderLines?: string[];
  recipientName?: string;
  recipientAddress?: string;
  initialView?: 'split' | 'edit' | 'preview';
  showViewToggle?: boolean;
  className?: string;
  previewResetKey?: string;
};

/** Unified rich-text editor + paper preview (toolbar on top, side-by-side on large screens). */
export function LetterEditorShell({
  html,
  onChangeHtml,
  accent = 'emerald',
  editorLabel = 'Letter editor',
  minHeightPx = 480,
  placeholder = 'Write your letter here…',
  disabled = false,
  previewCompact = false,
  showAddressChrome = false,
  letterDate,
  senderLines,
  recipientName,
  recipientAddress,
  initialView = 'split',
  showViewToggle = true,
  className = '',
  previewResetKey,
}: LetterEditorShellProps) {
  const [view, setView] = useState<'split' | 'edit' | 'preview'>(initialView);

  React.useEffect(() => {
    if (!previewResetKey) return;
    setView(initialView);
  }, [previewResetKey, initialView]);

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {showViewToggle ? (
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
      ) : null}

      <div className={`grid gap-3 ${view === 'split' ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {view !== 'preview' ? (
          <div className="space-y-2 min-w-0">
            {editorLabel ? <div className="text-sm font-semibold text-white/85">{editorLabel}</div> : null}
            <RichTextEditor
              valueHtml={html}
              onChangeHtml={onChangeHtml}
              minHeightPx={minHeightPx}
              placeholder={placeholder}
              disabled={disabled}
            />
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
            compact={previewCompact}
            showAddressChrome={showAddressChrome}
          />
        ) : null}
      </div>
    </div>
  );
}
