import React from 'react';
import { AlertTriangle, Loader2, Paperclip, X } from 'lucide-react';
import { formatAttachmentSize } from '../../lib/chatAttachments';
import { FINELY_OS_ENTITY_LABEL } from '../../features/os/finelyOsLightUi';

export type ChatAttachmentTrayItem = {
  id: string;
  filename: string;
  sizeBytes?: number;
  /** Saved locally but not shareable with the team yet. */
  warning?: string | null;
  /** Selected id we can no longer resolve in the vault. */
  missing?: boolean;
};

type Props = {
  items: ChatAttachmentTrayItem[];
  onRemove?: (id: string) => void;
  busy?: boolean;
  error?: string | null;
  onDismissError?: () => void;
  label?: string;
  className?: string;
};

/**
 * Pending-attachment confirmation for chat composers. Without this a partner picks
 * a file, sees nothing change, and assumes the attachment never went through.
 */
export function ChatAttachmentTray({
  items,
  onRemove,
  busy = false,
  error = null,
  onDismissError,
  label = 'Attached to this message',
  className = '',
}: Props) {
  const warned = items.filter((x) => x.warning);
  if (!items.length && !busy && !error) return null;

  return (
    <div className={`space-y-2 ${className}`} data-fc-chat-attachment-tray="1">
      {busy || items.length ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className={FINELY_OS_ENTITY_LABEL}>
              {busy && !items.length ? 'Uploading attachment' : `${label} · ${items.length}`}
            </span>
            {busy ? <Loader2 size={12} className="animate-spin text-emerald-300" /> : null}
          </div>
          {items.length ? (
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item.id}
                  className={
                    'inline-flex items-center gap-1.5 max-w-full px-2.5 py-1.5 rounded-lg border text-[11px] ' +
                    (item.missing
                      ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                      : item.warning
                        ? 'border-amber-400/40 bg-amber-500/10 text-amber-100'
                        : 'border-emerald-400/40 bg-emerald-500/12 text-emerald-50')
                  }
                  title={item.warning ?? item.filename}
                >
                  <Paperclip size={11} className="shrink-0" />
                  <span className="truncate max-w-[160px] font-medium">{item.filename}</span>
                  {item.sizeBytes ? (
                    <span className="text-white/45">{formatAttachmentSize(item.sizeBytes)}</span>
                  ) : null}
                  {item.warning ? <AlertTriangle size={11} className="shrink-0 text-amber-300" /> : null}
                  {onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="shrink-0 rounded p-0.5 text-white/55 hover:text-white hover:bg-white/10"
                      aria-label={`Remove ${item.filename}`}
                      title="Remove attachment"
                    >
                      <X size={11} />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {warned.map((item) => (
        <div
          key={`warn-${item.id}`}
          className="rounded-xl border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100"
        >
          {item.warning}
        </div>
      ))}

      {error ? (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100 flex items-start gap-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          {onDismissError ? (
            <button type="button" onClick={onDismissError} className="shrink-0 text-rose-200/70 hover:text-white" aria-label="Dismiss attachment error">
              <X size={12} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
