import React, { useRef, useState } from 'react';
import { Paperclip, Send, Smile, UploadCloud, X } from 'lucide-react';
import { FinelyPremiumEmojiPicker } from './FinelyPremiumEmojiPicker';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN } from '../../features/os/finelyOsLightUi';

export type FinelyChatComposeAttachment = {
  id: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  rows?: number;
  busy?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  attachments?: FinelyChatComposeAttachment[];
  selectedAttachmentIds?: string[];
  onToggleAttachment?: (id: string) => void;
  onUploadFile?: (file: File) => void | Promise<void>;
  uploadBusy?: boolean;
  uploadError?: string | null;
  compact?: boolean;
};

export function FinelyChatComposeBox({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write your message…',
  rows = 3,
  busy = false,
  disabled = false,
  submitLabel = 'Send',
  attachments = [],
  selectedAttachmentIds = [],
  onToggleAttachment,
  onUploadFile,
  uploadBusy = false,
  uploadError = null,
  compact = false,
}: Props) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${text}`);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled || busy) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="rounded-2xl border border-white/[0.08] bg-[#070b09]/90 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 2 : rows}
          className="w-full bg-transparent border-0 outline-none px-2 py-2 text-white text-sm resize-none placeholder:text-white/30"
        />
        <div className="flex flex-wrap items-center gap-2 px-1 pt-1 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setEmojiOpen((open) => !open)}
            className={
              'inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs transition-all ' +
              (emojiOpen
                ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100'
                : 'border-white/[0.08] text-white/70 hover:text-white hover:border-fuchsia-500/25')
            }
          >
            <Smile size={14} /> Emoji
          </button>
          {onUploadFile ? (
            <label className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-white/[0.08] text-xs text-white/70 hover:text-white cursor-pointer">
              <UploadCloud size={14} /> {uploadBusy ? 'Uploading…' : 'Upload'}
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*,application/pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadFile(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={!value.trim() || disabled || busy}
            className={`ml-auto ${FINELY_OS_PRIMARY_BTN} !py-2 !px-4 disabled:opacity-50`}
          >
            <Send size={14} /> {busy ? 'Sending…' : submitLabel}
          </button>
        </div>
      </div>

      {emojiOpen ? (
        <FinelyPremiumEmojiPicker
          onPick={(emoji) => {
            insertAtCursor(emoji);
            setEmojiOpen(false);
          }}
        />
      ) : null}

      {attachments.length && onToggleAttachment ? (
        <div className="flex flex-wrap gap-2">
          {attachments.map((item) => {
            const selected = selectedAttachmentIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleAttachment(item.id)}
                className={
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] transition-all ' +
                  (selected
                    ? 'border-fuchsia-500/45 bg-fuchsia-500/15 text-fuchsia-100'
                    : 'border-white/[0.08] text-white/55 hover:text-white/80')
                }
              >
                <Paperclip size={10} />
                {item.label}
                {selected ? <X size={10} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {uploadError ? <div className="text-xs text-rose-300">{uploadError}</div> : null}
      {!compact ? (
        <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
          Premium emoji studio, file uploads, and the same compose styling used across portal Team chat and admin messaging.
        </p>
      ) : null}
    </form>
  );
}
